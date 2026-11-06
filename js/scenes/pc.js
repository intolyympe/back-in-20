// Camille's work computer, seen up close: the lock screen, then her desktop
// with a few apps (Notes, Mail, Documents, Corbeille). Fictional OS.
//
// Like the phone, the view only draws and reacts; main.js turns its events
// into notebook entries.

import { PC } from '../data/camille.js';
import { createMailbox } from './mailbox.js';
import { createBulle } from './bulle.js';
import { createVault } from './vault.js';
import { recordFailedAttempt, lockRemaining, unlock, relock, isUnlocked } from '../state.js';
import { el, button, hhmm, mss } from '../dom.js';
import { icon } from '../icons.js';
import { proofButton } from '../proof.js';

const DATE_FORMAT = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });

const THOUGHTS = {
  close: 'Si près… Il manque quelque chose ?',
  file: 'Rien d’utile là-dedans.',
};

const APPS = [
  { id: 'notes', name: 'Notes', icon: 'notes', color: '#e0a830' },
  { id: 'mail', name: 'Mail', icon: 'mail', color: '#2b5fa8' },
  { id: 'bulle', name: 'Bulle', icon: 'bulle', color: '#ff7a59' },
  { id: 'vault', name: 'Coffre', icon: 'vault', color: '#2d2f36' },
  { id: 'files', name: 'Documents', icon: 'files', color: '#4f7aa8' },
  { id: 'trash', name: 'Corbeille', icon: 'trash', color: '#6b7079' },
];

// "rex2019" and "Rex2019!" are the same guess, give or take the rule.
const loose = text => text.toLowerCase().replace(/[^a-z0-9]/g, '');

/**
 * @param {object} options
 * @param {object} options.state       game state
 * @param {() => number} options.now   ms since the round started
 * @param {(ms: number) => Date} options.storyTime  story clock at that time
 * @param {(type: string, data?: object) => void} options.onEvent
 *   'unlock', 'lock', 'note-viewed' {note}, 'proof' {id}
 * @param {(type: string, data?: object) => void} options.onMailEvent
 *   events of the Mail window (see mailbox.js)
 * @param {(type: string, data?: object) => void} options.onBulleEvent
 *   events of the Bulle window (see bulle.js)
 * @param {(type: string) => void} options.onVaultEvent
 *   events of the Coffre window (see vault.js)
 */
export function createPcView({
  state, now, storyTime, onEvent = () => {}, onMailEvent = () => {}, onBulleEvent = () => {},
  onVaultEvent = () => {},
}) {
  const monitor = el('div', 'pc-monitor');
  const screen = el('div', 'pc-screen');
  monitor.append(screen);

  let app = null;            // open window on the desktop
  let openNote = PC.notes[0];
  let message = '';
  let showHint = false;
  let thought = '';

  // ---- Lock screen ----

  function loginScreen() {
    const time = storyTime(now());
    const card = el('div', 'pc-login-card');
    const form = el('form', 'pc-login-form');
    const input = el('input', 'pc-password');
    input.type = 'password';
    input.placeholder = 'Mot de passe';
    input.autocomplete = 'off';
    input.setAttribute('aria-label', 'Mot de passe de Camille');
    const go = el('button', 'pc-login-go', '→');
    go.type = 'submit';
    go.setAttribute('aria-label', 'Se connecter');
    form.append(input, go);
    form.addEventListener('submit', event => {
      event.preventDefault();
      submit(input.value);
    });

    const wait = lockRemaining(state, 'pc', now());
    input.disabled = go.disabled = wait > 0;
    card.append(
      el('span', 'pc-login-avatar', 'C'),
      el('span', 'pc-login-name', 'Camille'),
      form,
      el('p', 'pc-login-message', wait > 0 ? lockMessage(wait) : message),
      el('p', 'pc-login-hint', showHint ? `Indice : ${PC.hint}` : ''),
      el('p', 'pc-thought', thought),
    );
    return [
      el('div', 'pc-lock-time', hhmm(time)),
      el('div', 'pc-lock-date', DATE_FORMAT.format(time)),
      card,
    ];
  }

  const lockMessage = wait => `Trop de tentatives. Réessayez dans ${mss(wait)}.`;

  function submit(value) {
    if (!value || lockRemaining(state, 'pc', now()) > 0) return;
    if (value === PC.password) {
      unlock(state, 'pc');
      message = thought = '';
      onEvent('unlock');
      return render();
    }
    const result = recordFailedAttempt(state, 'pc', now());
    showHint = true;
    message = result.lockedOut ? '' : 'Mot de passe incorrect.';
    thought = loose(value) === loose(PC.password) ? THOUGHTS.close : '';
    render();
    const card = screen.querySelector('.pc-login-card');
    card.classList.add('shake');
  }

  // ---- Desktop ----

  function think(text) {
    const line = screen.querySelector('.pc-desktop-thought');
    line.textContent = text;
    line.classList.remove('show');
    void line.offsetWidth; // restart the animation
    line.classList.add('show');
  }

  function openApp(id) {
    app = id;
    render();
    if (id === 'notes') onEvent('note-viewed', { note: openNote });
  }

  function windowFrame(title, body) {
    const win = el('section', `pc-window pc-window-${app}`);
    win.setAttribute('aria-label', title);
    const bar = el('div', 'pc-window-bar');
    const close = button('pc-window-close', '×', () => { app = null; render(); });
    close.setAttribute('aria-label', 'Fermer');
    bar.append(el('span', '', title), close);
    win.append(bar, body);
    return win;
  }

  function notesWindow() {
    const body = el('div', 'pc-notes');
    const list = el('div', 'pc-notes-list');
    for (const note of PC.notes) {
      const b = button(`pc-note-item ${note === openNote ? 'selected' : ''}`, '', () => {
        openNote = note;
        render();
        onEvent('note-viewed', { note });
      });
      b.append(el('strong', '', note.title), el('span', '', note.date));
      list.append(b);
    }
    const page = el('article', 'pc-note-page');
    page.append(el('h3', '', openNote.title), el('p', 'pc-note-date', openNote.date));
    for (const line of openNote.lines) page.append(el('p', '', line));
    body.append(list, page);
    return windowFrame('Notes', body);
  }

  function mailWindow() {
    // The reset link in Bulle's e-mail opens Bulle in the browser.
    const onMail = (type, data) => {
      onMailEvent(type, data);
      if (type === 'reset-link') openApp('bulle');
    };
    return windowFrame('Mail', createMailbox({ state, now, storyTime, variant: 'pc', onEvent: onMail }));
  }

  function bulleWindow() {
    return windowFrame('Bulle', createBulle({ state, now, variant: 'pc', onEvent: onBulleEvent }));
  }

  function filesWindow() {
    const body = el('div', 'pc-files');
    for (const name of PC.files) body.append(button('pc-file', name, () => think(THOUGHTS.file)));
    return windowFrame('Documents', body);
  }

  function trashWindow() {
    return windowFrame('Corbeille', el('p', 'pc-empty', 'La corbeille est vide.'));
  }

  const vaultWindow = () => windowFrame('Coffre', createVault({ state, variant: 'pc', onEvent: onVaultEvent }));

  const WINDOWS = {
    notes: notesWindow, mail: mailWindow, bulle: bulleWindow, vault: vaultWindow,
    files: filesWindow, trash: trashWindow,
  };

  function desktopScreen() {
    const icons = el('div', 'pc-icons');
    for (const a of APPS) {
      const b = button('pc-icon', '', () => openApp(a.id));
      const tile = icon(a.icon, 'pc-icon-glyph');
      tile.style.background = a.color;
      b.append(tile, el('span', 'pc-icon-name', a.name));
      icons.append(b);
    }

    const taskbar = el('div', 'pc-taskbar');
    const lock = button('pc-lock', 'Verrouiller', () => {
      relock(state, 'pc');
      app = null;
      showHint = false;
      onEvent('lock');
      render();
    });
    taskbar.append(
      el('span', 'pc-taskbar-user', 'Camille'),
      proofButton(state, 'pc', onEvent),
      el('span', 'pc-taskbar-time', hhmm(storyTime(now()))),
      lock,
    );

    const parts = [icons];
    if (app) parts.push(WINDOWS[app]());
    parts.push(el('p', 'pc-desktop-thought', ''), taskbar);
    return parts;
  }

  function render() {
    const open = isUnlocked(state, 'pc');
    screen.className = `pc-screen ${open ? 'pc-desktop' : 'pc-login'}`;
    screen.replaceChildren(...(open ? desktopScreen() : loginScreen()));
    // Keep the keyboard working: a field to type in first (the login, or the
    // Mail window's), else the open window's first control, else the first.
    const target = screen.querySelector('input:not(:disabled)')
      ?? screen.querySelector('.pc-window button')
      ?? screen.querySelector('button');
    target?.focus();
  }

  // Clocks and the lockout countdown keep running while the player sits here.
  const ticker = setInterval(() => {
    if (!monitor.isConnected) return clearInterval(ticker);
    const time = hhmm(storyTime(now()));
    for (const node of screen.querySelectorAll('.pc-lock-time, .pc-taskbar-time')) node.textContent = time;
    const input = screen.querySelector('.pc-login-card .pc-password');
    if (!input) return;
    const wait = lockRemaining(state, 'pc', now());
    if (input.disabled && wait === 0) return render();
    if (wait > 0) screen.querySelector('.pc-login-message').textContent = lockMessage(wait);
  }, 250);

  render();
  return monitor;
}
