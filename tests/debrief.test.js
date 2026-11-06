import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LESSONS } from '../js/data/debrief.js';

test('the debrief has one lesson per chapter, then the boss', () => {
  assert.deepEqual(LESSONS.map(l => l.device), ['phone', 'pc', 'mail', 'bulle', 'bank', 'vault']);
  for (const lesson of LESSONS) {
    assert.ok(lesson.mistake.trim() && lesson.fix.trim(), lesson.device);
    assert.ok(lesson.clue && lesson.key, `${lesson.device} domino`);
    if (lesson.device !== 'vault') assert.ok(lesson.missed, `${lesson.device} tells where the key was`);
  }
});

test('the report jokes about useless photos', async () => {
  const { uselessSummary } = await import('../js/debrief.js');
  assert.equal(uselessSummary([{ kind: 'access', id: 'mail' }]), '');
  assert.equal(
    uselessSummary([{ kind: 'useless', id: 'plant' }, { kind: 'useless', id: 'plant' }, { kind: 'useless', id: 'mug' }]),
    '3 photos inutiles (la plante ×2, la tasse). La direction s’interroge.',
  );
});
