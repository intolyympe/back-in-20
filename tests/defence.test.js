import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkPin, checkPassword, replayAttack, WEAK_CHOICES } from '../js/defence.js';

test('her old defences let the ghost all the way through', () => {
  const { steps, stoppedAt } = replayAttack(WEAK_CHOICES);
  assert.equal(stoppedAt, null);
  assert.deepEqual(steps.map(s => s.open), [true, true, true, true, true]);
});

test('codes: birthdays, dates, short or common ones fall; a random one holds', () => {
  assert.equal(checkPin('1411').reason, 'short');
  assert.equal(checkPin('141196').reason, 'personal');
  assert.equal(checkPin('140796').reason, 'date');
  assert.equal(checkPin('123456').reason, 'commonPassword');
  assert.equal(checkPin('14a196').reason, 'digits');
  assert.equal(checkPin('839201').ok, true);
});

test('passwords: anything from her life falls, a long random one holds', () => {
  assert.equal(checkPassword('Rex2019!').reason, 'personal');
  assert.equal(checkPassword('Annecy-Lyon-2026!').reason, 'personal');
  assert.equal(checkPassword('azerty').ok, false);
  assert.equal(checkPassword('appealing-line-saddled-antitrust-serve').ok, true);
});

test('a strong phone code stops the ghost at the first door', () => {
  const { steps, stoppedAt } = replayAttack({ ...WEAK_CHOICES, pin: '839201' });
  assert.equal(stoppedAt, 'phone');
  assert.equal(steps.length, 1);
});

test('the ghost keeps what it took: a held phone protects the texted codes', () => {
  const choices = { ...WEAK_CHOICES, pin: '839201' };
  // It never gets past the phone, so nothing else is tried.
  assert.equal(replayAttack(choices).steps.length, 1);
  // With the phone open, a code by text is no help at the bank…
  const weakBank = replayAttack({ ...WEAK_CHOICES, bank: 'sms' });
  assert.equal(weakBank.steps.at(-1).open, true);
  // …but a key or a made-up answer is.
  assert.equal(replayAttack({ ...WEAK_CHOICES, bank: 'key' }).stoppedAt, 'bank');
  assert.equal(replayAttack({ ...WEAK_CHOICES, bankAnswer: 'fake' }).stoppedAt, 'bank');
});

test('a unique mailbox password holds even when the PC falls', () => {
  assert.equal(replayAttack({ ...WEAK_CHOICES, mail: 'vault' }).stoppedAt, 'mail');
  assert.equal(replayAttack({ ...WEAK_CHOICES, mail: 'noted' }).steps[2].open, true, 'the note is on the open PC');
});

test('a security key on Bulle holds', () => {
  assert.equal(replayAttack({ ...WEAK_CHOICES, bulle: 'key' }).stoppedAt, 'bulle');
  assert.equal(replayAttack({ ...WEAK_CHOICES, bulle: 'app' }).steps[3].open, true, 'the app is on the open phone');
});

test('every outcome of the ghost has words', async () => {
  const { WHY, DOOR_TEXT } = await import('../js/data/defence.js');
  const { DOORS } = await import('../js/defence.js');
  assert.deepEqual(Object.keys(DOOR_TEXT), DOORS);
  const reasons = ['digits', 'short', 'personal', 'date', 'commonPassword', 'guessable', 'random', 'weak', 'strong',
    'same', 'noted', 'same-pc-held', 'noted-pc-held', 'unique', 'none', 'sms-phone', 'app-phone',
    'sms-phone-held', 'app-phone-held', 'key', 'fake-answer', 'answer-hidden'];
  for (const reason of reasons) assert.ok(WHY[reason], reason);
});
