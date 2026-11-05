// Camille's mailbox: the login, the inbox, an e-mail, the "Corbeille". The
// same component runs in the phone's Mail app and in the PC's Mail window,
// on the same game state, so what is done on one shows on the other.

import { MAIL } from '../data/camille.js';
import {
  recordFailedAttempt, lockRemaining, unlock, isUnlocked,
  sendAlert, deleteEmail, emptyMailTrash,
} from '../state.js';

const INTRUDER_SRC = 'assets/photos/intruder.svg';

const THOUGHTS = {
  send: 'Surtout pas : elle verrait le mail envoyé.',
  scam: 'Ce lien ne mène pas chez Bulle… C’est du hameçonnage.',
  missing: 'Hmm… elle risque de remarquer qu’il manque un mail.',
};

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function button(className, text, onClick) {
  const b = el('button', className, text);
  b.type = 'button';
  b.addEventListener('click', onClick);
  return b;
}

const hhmm = date => `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
const mss = ms => {
  const s = Math.ceil(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

/**
 * @param {object} options
 * @param {object} options.state       game state
 * @param {() => number} options.now   ms since the round started
 * @param {(ms: number) => Date} options.storyTime  story clock at that time
 * @param {'phone'|'pc'} options.variant  where it is shown
 * @param {(type: string, data?: object) => void} options.onEvent
 *   'unlock', 'lockout', 'email-viewed' {email}, 'email-deleted' {email},
 *   'trash-emptied'
 */
export function createMailbox({ state, now, storyTime, variant, onEvent = () => {} }) {
  const root = el('div', `mailbox mailbox--${variant}`);

  let view = 'inbox';
  let open = null;   // the e-mail being read
  let message = '';  // under the login form
  let thought = '';
  let confirmEmpty = false;

  // An alert e-mail is written from its template; Camille's own are as is.
  const content = email => (email.alert ? { ...MAIL.alerts[email.alert], time: hhmm(storyTime(email.sentAt)) } : email);

  const go = (next, extra = {}) => {
    view = next;
    if ('open' in extra) open = extra.open;
    thought = extra.thought ?? '';
    confirmEmpty = false;
    render();
  };

  function think(text) {
    const line = root.querySelector('.mail-thought');
    line.textContent = text;
    line.classList.remove('show');
    void line.offsetWidth; // restart the animation
    line.classList.add('show');
  }

  // ---- Login ----

  const lockMessage = wait => `Trop de tentatives. Réessayez dans ${mss(wait)}.`;

  function loginView() {
    const form = el('form', 'mail-login');
    const input = el('input', 'mail-password');
    input.type = 'password';
    input.placeholder = 'Mot de passe';
    input.autocomplete = 'off';
    input.setAttribute('aria-label', 'Mot de passe de la messagerie');
    const submit = el('button', 'mail-login-go', 'Se connecter');
    submit.type = 'submit';
    const wait = lockRemaining(state, 'mail', now());
    input.disabled = submit.disabled = wait > 0;

    form.append(
      el('span', 'mail-logo', '✉'),
      el('p', 'mail-login-title', 'Session expirée'),
      el('p', 'mail-login-text', 'Reconnectez-vous pour voir les e-mails de Camille.'),
      input,
      submit,
      el('p', 'mail-login-message', wait > 0 ? lockMessage(wait) : message),
    );
    form.addEventListener('submit', event => {
      event.preventDefault();
      login(input.value);
    });
    return [form];
  }

  function login(value) {
    if (!value || lockRemaining(state, 'mail', now()) > 0) return;
    if (value === MAIL.password) {
      unlock(state, 'mail');
      message = '';
      onEvent('unlock');
      return go('inbox');
    }
    const result = recordFailedAttempt(state, 'mail', now());
    message = 'Mot de passe incorrect.';
    if (result.lockedOut) {
      sendAlert(state, 'login', now());
      onEvent('lockout');
    }
    render();
  }

  // ---- Inbox, e-mail, trash ----

  function emailRow(email, onClick) {
    const { from, subject, time } = content(email);
    const row = onClick ? button('mail-row', '', onClick) : el('div', 'mail-row');
    if (email.alert) row.classList.add('alert');
    const text = el('span', 'mail-row-text');
    text.append(el('strong', '', from), el('span', 'mail-row-subject', subject));
    row.append(text, el('span', 'mail-row-time', time));
    return row;
  }

  function inboxView() {
    const bar = el('div', 'mail-bar');
    const small = variant === 'phone';
    const compose = button('mail-compose', small ? '✎' : '✎ Écrire', () => think(THOUGHTS.send));
    compose.setAttribute('aria-label', 'Écrire un e-mail');
    bar.append(
      el('span', 'mail-bar-title', small ? 'Réception' : 'Boîte de réception'),
      compose,
      button('mail-trash-link', `Corbeille (${state.mailTrash.length})`, () => go('trash')),
    );
    const list = el('div', 'mail-list');
    for (const email of state.inbox) {
      list.append(emailRow(email, () => {
        go('email', { open: email });
        onEvent('email-viewed', { email });
      }));
    }
    if (!state.inbox.length) list.append(el('p', 'mail-empty', 'Aucun e-mail.'));
    return [bar, list];
  }

  function emailView() {
    const email = open;
    const { from, subject, time, body } = content(email);
    const bar = el('div', 'mail-bar');
    bar.append(button('mail-back', '‹ Boîte de réception', () => go('inbox')));

    const page = el('article', 'mail-page');
    page.append(el('h3', 'mail-subject', subject), el('p', 'mail-from', `${from} · ${time}`));
    for (const line of body) page.append(el('p', '', line));
    if (email.alert === 'phone') {
      const img = el('img', 'mail-photo');
      img.src = INTRUDER_SRC;
      img.alt = 'Photo de l’intrus';
      page.insertBefore(img, page.lastChild);
    }
    if (email.scam) page.append(button('mail-scam-link', email.scam, () => think(THOUGHTS.scam)));

    const actions = el('div', 'mail-actions');
    actions.append(
      button('mail-reply', 'Répondre', () => think(THOUGHTS.send)),
      button('mail-delete', 'Supprimer', () => {
        deleteEmail(state, email.id);
        onEvent('email-deleted', { email });
        go('inbox', { thought: email.alert ? '' : THOUGHTS.missing });
      }),
    );
    return [bar, page, actions];
  }

  function trashView() {
    const bar = el('div', 'mail-bar');
    bar.append(button('mail-back', '‹ Boîte de réception', () => go('inbox')), el('span', 'mail-bar-title', 'Corbeille'));
    const list = el('div', 'mail-list');
    for (const email of state.mailTrash) list.append(emailRow(email));
    if (!state.mailTrash.length) list.append(el('p', 'mail-empty', 'La corbeille est vide.'));

    const parts = [bar, list];
    const count = state.mailTrash.length;
    if (confirmEmpty) {
      const ask = el('div', 'mail-confirm');
      ask.append(
        el('p', '', `Supprimer définitivement ${count} e-mail${count > 1 ? 's' : ''} ?`),
        button('mail-cancel', 'Annuler', () => { confirmEmpty = false; render(); }),
        button('mail-confirm-yes', 'Supprimer', () => {
          emptyMailTrash(state);
          onEvent('trash-emptied');
          go('trash');
        }),
      );
      parts.push(ask);
    } else {
      const empty = button('mail-empty-trash', 'Vider la corbeille', () => { confirmEmpty = true; render(); });
      empty.disabled = !count;
      parts.push(empty);
    }
    return parts;
  }

  const VIEWS = { inbox: inboxView, email: emailView, trash: trashView };

  function render() {
    const signedIn = isUnlocked(state, 'mail');
    root.classList.toggle('signed-in', signedIn);
    root.replaceChildren(...(signedIn ? VIEWS[view]() : loginView()), el('p', 'mail-thought', thought));
    root.querySelector('input:not(:disabled), button:not(:disabled)')?.focus();
  }

  // The lockout countdown keeps running while the mailbox is on screen.
  const ticker = setInterval(() => {
    if (!root.isConnected) return clearInterval(ticker);
    const input = root.querySelector('.mail-password');
    if (!input) return;
    const wait = lockRemaining(state, 'mail', now());
    if (input.disabled && wait === 0) return render();
    if (wait > 0) root.querySelector('.mail-login-message').textContent = lockMessage(wait);
  }, 250);

  render();
  return root;
}
