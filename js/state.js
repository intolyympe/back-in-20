// Game state: what the player has found, unlocked, and left behind. No DOM
// here, so it can be tested with node.
//
// Times (`now`) are milliseconds since the round started: they stop when the
// round is paused, like the countdown.

export const ROUND_MINUTES = 20;
export const MAX_ATTEMPTS = 5;
export const LOCKOUT_MS = 60_000;

/**
 * @param {object} [start]
 * @param {object[]} [start.photos] photos already on Camille's phone
 * @param {object[]} [start.emails] e-mails already in her inbox
 */
export function createState({ photos = [], emails = [] } = {}) {
  return {
    clues: [],           // {id, text, deduction?, done?}, in the order found
    unlocked: new Set(), // devices or accounts open right now
    cracked: new Set(),  // devices or accounts the player got into at least once
    attempts: {},        // device id -> wrong tries since the last lockout
    lockedUntil: {},     // device id -> time the lockout ends
    photos: [...photos], // phone gallery, newest first
    trash: [],           // "Supprimés récemment"
    // Her mailbox, the same on the phone and on the PC. Security alerts
    // land here too ({id, alert, sentAt}).
    inbox: [...emails],  // newest first
    mailTrash: [],       // the mailbox's "Corbeille"
    erasedEmails: [],    // her own e-mails gone for good (she may miss them)
    alertCount: 0,
    // Her Bulle account, taken over through her mailbox.
    bulle: { linkOpened: false, passwordChanged: false },
    // Her bank: the secret question, then a code sent by text to her phone.
    bank: { answered: false, code: null },
    texts: [],           // texts received during the round ({id, code, sentAt})
  };
}

/** Adds a clue to the notebook. Returns false if it was already there. */
export function addClue(state, clue) {
  if (state.clues.some(c => c.id === clue.id)) return false;
  state.clues.push(clue);
  return true;
}

/** Ticks off a notebook entry (a task done). Returns false if nothing changed. */
/**
 * Ticks a notebook entry off (or back on, with done = false). Returns
 * whether it changed.
 */
export function markDone(state, clueId, done = true) {
  const clue = state.clues.find(c => c.id === clueId);
  if (!clue || Boolean(clue.done) === done) return false;
  clue.done = done;
  return true;
}

/**
 * Adds the conclusion of every deduction whose clues have all been found.
 * Returns the deductions just added (marked `deduction: true`).
 */
export function applyDeductions(state, deductions) {
  const found = new Set(state.clues.map(c => c.id));
  return deductions
    .filter(d => d.from.every(id => found.has(id)))
    .map(d => ({ id: d.id, text: d.text, deduction: true }))
    .filter(clue => addClue(state, clue));
}

/**
 * Counts a wrong code on a device. After MAX_ATTEMPTS it is locked out for
 * LOCKOUT_MS, then the player gets MAX_ATTEMPTS new tries.
 */
export function recordFailedAttempt(state, deviceId, now) {
  const attempts = (state.attempts[deviceId] || 0) + 1;
  if (attempts < MAX_ATTEMPTS) {
    state.attempts[deviceId] = attempts;
    return { attempts, left: MAX_ATTEMPTS - attempts, lockedOut: false };
  }
  state.attempts[deviceId] = 0;
  state.lockedUntil[deviceId] = now + LOCKOUT_MS;
  return { attempts, left: 0, lockedOut: true };
}

/** Milliseconds left before the device accepts codes again (0 if it does). */
export function lockRemaining(state, deviceId, now) {
  return Math.max(0, (state.lockedUntil[deviceId] ?? 0) - now);
}

export function unlock(state, deviceId) {
  state.unlocked.add(deviceId);
  state.cracked.add(deviceId);
  state.attempts[deviceId] = 0;
}

/** Locks a device again (the player's way of tidying up). */
export function relock(state, deviceId) {
  return state.unlocked.delete(deviceId);
}

export function isUnlocked(state, deviceId) {
  return state.unlocked.has(deviceId);
}

/** Did the player get into it at least once, even if it is locked again? */
export function hasCracked(state, deviceId) {
  return state.cracked.has(deviceId);
}

/**
 * The phone's front camera catches whoever failed too many times, and an
 * alert goes to Camille's mailbox. Returns the photo.
 */
export function takeIntruderPhoto(state, now) {
  const n = state.photos.filter(p => p.intruder).length + state.trash.filter(p => p.intruder).length + 1;
  const photo = { id: `intruder-${n}-${now}`, intruder: true, takenAt: now };
  state.photos.unshift(photo);
  sendAlert(state, 'phone', now);
  return photo;
}

/**
 * A security e-mail lands in Camille's inbox: 'phone' (too many wrong PIN
 * codes), 'login' (too many wrong mailbox passwords), 'bulle-reset' (a
 * password reset link), 'bulle-changed' (her Bulle password was changed) or
 * 'bank-login' (someone signed in to her bank).
 * Returns it.
 */
export function sendAlert(state, kind, now) {
  state.alertCount += 1;
  const email = { id: `alert-${state.alertCount}`, alert: kind, sentAt: now };
  state.inbox.unshift(email);
  return email;
}

/** "Mot de passe oublié ?" on Bulle: the reset link goes to her mailbox. */
export function requestBulleReset(state, now) {
  return sendAlert(state, 'bulle-reset', now);
}

/** The reset link was opened: Bulle now asks for a new password. */
export function openBulleResetLink(state) {
  state.bulle.linkOpened = true;
}

/**
 * The player sets a new Bulle password and is logged in. Bulle tells Camille
 * by e-mail, and her old password no longer works: she will notice.
 */
export function changeBullePassword(state, now) {
  if (!state.bulle.linkOpened) return false;
  state.bulle.passwordChanged = true;
  unlock(state, 'bulle');
  sendAlert(state, 'bulle-changed', now);
  return true;
}

// Accents and case do not matter in an answer: "annecy" is "Annecy".
const plain = text => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();

/** Her bank's secret question. Returns whether the answer is right. */
export function answerSecretQuestion(state, answer, expected) {
  if (plain(answer) !== plain(expected)) return false;
  state.bank.answered = true;
  return true;
}

/**
 * Once the question is answered, the bank texts a code to her phone.
 * Returns the text, or null if the question was not answered.
 */
export function sendBankCode(state, now, code) {
  if (!state.bank.answered) return null;
  state.bank.code = code;
  const text = { id: `text-${state.texts.length + 1}-${now}`, code, sentAt: now };
  state.texts.unshift(text);
  return text;
}

/** The code from the text opens her account, and the bank e-mails her. */
export function verifyBankCode(state, code, now) {
  if (!state.bank.code || code.trim() !== state.bank.code) return false;
  unlock(state, 'bank');
  sendAlert(state, 'bank-login', now);
  return true;
}

/** Deletes the bank's texts from her Messages app. */
export function deleteBankTexts(state) {
  state.texts = [];
}

/** Moves an e-mail from the inbox to the mailbox's "Corbeille". */
export function deleteEmail(state, emailId) {
  const index = state.inbox.findIndex(e => e.id === emailId);
  if (index === -1) return false;
  state.mailTrash.unshift(...state.inbox.splice(index, 1));
  return true;
}

/** Empties the mailbox's "Corbeille": those e-mails are gone for good. */
export function emptyMailTrash(state) {
  for (const email of state.mailTrash) if (!email.alert) state.erasedEmails.push(email.id);
  state.mailTrash = [];
}

/** Moves a photo from the gallery to "Supprimés récemment". */
export function deletePhoto(state, photoId) {
  const index = state.photos.findIndex(p => p.id === photoId);
  if (index === -1) return false;
  state.trash.unshift(...state.photos.splice(index, 1));
  return true;
}

/** Empties "Supprimés récemment": those photos are gone for good. */
export function emptyTrash(state) {
  state.trash = [];
}

/** What Camille would find if she came back now. */
export function leftoverTraces(state) {
  return {
    intruderPhotos: [...state.photos, ...state.trash].filter(p => p.intruder).length,
    alerts: [...state.inbox, ...state.mailTrash].filter(e => e.alert).length,
    // Her own e-mails deleted: missing from her inbox.
    missingEmails: state.mailTrash.filter(e => !e.alert).length + state.erasedEmails.length,
    openPc: state.unlocked.has('pc'), // she would find her session open
    // Her old Bulle password no longer works: nothing can hide that.
    bullePasswordChanged: state.bulle.passwordChanged,
    bankTexts: state.texts.length,
  };
}
