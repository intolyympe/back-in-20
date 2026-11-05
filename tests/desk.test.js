import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DESK_OBJECTS, verbFor } from '../js/scenes/desk.js';

const objects = Object.entries(DESK_OBJECTS);

test('every desk object has a hover verb', () => {
  for (const [id, object] of objects) {
    assert.ok(verbFor(object), id);
    if (object.verbs) assert.ok(verbFor(object, true), id);
  }
});

test('clue ids are unique across the desk', () => {
  const ids = objects.flatMap(([, object]) => (object.clues ?? []).map(clue => clue.id));
  assert.equal(new Set(ids).size, ids.length, ids.join(', '));
});

test('every clue has some text for the notebook', () => {
  for (const [id, object] of objects) {
    for (const clue of object.clues ?? []) assert.ok(clue.text.trim(), `${id}/${clue.id}`);
  }
});
