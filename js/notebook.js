// Draws the notebook from the game state. Clues are only ever added, so we
// append the new ones instead of redrawing the whole list.

export function createNotebook(listEl, emptyEl) {
  let shown = 0;

  return {
    render(clues) {
      emptyEl.hidden = clues.length > 0;
      for (const clue of clues.slice(shown)) {
        const item = document.createElement('li');
        item.textContent = clue.text;
        item.className = clue.deduction ? 'new deduction' : 'new';
        item.addEventListener('animationend', () => item.classList.remove('new'), { once: true });
        listEl.append(item);
        item.scrollIntoView({ block: 'nearest' });
      }
      shown = clues.length;
    },
  };
}
