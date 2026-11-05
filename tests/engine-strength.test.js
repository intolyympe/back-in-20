import { test } from 'node:test';
import assert from 'node:assert/strict';
import { analyze, LEVELS } from '../engine/strength.js';
import { generatePassword, generatePassphrase, passphraseEntropy } from '../engine/generator.js';

const level = pwd => LEVELS[analyze(pwd).score].id;
const types = pwd => analyze(pwd).sequence.map(m => m.type);
const warningCodes = pwd => analyze(pwd).warnings.map(w => w.code);

test('alphabet runs are very weak, even when long', () => {
  assert.equal(level('abcdefghijklmopqrstuvwxyz'), 'veryWeak');
  assert.equal(level('abcdefghijklmnopqrstuvwxyz'), 'veryWeak');
  assert.equal(level('9876543210'), 'veryWeak');
  assert.deepEqual(types('abcdefghijklmopqrstuvwxyz'), ['sequence', 'sequence']);
});

test('common passwords are very weak, with or without leet speak', () => {
  for (const pwd of ['password', 'P@ssw0rd', 'azerty123', 'motdepasse', 'Password123']) {
    assert.equal(level(pwd), 'veryWeak', pwd);
  }
});

test('keyboard walks are detected on QWERTY and AZERTY', () => {
  assert.deepEqual(types('zxcvbnm,./'), ['keyboard']);
  assert.deepEqual(types('wxcvbn'), ['keyboard']);
  assert.equal(level('poiuytreza'), 'veryWeak');
});

test('repeats are very weak', () => {
  assert.deepEqual(types('aaaaaaaaaaaaaaaa'), ['repeat']);
  assert.equal(level('abcabcabcabc'), 'veryWeak');
  assert.equal(level('a'.repeat(300)), 'weak'); // long, but still trivial
});

test('dates and words + year are weak', () => {
  assert.deepEqual(types('12/05/1990'), ['date']);
  assert.deepEqual(types('soleil1990'), ['dictionary', 'year']);
  assert.ok(analyze('Soleil2024!').score <= 1);
});

test('generated passwords keep a high score', () => {
  for (let i = 0; i < 20; i++) {
    const pwd = generatePassword(20, { upper: true, lower: true, digits: true, symbols: true });
    assert.equal(level(pwd), 'veryStrong', pwd);
  }
});

test('generated passphrases are recognized and rated close to their real entropy', () => {
  for (let i = 0; i < 20; i++) {
    const pwd = generatePassphrase(6, { separator: '-', capitalize: i % 2 === 0 });
    const { bits, sequence, warnings } = analyze(pwd);
    assert.ok(sequence.some(m => m.type === 'passphrase'), pwd);
    // Never more than the true entropy plus a few bits for separator/case,
    // and not much less either (short words can be split differently).
    assert.ok(bits <= passphraseEntropy(6) + 6, `${pwd}: ${bits}`);
    assert.ok(bits >= passphraseEntropy(6) - 15, `${pwd}: ${bits}`);
    assert.ok(!warnings.some(w => w.code === 'dictionaryWord'), pwd);
  }
});

test('patterns never make a password look stronger than its charset count', () => {
  for (const pwd of ['abc', 'Tr0ub4dor&3', 'correcthorsebatterystaple', 'x'.repeat(200)]) {
    const { bits, naiveBits } = analyze(pwd);
    assert.ok(bits <= naiveBits + 1e-9, `${pwd}: ${bits} > ${naiveBits}`);
  }
});

test('feedback explains the weakness with message codes', () => {
  assert.deepEqual(warningCodes('qwerty'), ['commonPassword']);
  assert.deepEqual(warningCodes('abcdefghijklmopqrstuvwxyz'), ['sequence']);
  assert.ok(warningCodes('P@ssw0rd!').includes('leet'));
  assert.deepEqual(warningCodes('A1tQ!AVv4IKR52;&7:ot'), []);
  assert.deepEqual(analyze('soleil').suggestions.map(s => s.code), ['addLength']);
});

test('empty password', () => {
  assert.equal(analyze('').bits, 0);
  assert.deepEqual(analyze('').sequence, []);
});
