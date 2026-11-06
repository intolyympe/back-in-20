import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DESK_OBJECTS, verbFor } from '../js/scenes/desk.js';
import { ALL_CLUES } from '../js/clues.js';
import { PHONE, PC, MAIL, BULLE, BANK, STORY_START } from '../js/data/camille.js';

const objects = Object.entries(DESK_OBJECTS);

test('every desk object has a hover verb', () => {
  for (const [id, object] of objects) {
    assert.ok(verbFor(object), id);
    if (object.verbs) assert.ok(verbFor(object, true), id);
  }
});

test('every clue the player can note has a unique id and some text', () => {
  const ids = ALL_CLUES.map(clue => clue.id);
  assert.equal(new Set(ids).size, ids.length, ids.join(', '));
  for (const clue of ALL_CLUES) assert.ok(clue.text.trim(), clue.id);
});

test('the key clues can all be noted somewhere', () => {
  const ids = new Set(ALL_CLUES.map(clue => clue.id));
  for (const id of ['back-in-20', 'vet-rex', 'cake-1411', 'birthday-card', 'pc-policy', 'reuses-passwords',
    'dog-wallpaper', 'rex-2019', 'rex-7-years', 'mail-same-as-pc', 'bulle-account', 'born-annecy',
    'bank-question', 'security-key']) {
    assert.ok(ids.has(id), id);
  }
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

test('the answer to her bank question is on her Bulle account', () => {
  const birthday = BULLE.posts.find(post => post.clue?.id === 'born-annecy');
  assert.equal(birthday.place, BANK.answer);
  assert.match(BULLE.chat.messages.map(m => m.text).join(' '), /ville où je suis née/);
});
