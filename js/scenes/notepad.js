// Camille's notepad, picked up from the desk: her meeting notes, readable.

import { MEETING_NOTES } from '../data/camille.js';
import { notable } from '../notable.js';

export function createNotepadView() {
  const sheet = document.createElement('div');
  sheet.className = 'pad-sheet';
  sheet.dataset.subject = 'notepad';

  const spiral = document.createElement('div');
  spiral.className = 'pad-spiral';

  const page = document.createElement('div');
  page.className = 'pad-page';

  const title = document.createElement('p');
  title.className = 'pad-title';
  title.textContent = MEETING_NOTES.title;
  page.append(title);

  for (const line of MEETING_NOTES.lines) {
    const p = document.createElement('p');
    p.className = 'pad-line';
    const words = document.createElement('span');
    words.textContent = line.text;
    if (line.highlight) words.className = 'pad-highlight';
    if (line.clue) notable(words, line.clue);
    p.append(words);
    page.append(p);
  }

  sheet.append(spiral, page);
  return sheet;
}
