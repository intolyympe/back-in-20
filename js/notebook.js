// Draws the notebook from the game state. New entries are appended; entries
// already there are only updated (a task gets crossed out once done).

export function createNotebook(listEl, emptyEl) {
  const items = new Map(); // clue id -> <li>

  return {
    render(clues) {
      emptyEl.hidden = clues.length > 0;
      for (const clue of clues) {
        let item = items.get(clue.id);
        if (!item) {
          item = document.createElement('li');
          item.textContent = clue.text;
          item.classList.add('new');
          if (clue.deduction) item.classList.add('deduction');
          if (clue.task) item.classList.add('task');
          item.addEventListener('animationend', () => item.classList.remove('new'), { once: true });
          items.set(clue.id, item);
          listEl.append(item);
          item.scrollIntoView({ block: 'nearest' });
        }
        item.classList.toggle('done', Boolean(clue.done));
      }
    },
  };
}
