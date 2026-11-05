import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DESK_OBJECTS, verbFor } from '../js/scenes/desk.js';
import { CALENDAR_CLUES } from '../js/scenes/calendar.js';
import { PHONE, PC, MAIL, BULLE, STORY_START } from '../js/data/camille.js';

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

test('clue ids are unique across the desk, the calendar and the phone', () => {
  const clues = [
    ...objects.flatMap(([, object]) => object.clues ?? []),
    ...Object.values(CALENDAR_CLUES),
    ...PHONE.photos.map(photo => photo.clue),
    ...PHONE.threads.map(thread => thread.clue),
    ...PHONE.notes.map(note => note.clue),
    ...PC.notes.map(note => note.clue),
    ...MAIL.emails.map(email => email.clue),
    ...BULLE.posts.map(post => post.clue),
    BULLE.chat.clue,
  ].filter(Boolean);
  const ids = clues.map(clue => clue.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const clue of clues) assert.ok(clue.text.trim(), clue.id);
});

test('the phone gallery is newest first and nothing is dated after today', () => {
  const dates = PHONE.photos.map(({ date: [y, m, d] }) => new Date(y, m - 1, d));
  for (let i = 1; i < dates.length; i++) assert.ok(dates[i] <= dates[i - 1], PHONE.photos[i].id);
  assert.ok(dates[0] <= STORY_START);
});

test('the PC password follows the rule in her notes and comes from the clues', () => {
  const { password } = PC;
  assert.ok(password.length >= 8, '8 characters');
  assert.match(password, /[A-Z]/, 'a capital');
  assert.match(password, /[0-9]/, 'a digit');
  assert.match(password, /[^A-Za-z0-9]/, 'a special character');
  assert.ok(password.startsWith('Rex') && password.includes('2019'), 'dog + year he arrived');
});

test('her mailbox password is the PC one: that is the mistake', () => {
  assert.equal(MAIL.password, PC.password);
  assert.ok(PC.notes.some(note => note.lines.some(line => line.includes('même mdp que le PC'))));
});
