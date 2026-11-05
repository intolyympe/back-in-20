import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rankFor, avoidableTraces, RANKS } from '../js/rank.js';

const clean = { intruderPhotos: 0, alerts: 0, missingEmails: 0, openPc: false, bullePasswordChanged: false, bankTexts: 0 };

test('no trace left: a ghost, even with her Bulle password changed', () => {
  assert.equal(rankFor(clean, false), RANKS.ghost);
  assert.equal(rankFor({ ...clean, bullePasswordChanged: true }, false), RANKS.ghost);
});

test('caught at her desk beats everything', () => {
  assert.equal(rankFor(clean, true), RANKS.caught);
});

test('a few traces, then too many', () => {
  assert.equal(rankFor({ ...clean, openPc: true }, false), RANKS.burglar);
  assert.equal(rankFor({ ...clean, alerts: 2 }, false), RANKS.burglar);
  assert.equal(rankFor({ ...clean, alerts: 2, intruderPhotos: 1 }, false), RANKS.elephant);
  assert.equal(avoidableTraces({ ...clean, missingEmails: 4, bankTexts: 2 }), 2, 'a kind of trace counts once');
});
