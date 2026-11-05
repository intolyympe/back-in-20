import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LESSONS } from '../js/data/debrief.js';

test('the debrief has one lesson per chapter, then the boss', () => {
  assert.deepEqual(LESSONS.map(l => l.device), ['phone', 'pc', 'mail', 'bulle', 'bank', 'vault']);
  for (const lesson of LESSONS) {
    assert.ok(lesson.mistake.trim() && lesson.fix.trim(), lesson.device);
  }
});
