import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  createState, addClue, applyDeductions, recordFailedAttempt, isLocked, unlock, isUnlocked, MAX_ATTEMPTS,
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
