import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  createState, addClue, recordFailedAttempt, isLocked, unlock, isUnlocked, MAX_ATTEMPTS,
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

test(`a device locks after ${MAX_ATTEMPTS} wrong tries`, () => {
  const state = createState();
  for (let i = 1; i < MAX_ATTEMPTS; i++) {
    assert.deepEqual(recordFailedAttempt(state, 'phone'), { attempts: i, locked: false });
  }
  assert.equal(isLocked(state, 'phone'), false);
  assert.deepEqual(recordFailedAttempt(state, 'phone'), { attempts: MAX_ATTEMPTS, locked: true });
  assert.equal(isLocked(state, 'phone'), true);
  assert.equal(isLocked(state, 'laptop'), false);
});

test('unlocking is tracked per device', () => {
  const state = createState();
  unlock(state, 'phone');
  assert.equal(isUnlocked(state, 'phone'), true);
  assert.equal(isUnlocked(state, 'laptop'), false);
});
