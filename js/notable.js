// A detail the player can note: hovering shows "Noter", a click (or Enter)
// writes its clue in the notebook. The view only marks the detail; the
// notebook hears about it through a bubbling 'note-clue' event, caught in
// main.js. Noted details stay marked when a view is drawn again.

const noted = new Set();

// One floating label per overlay, "Noter" or "Noté", above the detail under
// the pointer. Drawn in JS so the detail keeps its own positioning.
function showTip(element) {
  const host = element.closest('.overlay');
  if (!host) return;
  let tip = host.querySelector(':scope > .note-tip');
  if (!tip) {
    tip = document.createElement('span');
    tip.className = 'note-tip';
    host.append(tip);
  }
  const box = element.getBoundingClientRect();
  const hostBox = host.getBoundingClientRect();
  const scale = hostBox.width / host.offsetWidth; // the stage is scaled
  tip.textContent = noted.has(element.dataset.clue) ? 'Noté' : 'Noter';
  tip.style.left = `${(box.left - hostBox.left + box.width / 2) / scale}px`;
  tip.style.top = `${(box.top - hostBox.top) / scale}px`;
  tip.hidden = false;
}

function hideTip(element) {
  const tip = element.closest('.overlay')?.querySelector(':scope > .note-tip');
  if (tip) tip.hidden = true;
}

/**
 * @param {HTMLElement} element  the detail (an event on the calendar, a line…)
 * @param {{id: string, text: string}} clue
 * @returns the same element
 */
export function notable(element, clue) {
  element.classList.add('notable');
  element.tabIndex = 0;
  element.setAttribute('role', 'button');
  element.setAttribute('aria-label', `Noter : ${element.textContent.trim() || clue.text}`);
  element.classList.toggle('noted', noted.has(clue.id));

  const take = event => {
    event.stopPropagation();
    if (noted.has(clue.id)) return;
    noted.add(clue.id);
    for (const same of document.querySelectorAll(`[data-clue="${clue.id}"]`)) same.classList.add('noted');
    element.dispatchEvent(new CustomEvent('note-clue', { bubbles: true, detail: { clue } }));
  };
  element.dataset.clue = clue.id;
  element.addEventListener('click', event => {
    take(event);
    showTip(element);
  });
  element.addEventListener('pointerenter', () => showTip(element));
  element.addEventListener('pointerleave', () => hideTip(element));
  element.addEventListener('focus', () => showTip(element));
  element.addEventListener('blur', () => hideTip(element));
  element.addEventListener('keydown', event => {
    if (event.key === 'Enter') take(event);
  });
  return element;
}
