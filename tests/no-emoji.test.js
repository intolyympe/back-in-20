import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

// No emoji anywhere in the game: they look different on every system and
// cheapen the fake interfaces. Icons are drawn in js/icons.js instead.
const EMOJI = /\p{Extended_Pictographic}/u;

function files(dir, ext) {
  return readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return files(path, ext);
    return path.endsWith(ext) ? [path] : [];
  });
}

test('no emoji in the game', () => {
  for (const file of [...files('js', '.js'), ...files('css', '.css'), 'index.html']) {
    readFileSync(file, 'utf8').split('\n').forEach((line, i) => {
      assert.doesNotMatch(line, EMOJI, `${file}:${i + 1}`);
    });
  }
});
