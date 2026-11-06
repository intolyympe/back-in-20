import { test } from 'node:test';
import assert from 'node:assert/strict';
import { classify, classifyAll, FLAWS } from '../js/data/photos.js';

test('an open account is an access, a mistake is a flaw, the rest is useless', () => {
  assert.deepEqual(classify('mail'), { kind: 'access', id: 'mail', text: 'sa boîte mail' });
  assert.equal(classify('pc-note-codes').kind, 'flaw');
  assert.equal(classify('calendar-11').id, 'birthday');
  assert.equal(classify('drawer').id, 'birthday', 'two ways to show the same flaw');
  assert.deepEqual(classify('plant'), { kind: 'useless', id: 'plant', text: 'la plante' });
  assert.equal(classify('calendar-7').text, 'une page du calendrier');
  assert.equal(classify('pc-note-courses').text, 'une note sans intérêt');
  assert.equal(classify('phone-locked').kind, 'useless', 'a locked phone proves nothing');
  assert.equal(classify('???').kind, 'useless');
});

test('every flaw has its own id', () => {
  const ids = FLAWS.map(f => f.id);
  assert.equal(new Set(ids).size, ids.length);
});

test('one photo can prove the access and a flaw at once', () => {
  const { proofs, useless } = classifyAll(['phone', 'phone-photo-rex-arrival']);
  assert.deepEqual(proofs.map(p => p.id), ['phone', 'dog-year']);
  assert.equal(useless, null);
});

test('an open account with nothing special on it is still an access', () => {
  assert.deepEqual(classifyAll(['phone', 'phone-photo-moka']).proofs.map(p => p.id), ['phone']);
  assert.deepEqual(classifyAll(['bulle', 'bulle-chat']).proofs.map(p => p.id), ['bulle', 'public-answer']);
});

test('nothing to prove: the innermost thing shown is the useless photo', () => {
  const { proofs, useless } = classifyAll(['phone-locked']);
  assert.deepEqual(proofs, []);
  assert.equal(useless.text, 'un téléphone verrouillé');
  assert.equal(classifyAll(['plant']).useless.text, 'la plante');
});
