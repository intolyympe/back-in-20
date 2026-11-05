// The desk drawer, pulled open: the usual mess, and last year's birthday card
// from Léa with its envelope (postmark smudged).

import { BIRTHDAY_CARD } from '../data/camille.js';
import { el } from '../dom.js';

export function createDrawerView() {
  const drawer = el('div', 'drawer-open');

  // A charging cable, paper clips and rubber bands lying around.
  drawer.insertAdjacentHTML('beforeend', `
    <svg class="drawer-cable" viewBox="0 0 220 120" aria-hidden="true">
      <path d="M10 100 C40 20, 80 120, 110 60 S170 10, 200 70" fill="none" stroke="#f2f2f2" stroke-width="6" stroke-linecap="round"/>
      <rect x="196" y="62" width="18" height="30" rx="3" fill="#e2e2e2" transform="rotate(30 205 77)"/>
    </svg>
    <span class="drawer-clip" style="left: 70px; top: 330px; rotate: 20deg"></span>
    <span class="drawer-clip" style="left: 110px; top: 350px; rotate: -35deg"></span>
    <span class="drawer-band" style="right: 90px; top: 60px"></span>
    <span class="drawer-band" style="right: 60px; top: 90px; border-color: #e0a830"></span>`);

  const { postmark } = BIRTHDAY_CARD;
  const envelope = el('div', 'bday-envelope');
  const stamp = el('div', 'bday-stamp');
  const mark = el('div', 'bday-postmark');
  mark.append(
    el('span', 'postmark-day', postmark.day),
    el('span', 'postmark-month', postmark.month),
    el('span', 'postmark-year', postmark.year),
  );
  envelope.append(el('div', 'bday-address'), stamp, mark);
  drawer.append(envelope);

  const card = el('div', 'bday-card');
  const front = el('div', 'bday-front');
  front.append(el('span', 'bday-title', BIRTHDAY_CARD.front));
  const inside = el('div', 'bday-inside');
  for (const line of BIRTHDAY_CARD.message) inside.append(el('p', '', line));
  card.append(front, inside);
  drawer.append(card);
  return drawer;
}
