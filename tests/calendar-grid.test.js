import { test } from 'node:test';
import assert from 'node:assert/strict';
import { monthGrid } from '../js/calendar-grid.js';
import { CALENDAR, STORY_START, DEDUCTIONS } from '../js/data/camille.js';
import { ALL_CLUES } from '../js/clues.js';

test('November 2026 starts on a Sunday and has 30 days', () => {
  const weeks = monthGrid(2026, 11);
  assert.equal(weeks.length, 6);
  assert.deepEqual(weeks[0], [null, null, null, null, null, null, 1]);
  assert.deepEqual(weeks[1], [2, 3, 4, 5, 6, 7, 8]);
  assert.deepEqual(weeks[5], [30, null, null, null, null, null, null]);
});

test('a month starting on a Monday has no leading blanks', () => {
  const weeks = monthGrid(2026, 6); // 1 June 2026 is a Monday
  assert.equal(weeks[0][0], 1);
  assert.equal(weeks.flat().filter(Boolean).length, 30);
});

test('every week has 7 cells', () => {
  for (let month = 1; month <= 12; month++) {
    for (const week of monthGrid(2026, month)) assert.equal(week.length, 7);
  }
});

test('the story day is the day showing on the wall calendar', () => {
  assert.equal(STORY_START.getFullYear(), CALENDAR.year);
  assert.equal(STORY_START.getMonth() + 1, CALENDAR.month);
  assert.equal(STORY_START.getDate(), CALENDAR.today);
});

test('every calendar event falls on a real day of its month', () => {
  for (const [month, events] of Object.entries(CALENDAR.events)) {
    const days = monthGrid(CALENDAR.year, Number(month)).flat();
    for (const event of events) assert.ok(days.includes(event.day), `${event.day}/${month}`);
  }
});

test('every deduction can be reached from clues the game hands out', () => {
  const handedOut = new Set(ALL_CLUES.map(clue => clue.id));
  for (const deduction of DEDUCTIONS) {
    for (const id of deduction.from) assert.ok(handedOut.has(id), `${deduction.id} needs ${id}`);
  }
});
