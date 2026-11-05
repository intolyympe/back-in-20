import { test } from 'node:test';
import assert from 'node:assert/strict';
import { analyze } from '../engine/strength.js';
import { buildPersonalDictionary } from '../engine/personal.js';

const personal = buildPersonalDictionary({
  firstName: 'Hélène',
  lastName: 'Martin',
  birthDate: '1990-05-12',
  closeOnes: 'Hugo, Rex',
  username: 'hel.martin69@mail.fr',
});

const sourcesOf = pwd => analyze(pwd, { personal }).sequence.flatMap(m => m.sources ?? []);

test('returns null when nothing is filled in', () => {
  assert.equal(buildPersonalDictionary({}), null);
  assert.equal(buildPersonalDictionary({ firstName: '  ' }), null);
});

test('derives accent-free spellings and date formats', () => {
  for (const token of ['hélène', 'helene', '12051990', '120590', '12/05/1990', '1990', 'hugo', 'martin69']) {
    assert.ok(personal.ranked.has(token), token);
  }
});

test('personal info makes a password much easier to guess', () => {
  for (const pwd of ['Helene1990', 'Rex120590!', 'hugo-rex', 'M@rtin12/05/1990']) {
    const generic = analyze(pwd).bits;
    const targeted = analyze(pwd, { personal }).bits;
    assert.ok(targeted < generic - 5, `${pwd}: ${targeted} vs ${generic}`);
  }
});

test('reports which info was used', () => {
  assert.deepEqual(sourcesOf('Helene1990'), ['firstName', 'birthDate']);
  assert.deepEqual(sourcesOf('hugo-rex'), ['closeOnes']);
});

test('catches initials and name fragments', () => {
  const info = buildPersonalDictionary({
    firstName: 'Camille', lastName: 'Martin', birthDate: '2026-05-11', city: 'Lyon',
  });
  for (const token of ['cm', 'mc', 'amille', 'artin', 'camil']) assert.ok(info.ranked.has(token), token);

  const pwd = 'CM1105amille!artin';
  assert.ok(analyze(pwd).score >= 4, 'looks strong to a stranger');
  assert.ok(analyze(pwd, { personal: info }).score <= 1, 'weak for someone who knows you');
});

test('random passwords are unaffected', () => {
  const pwd = 'Xk9#mQ2!vB7z';
  assert.equal(analyze(pwd, { personal }).bits, analyze(pwd).bits);
});
