import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  createState, addClue, markDone, applyDeductions, recordFailedAttempt, lockRemaining,
  unlock, relock, isUnlocked, hasCracked, takeIntruderPhoto, deletePhoto, emptyTrash, leftoverTraces,
  sendAlert, deleteEmail, emptyMailTrash, requestBulleReset, openBulleResetLink, changeBullePassword,
  MAX_ATTEMPTS, LOCKOUT_MS,
} from '../js/state.js';

test('a clue is added once', () => {
  const state = createState();
  assert.equal(addClue(state, { id: 'dog', text: 'Son chien : Rex' }), true);
  assert.equal(addClue(state, { id: 'dog', text: 'Son chien : Rex' }), false);
  assert.deepEqual(state.clues.map(c => c.id), ['dog']);
});

test('clues keep the order they were found in', () => {
  const state = createState();
  addClue(state, { id: 'b', text: 'B' });
  addClue(state, { id: 'a', text: 'A' });
  assert.deepEqual(state.clues.map(c => c.id), ['b', 'a']);
});

test('a notebook entry is ticked off once', () => {
  const state = createState();
  addClue(state, { id: 'task', text: 'À faire' });
  assert.equal(markDone(state, 'task'), true);
  assert.equal(markDone(state, 'task'), false);
  assert.equal(markDone(state, 'unknown'), false);
  assert.equal(state.clues[0].done, true);
  assert.equal(markDone(state, 'task', false), true, 'and back on');
  assert.equal(state.clues[0].done, false);
});

test('a deduction is written once all its clues are found', () => {
  const state = createState();
  const deductions = [{ id: 'birthday', from: ['cake', 'card'], text: '14/11 !' }];
  addClue(state, { id: 'cake', text: 'Un gâteau le 14/11' });
  assert.deepEqual(applyDeductions(state, deductions), []);
  addClue(state, { id: 'card', text: 'Une carte d’anniversaire' });
  assert.deepEqual(applyDeductions(state, deductions), [{ id: 'birthday', text: '14/11 !', deduction: true }]);
  assert.deepEqual(applyDeductions(state, deductions), [], 'only once');
  assert.deepEqual(state.clues.map(c => c.id), ['cake', 'card', 'birthday']);
});

test('a conclusion reached two ways is written once, with the first way found', () => {
  const state = createState();
  const deductions = [
    { id: 'dog', from: ['vet', 'wallpaper'], text: 'par le calendrier' },
    { id: 'dog', from: ['photo', 'wallpaper'], text: 'par la photo' },
  ];
  addClue(state, { id: 'wallpaper', text: 'Un chiot' });
  addClue(state, { id: 'photo', text: 'Bienvenue Rex' });
  assert.deepEqual(applyDeductions(state, deductions), [{ id: 'dog', text: 'par la photo', deduction: true }]);
  addClue(state, { id: 'vet', text: 'Véto Rex' });
  assert.deepEqual(applyDeductions(state, deductions), [], 'already written');
});

test(`the phone locks for a minute after ${MAX_ATTEMPTS} wrong codes`, () => {
  const state = createState();
  for (let i = 1; i < MAX_ATTEMPTS; i++) {
    assert.deepEqual(recordFailedAttempt(state, 'phone', 1000), { attempts: i, left: MAX_ATTEMPTS - i, lockedOut: false });
  }
  assert.equal(lockRemaining(state, 'phone', 1000), 0);
  assert.deepEqual(recordFailedAttempt(state, 'phone', 1000), { attempts: MAX_ATTEMPTS, left: 0, lockedOut: true });
  assert.equal(lockRemaining(state, 'phone', 1000), LOCKOUT_MS);
  assert.equal(lockRemaining(state, 'phone', 1000 + LOCKOUT_MS - 1), 1);
  assert.equal(lockRemaining(state, 'phone', 1000 + LOCKOUT_MS), 0);
  assert.equal(lockRemaining(state, 'laptop', 1000), 0, 'other devices are not locked');
});

test('after a lockout the player gets fresh tries', () => {
  const state = createState();
  for (let i = 0; i < MAX_ATTEMPTS; i++) recordFailedAttempt(state, 'phone', 0);
  assert.deepEqual(recordFailedAttempt(state, 'phone', LOCKOUT_MS), { attempts: 1, left: MAX_ATTEMPTS - 1, lockedOut: false });
});

test('unlocking is tracked per device', () => {
  const state = createState();
  unlock(state, 'phone');
  assert.equal(isUnlocked(state, 'phone'), true);
  assert.equal(isUnlocked(state, 'laptop'), false);
});

test('a device locked again stays cracked, and an open PC is a trace', () => {
  const state = createState();
  unlock(state, 'pc');
  assert.equal(leftoverTraces(state).openPc, true);
  assert.equal(relock(state, 'pc'), true);
  assert.equal(isUnlocked(state, 'pc'), false);
  assert.equal(hasCracked(state, 'pc'), true);
  assert.equal(leftoverTraces(state).openPc, false);
});

test('an intruder photo lands first in the gallery and sends an alert', () => {
  const state = createState({ photos: [{ id: 'rex' }], emails: [{ id: 'julie' }] });
  const photo = takeIntruderPhoto(state, 5000);
  assert.equal(photo.intruder, true);
  assert.equal(photo.takenAt, 5000);
  assert.deepEqual(state.photos.map(p => p.id), [photo.id, 'rex']);
  assert.deepEqual(state.inbox, [{ id: 'alert-1', alert: 'phone', sentAt: 5000 }, { id: 'julie' }]);
  assert.notEqual(takeIntruderPhoto(state, 9000).id, photo.id);
  assert.equal(state.inbox[0].id, 'alert-2');
});

test('a deleted photo waits in "Supprimés récemment" until it is emptied', () => {
  const state = createState({ photos: [{ id: 'rex' }] });
  const { id } = takeIntruderPhoto(state, 0);
  const traces = { intruderPhotos: 1, alerts: 1, missingEmails: 0, openPc: false, bullePasswordChanged: false };
  assert.deepEqual(leftoverTraces(state), traces);

  assert.equal(deletePhoto(state, id), true);
  assert.deepEqual(state.photos.map(p => p.id), ['rex']);
  assert.deepEqual(state.trash.map(p => p.id), [id]);
  assert.deepEqual(leftoverTraces(state), traces, 'still on the phone');

  emptyTrash(state);
  assert.deepEqual(leftoverTraces(state), { ...traces, intruderPhotos: 0 }, 'the e-mail is still there');
  assert.equal(deletePhoto(state, id), false);
});

test('an alert e-mail is only gone once the mailbox trash is emptied', () => {
  const state = createState({ emails: [{ id: 'julie' }] });
  sendAlert(state, 'login', 0);
  assert.equal(leftoverTraces(state).alerts, 1);
  assert.equal(deleteEmail(state, 'alert-1'), true);
  assert.deepEqual(state.mailTrash.map(e => e.id), ['alert-1']);
  assert.equal(leftoverTraces(state).alerts, 1, 'still in the trash');
  emptyMailTrash(state);
  assert.equal(leftoverTraces(state).alerts, 0);
  assert.equal(leftoverTraces(state).missingEmails, 0);
  assert.equal(deleteEmail(state, 'nope'), false);
});

test('deleting her own e-mails leaves a gap she can notice', () => {
  const state = createState({ emails: [{ id: 'julie' }, { id: 'bank' }] });
  deleteEmail(state, 'julie');
  assert.equal(leftoverTraces(state).missingEmails, 1, 'missing from the inbox');
  emptyMailTrash(state);
  assert.equal(leftoverTraces(state).missingEmails, 1, 'and gone for good');
  assert.deepEqual(state.inbox.map(e => e.id), ['bank']);
});

test('the photos the phone starts with are not shared between games', () => {
  const photos = [{ id: 'rex' }];
  const state = createState({ photos });
  deletePhoto(state, 'rex');
  assert.deepEqual(photos.map(p => p.id), ['rex']);
});

test('her Bulle account is taken over through her mailbox, and it shows', () => {
  const state = createState();
  assert.equal(changeBullePassword(state, 0), false, 'not without the reset link');
  requestBulleReset(state, 1000);
  assert.deepEqual(state.inbox.map(e => e.alert), ['bulle-reset']);
  openBulleResetLink(state);
  assert.equal(changeBullePassword(state, 2000), true);
  assert.equal(isUnlocked(state, 'bulle'), true);
  assert.deepEqual(state.inbox.map(e => e.alert), ['bulle-changed', 'bulle-reset']);
  const traces = leftoverTraces(state);
  assert.equal(traces.alerts, 2);
  assert.equal(traces.bullePasswordChanged, true);
});
