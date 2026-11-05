// Camille's wall calendar: small on the desk, readable when looked at.
// Both are built from the same data (js/data/camille.js).

import { CALENDAR } from '../data/camille.js';
import { monthGrid, WEEKDAYS, MONTHS } from '../calendar-grid.js';

function el(tag, className, text) {
  const node = document.createElement(tag);
  node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

/** @param {'desk'|'large'} variant */
function buildCalendar(variant) {
  const { year, month, today, events } = CALENDAR;
  const eventsByDay = new Map(events.map(e => [e.day, e]));

  const root = el('div', `cal cal--${variant}`);
  const title = variant === 'large' ? `${MONTHS[month - 1]} ${year}` : MONTHS[month - 1];
  root.append(el('div', 'cal-month', title));

  const weekdays = el('div', 'cal-weekdays');
  for (const name of WEEKDAYS) weekdays.append(el('span', '', name));
  root.append(weekdays);

  const grid = el('div', 'cal-grid');
  for (const day of monthGrid(year, month).flat()) {
    const cell = el('div', 'cal-day');
    if (day === null) {
      cell.classList.add('empty');
    } else {
      cell.append(el('span', 'cal-number', String(day)));
      if (day < today) cell.classList.add('past');
      const event = eventsByDay.get(day);
      if (event) {
        cell.classList.add('has-event');
        if (event.circled) cell.classList.add('circled');
        cell.append(el('span', 'cal-event', event.text));
      }
    }
    grid.append(cell);
  }
  root.append(grid);
  return root;
}

/** Fills the calendar hanging on the wall. */
export function fillDeskCalendar(button) {
  button.replaceChildren(buildCalendar('desk'));
}

/** The calendar taken off the wall, big enough to read. */
export function createCalendarView() {
  const sheet = el('div', 'cal-sheet');
  sheet.append(el('div', 'cal-rings'), buildCalendar('large'));
  return sheet;
}
