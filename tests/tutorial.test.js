import { test } from 'node:test';
import assert from 'node:assert/strict';
import { STEPS, nextStep } from '../js/tutorial.js';

test('the tutorial goes open, note, photo, put down, and only on the right gesture', () => {
  assert.deepEqual(STEPS.map(s => s.waitFor), ['open', 'note', 'photo', 'close']);
  let step = 0;
  step = nextStep(step, 'photo');
  assert.equal(step, 0, 'a photo before opening does not count');
  for (const event of ['open', 'note', 'photo', 'close']) step = nextStep(step, event);
  assert.equal(step, STEPS.length);
  assert.equal(nextStep(step, 'open'), STEPS.length, 'done stays done');
});
