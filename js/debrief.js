// The debrief at the end of a round: the rank, what Camille finds, the
// player's own chain as dominos (only the steps they got), and what they
// missed. Clicking a domino shows her mistake and the fix.

import { LESSONS } from './data/debrief.js';
import { hasCracked } from './state.js';
import { el, button } from './dom.js';

const FALL_DELAY_MS = 350;

/** What Camille finds when she sits back down. */
export function traceLines(traces, caught) {
  const lines = [];
  if (caught) lines.push('Elle te trouve à son bureau, les mains dans ses affaires !');
  if (traces.intruderPhotos) lines.push('Ta photo dans son téléphone.');
  if (traces.alerts === 1) lines.push('Un mail d’alerte dans sa boîte.');
  if (traces.alerts > 1) lines.push(`${traces.alerts} mails d’alerte dans sa boîte.`);
  if (traces.missingEmails) lines.push('Des mails à elle qui ont disparu.');
  if (traces.openPc) lines.push('Sa session ouverte sur son PC.');
  if (traces.bankTexts) lines.push('Un SMS de sa banque : « votre code de validation… ».');
  if (traces.bullePasswordChanged) lines.push('Son mot de passe Bulle ne marche plus (ça, impossible à cacher).');
  if (!lines.length) lines.push('Rien. Tout est à sa place.');
  return lines;
}

/**
 * Fills the end screen.
 * @param {object} state
 * @param {{traces: object, caught: boolean, rank: {title: string, line: string}}} result
 */
export function renderDebrief(state, { traces, caught, rank }) {
  const $ = id => document.getElementById(id);

  $('end-rank').replaceChildren(el('strong', '', rank.title), el('span', '', rank.line));
  $('end-summary').replaceChildren(...traceLines(traces, caught).map(line => el('p', '', line)));

  // The chain the player actually went through, then Coffre if they tried it.
  const reached = LESSONS.filter(lesson => (lesson.device === 'vault'
    ? state.vaultTries > 0
    : hasCracked(state, lesson.device)));
  const missed = LESSONS.filter(lesson => lesson.missed && !hasCracked(state, lesson.device));

  const detail = $('end-lesson');
  const show = (lesson, domino) => {
    for (const other of $('end-dominos').querySelectorAll('.domino')) other.classList.toggle('selected', other === domino);
    detail.replaceChildren(
      el('p', 'lesson-title', lesson.title),
      el('p', 'lesson-mistake', lesson.mistake),
      el('p', 'lesson-fix', lesson.fix),
    );
  };

  const dominos = reached.map((lesson, i) => {
    const domino = button(`domino ${lesson.device === 'vault' ? 'standing' : ''}`, '', () => show(lesson, domino));
    domino.setAttribute('aria-label', `${lesson.title} : voir l’erreur et la parade`);
    domino.append(el('span', 'domino-half', lesson.clue), el('span', 'domino-half', lesson.key));
    // One after the other, like a chain reaction. Coffre stays standing.
    domino.style.animationDelay = `${300 + i * FALL_DELAY_MS}ms`;
    return domino;
  });
  $('end-dominos').replaceChildren(...dominos.map(domino => {
    const item = el('li');
    item.append(domino);
    return item;
  }));
  if (dominos.length) {
    show(reached[0], dominos[0]);
  } else {
    $('end-dominos').append(el('li', 'domino-none', 'Aucun domino n’est tombé : tu n’as rien pu ouvrir.'));
    detail.replaceChildren();
  }

  $('end-missed').replaceChildren(...(missed.length
    ? missed.map(lesson => {
      const item = el('li');
      item.append(el('strong', '', `${lesson.title} `), el('span', '', lesson.missed));
      return item;
    })
    : [el('li', '', 'Rien : tu as tout trouvé.')]));
}
