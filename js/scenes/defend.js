// "Défendre Camille", after the debrief: the player sets her new defences on
// the left, then lets the ghost loose on the right. It replays the attack,
// door after door, and stops at the first one that holds.

import { DOORS, WEAK_CHOICES, checkPin, checkPassword, replayAttack } from '../defence.js';
import { DOOR_TEXT, WHY } from '../data/defence.js';
import { generatePassphrase, randomInt } from '../../engine/generator.js';
import { el, button } from '../dom.js';

const STEP_MS = 900;
const PASSPHRASE_WORDS = 5;

/**
 * Fills the defence screen.
 * @param {HTMLElement} screen  the #defend-screen section
 */
export function createDefence(screen) {
  const choices = { ...WEAK_CHOICES };
  let running = false;

  // ---- Left: the doors ----

  // A text field with live feedback from the engine, and a random draw.
  function fieldCard(door, key, check, draw) {
    const text = DOOR_TEXT[door];
    const input = el('input', 'defend-field');
    input.type = 'text';
    input.value = choices[key];
    input.placeholder = text.placeholder;
    input.autocomplete = 'off';
    input.spellcheck = false;
    input.setAttribute('aria-label', text.question);
    const verdict = el('p', 'defend-verdict');
    const update = () => {
      choices[key] = input.value;
      const { ok, reason } = check(input.value);
      verdict.textContent = `${ok ? 'Tient bon' : 'Tombe'} · ${WHY[reason]}`;
      verdict.classList.toggle('ok', ok);
    };
    input.addEventListener('input', update);
    const random = button('defend-random', text.random, () => {
      input.value = draw();
      update();
    });
    update();
    const row = el('div', 'defend-row');
    row.append(input, random);
    return card(door, el('p', 'defend-question', text.question), row, verdict);
  }

  // A group of choices, one of them picked.
  function choiceGroup(key, question, options) {
    const group = el('div', 'defend-choices');
    group.setAttribute('role', 'radiogroup');
    group.setAttribute('aria-label', question);
    const buttons = options.map(([value, label]) => {
      const b = button('defend-choice', label, () => {
        choices[key] = value;
        for (const other of buttons) other.setAttribute('aria-checked', other === b);
      });
      b.setAttribute('role', 'radio');
      b.setAttribute('aria-checked', choices[key] === value);
      return b;
    });
    group.append(...buttons);
    return [el('p', 'defend-question', question), group];
  }

  function card(door, ...children) {
    const box = el('section', 'defend-card');
    box.append(el('h3', 'defend-door', DOOR_TEXT[door].title), ...children);
    return box;
  }

  const randomPin = () => Array.from({ length: 6 }, () => randomInt(10)).join('');

  const doors = el('div', 'defend-doors');
  doors.append(
    fieldCard('phone', 'pin', checkPin, randomPin),
    fieldCard('pc', 'pcPassword', checkPassword, () => generatePassphrase(PASSPHRASE_WORDS)),
    card('mail', ...choiceGroup('mail', DOOR_TEXT.mail.question, DOOR_TEXT.mail.options)),
    card('bulle', ...choiceGroup('bulle', DOOR_TEXT.bulle.question, DOOR_TEXT.bulle.options)),
    card(
      'bank',
      ...choiceGroup('bankAnswer', DOOR_TEXT.bank.question, DOOR_TEXT.bank.options),
      ...choiceGroup('bank', DOOR_TEXT.bank.secondQuestion, DOOR_TEXT.bank.secondOptions),
    ),
  );

  // ---- Right: the ghost ----

  const log = el('ol', 'ghost-log');
  const verdict = el('p', 'ghost-verdict');
  const launch = button('screen-button ghost-launch', 'Lâcher le fantôme', run);

  function run() {
    if (running) return;
    running = true;
    launch.disabled = true;
    verdict.textContent = '';
    const { steps, stoppedAt } = replayAttack(choices);
    log.replaceChildren(...DOORS.map(door => {
      const item = el('li', 'ghost-step');
      item.dataset.door = door;
      item.append(el('strong', '', DOOR_TEXT[door].title), el('span', 'ghost-try', ''), el('span', 'ghost-why', ''));
      return item;
    }));

    steps.forEach((step, i) => {
      setTimeout(() => {
        const item = log.querySelector(`[data-door="${step.door}"]`);
        item.querySelector('.ghost-try').textContent = DOOR_TEXT[step.door].ghost;
        item.querySelector('.ghost-why').textContent = WHY[step.why];
        item.classList.add(step.open ? 'open' : 'held');
      }, (i + 1) * STEP_MS);
    });

    setTimeout(() => {
      // Doors behind the one that held are never reached.
      for (const item of log.querySelectorAll('.ghost-step:not(.open):not(.held)')) {
        item.classList.add('unreached');
        item.querySelector('.ghost-why').textContent = 'Jamais atteinte.';
      }
      const passed = steps.filter(step => step.open).length;
      if (!stoppedAt) verdict.textContent = 'Le fantôme refait tout le chemin. Camille n’est pas mieux protégée.';
      else if (passed === 0) verdict.textContent = 'Arrêté à la première porte. Camille est à l’abri.';
      else verdict.textContent = `Arrêté après ${passed} porte${passed > 1 ? 's' : ''}. Mieux, mais ce qu’il a pris, il l’a.`;
      verdict.classList.toggle('good', Boolean(stoppedAt) && passed === 0);
      running = false;
      launch.disabled = false;
      launch.textContent = 'Relâcher le fantôme';
    }, (steps.length + 1) * STEP_MS);
  }

  const ghost = el('aside', 'ghost');
  ghost.append(
    el('h3', 'debrief-heading', 'Le fantôme'),
    el('p', 'ghost-intro', 'Il rejoue l’attaque, porte après porte, avec tout ce qu’il a déjà pris.'),
    launch,
    log,
    verdict,
  );

  const restart = button('defend-restart', 'Rejouer la partie', () => location.reload());
  const title = el('h2', 'screen-title', 'Défendre Camille');
  title.id = 'defend-title';
  screen.replaceChildren(
    title,
    el('p', 'defend-intro', 'Ferme les portes que tu as ouvertes. Puis lâche le fantôme.'),
    (() => {
      const body = el('div', 'defend-body');
      body.append(doors, ghost);
      return body;
    })(),
    restart,
  );
  screen.querySelector('.defend-field')?.focus();
}
