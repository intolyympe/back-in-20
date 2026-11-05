// "Défendre Camille": the player sets her new defences, then a ghost replays
// the attack, door after door. It keeps what it already took (an open phone
// receives the texted codes, an open PC shows the « Codes » note), and stops
// at the first door that holds. No DOM here: tested with node.

import { analyze } from '../engine/strength.js';
import { buildPersonalDictionary } from '../engine/personal.js';

// What anyone who went through her desk, phone and Bulle knows about her:
// the ghost tries these first.
export const PERSONAL = buildPersonalDictionary({
  firstName: 'Camille',
  birthDate: '1996-11-14',
  city: 'Annecy, Lyon',
  closeOnes: 'Rex, Léa, Julie, Hugo, Moka',
  username: 'cam.et.rex',
  other: '2019, 1411, Norvège, Bretagne',
});

export const DOORS = ['phone', 'pc', 'mail', 'bulle', 'bank'];

// Strong enough for a password the ghost cannot try ('good' in the engine).
const MIN_PASSWORD_BITS = 55;
// A random 6-digit code is ~20 bits; with 5 tries before a lockout, enough.
const MIN_PIN_BITS = 19;

/** The defences Camille starts with: the ones the player just broke. */
export const WEAK_CHOICES = {
  pin: '1411',
  pcPassword: 'Rex2019!',
  mail: 'same',       // 'same' as the PC, 'noted' in « Codes », 'vault'
  bulle: 'none',      // second factor: 'none', 'sms', 'app', 'key'
  bankAnswer: 'true', // her real birth town, or a random 'fake' one
  bank: 'sms',        // second factor: 'sms', 'app', 'key'
};

/** How a code holds up. Returns {ok, reason}. */
export function checkPin(pin) {
  if (!/^\d+$/.test(pin)) return { ok: false, reason: 'digits' };
  if (pin.length < 6) return { ok: false, reason: 'short' };
  const result = analyze(pin, { personal: PERSONAL });
  const warning = result.warnings[0]?.code;
  if (warning) return { ok: false, reason: warning };
  if (result.bits < MIN_PIN_BITS) return { ok: false, reason: 'guessable' };
  return { ok: true, reason: 'random' };
}

/** How a password holds up. Returns {ok, reason, bits}. */
export function checkPassword(password) {
  const result = analyze(password, { personal: PERSONAL });
  const bits = Math.round(result.bits);
  if (result.warnings.some(w => w.code === 'personal')) return { ok: false, reason: 'personal', bits };
  if (result.bits < MIN_PASSWORD_BITS) return { ok: false, reason: 'weak', bits };
  return { ok: true, reason: 'strong', bits };
}

/**
 * Replays the attack against the defences.
 * @returns {{steps: {door: string, open: boolean, why: string}[], stoppedAt: string|null}}
 *   `steps` are the doors the ghost reached, in order; `stoppedAt` is the
 *   door that held, or null if it went all the way.
 */
export function replayAttack(choices) {
  const has = new Set(); // doors the ghost opened so far
  const steps = [];

  const tryDoor = {
    phone: () => {
      const { ok, reason } = checkPin(choices.pin);
      return { open: !ok, why: reason };
    },
    pc: () => {
      const { ok, reason } = checkPassword(choices.pcPassword);
      return { open: !ok, why: reason };
    },
    mail: () => {
      if (choices.mail === 'vault') return { open: false, why: 'unique' };
      // Same as the PC, or written on it: only if the PC fell.
      return has.has('pc') ? { open: true, why: choices.mail } : { open: false, why: `${choices.mail}-pc-held` };
    },
    bulle: () => {
      if (choices.bulle === 'key') return { open: false, why: 'key' };
      if (choices.bulle === 'none') return { open: true, why: 'none' };
      // A code by text or in an app: on the phone, if the ghost holds it.
      return has.has('phone') ? { open: true, why: `${choices.bulle}-phone` } : { open: false, why: `${choices.bulle}-phone-held` };
    },
    bank: () => {
      if (choices.bankAnswer === 'fake') return { open: false, why: 'fake-answer' };
      if (!has.has('bulle')) return { open: false, why: 'answer-hidden' };
      if (choices.bank === 'key') return { open: false, why: 'key' };
      return has.has('phone') ? { open: true, why: `${choices.bank}-phone` } : { open: false, why: `${choices.bank}-phone-held` };
    },
  };

  for (const door of DOORS) {
    const { open, why } = tryDoor[door]();
    steps.push({ door, open, why });
    if (!open) return { steps, stoppedAt: door };
    has.add(door);
  }
  return { steps, stoppedAt: null };
}
