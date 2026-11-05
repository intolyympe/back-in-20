// Camille's wall calendar: small on the desk, readable when taken down, and
// its pages can be turned. Built from js/data/camille.js.

import { CALENDAR } from '../data/camille.js';
import { monthGrid, WEEKDAYS, MONTHS } from '../calendar-grid.js';
import { el } from '../dom.js';

// Pages that teach something when the player turns to them (month -> clue).
export const CALENDAR_CLUES = {
  11: { id: 'cake-1411', text: 'Calendrier, 14 novembre : un gâteau dessiné. Pas de nom.' },
};

/** Is this day already gone in the story? (crossed out on the calendar) */
function isPast(month, day) {
  return month < CALENDAR.month || (month === CALENDAR.month && day < CALENDAR.today);
}

/**
 * @param {'desk'|'large'} variant
 * @param {number} month 1-12
 */
function buildCalendar(variant, month) {
  const { year } = CALENDAR;
  const eventsByDay = new Map((CALENDAR.events[month] ?? []).map(e => [e.day, e]));

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
      if (isPast(month, day)) cell.classList.add('past');
      const event = eventsByDay.get(day);
      if (event) {
        cell.classList.add('has-event');
        if (event.circled) cell.classList.add('circled');
        if (event.doodle) cell.append(el('span', `cal-doodle ${event.doodle}`));
        else cell.append(el('span', 'cal-event', event.text));
      }
    }
    grid.append(cell);
  }
  root.append(grid);
  return root;
}

/** Fills the calendar hanging on the wall (the current month). */
export function fillDeskCalendar(button) {
  button.replaceChildren(buildCalendar('desk', CALENDAR.month));
}

/**
 * The calendar taken off the wall, big enough to read. Its pages turn with
 * the buttons or the arrow keys; onPage(month) is called for every page shown.
 */
export function createCalendarView({ onPage = () => {} } = {}) {
  let month = CALENDAR.month;

  const sheet = el('div', 'cal-sheet');
  const page = el('div', 'cal-page');
  const prev = el('button', 'cal-turn prev');
  const next = el('button', 'cal-turn next');

  const show = target => {
    month = Math.min(12, Math.max(1, target));
    page.replaceChildren(buildCalendar('large', month));
    prev.disabled = month === 1;
    next.disabled = month === 12;
    prev.textContent = month > 1 ? `‹ ${MONTHS[month - 2]}` : '';
    next.textContent = month < 12 ? `${MONTHS[month]} ›` : '';
    prev.setAttribute('aria-label', 'Mois précédent');
    next.setAttribute('aria-label', 'Mois suivant');
    onPage(month);
  };

  prev.addEventListener('click', () => show(month - 1));
  next.addEventListener('click', () => show(month + 1));
  sheet.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft') show(month - 1);
    if (event.key === 'ArrowRight') show(month + 1);
  });

  sheet.append(el('div', 'cal-rings'), page, prev, next);
  show(month);
  return sheet;
}
