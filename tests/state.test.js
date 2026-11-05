import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  createState, addClue, markDone, applyDeductions, recordFailedAttempt, lockRemaining,
  unlock, isUnlocked, takeIntruderPhoto, deletePhoto, emptyTrash, leftoverTraces,
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

test('an intruder photo lands first in the gallery and sends an alert', () => {
  const state = createState({ photos: [{ id: 'rex' }] });
  const photo = takeIntruderPhoto(state, 5000);
  assert.deepEqual(photo, { id: 'intruder-1', intruder: true, takenAt: 5000 });
  assert.deepEqual(state.photos.map(p => p.id), ['intruder-1', 'rex']);
  assert.deepEqual(state.alerts, [{ id: 'alert-1', photoId: 'intruder-1', sentAt: 5000 }]);
  assert.equal(takeIntruderPhoto(state, 9000).id, 'intruder-2');
});

test('a deleted photo waits in "Supprimés récemment" until it is emptied', () => {
  const state = createState({ photos: [{ id: 'rex' }] });
  takeIntruderPhoto(state, 0);
  assert.deepEqual(leftoverTraces(state), { intruderPhotos: 1, alerts: 1 });

  assert.equal(deletePhoto(state, 'intruder-1'), true);
  assert.deepEqual(state.photos.map(p => p.id), ['rex']);
  assert.deepEqual(state.trash.map(p => p.id), ['intruder-1']);
  assert.deepEqual(leftoverTraces(state), { intruderPhotos: 1, alerts: 1 }, 'still on the phone');

  emptyTrash(state);
  assert.deepEqual(leftoverTraces(state), { intruderPhotos: 0, alerts: 1 }, 'the e-mail is still there');
  assert.equal(deletePhoto(state, 'intruder-1'), false);
});

test('the photos the phone starts with are not shared between games', () => {
  const photos = [{ id: 'rex' }];
  const state = createState({ photos });
  deletePhoto(state, 'rex');
  assert.deepEqual(photos.map(p => p.id), ['rex']);
});
