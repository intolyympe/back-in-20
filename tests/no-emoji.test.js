import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { DEDUCTIONS } from '../js/data/camille.js';
import { ALL_CLUES } from '../js/clues.js';

// No emoji in the game's own interface (icons are drawn in js/icons.js) nor
// in the player's notebook. Camille and her friends do use emoji in what
// they write (texts, posts, notes): that lives in js/data/camille.js.
const EMOJI = /\p{Extended_Pictographic}/u;
const CHARACTERS_WRITE_HERE = join('js', 'data', 'camille.js');

function files(dir, ext) {
  return readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return files(path, ext);
    return path.endsWith(ext) ? [path] : [];
  });
}

test('no emoji in the interface', () => {
  const sources = [...files('js', '.js'), ...files('css', '.css'), 'index.html']
    .filter(file => file !== CHARACTERS_WRITE_HERE);
  for (const file of sources) {
    readFileSync(file, 'utf8').split('\n').forEach((line, i) => {
      assert.doesNotMatch(line, EMOJI, `${file}:${i + 1}`);
    });
  }
});

test('no emoji in the notebook: the player writes plainly', () => {
  const clues = [...ALL_CLUES, ...DEDUCTIONS];
  for (const clue of clues) assert.doesNotMatch(clue.text, EMOJI, clue.id);
});
