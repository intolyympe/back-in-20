// Camille's bank app, Banque Nébula (made up): her code, which nobody knows,
// "Code oublié ?" and the secret question, then the code texted to the phone
// the player is holding, and her accounts. Nothing can be moved: the player
// only looks.

import { BANK } from '../data/camille.js';
import {
  recordFailedAttempt, lockRemaining, isUnlocked,
  answerSecretQuestion, sendBankCode, verifyBankCode,
} from '../state.js';
import { el, button, mss } from '../dom.js';
import { icon } from '../icons.js';
import { notable } from '../notable.js';

const THOUGHTS = {
  transfer: 'Surtout pas : je suis là pour prouver, pas pour voler.',
  security: 'Une question dont la réponse est sur Bulle, un SMS sur un téléphone ouvert… Rien ne tenait.',
  trace: 'Surtout pas : elle le verrait.',
};

const randomCode = () => String(Math.floor(Math.random() * 1_000_000)).padStart(6, '0');

/**
 * @param {object} options
 * @param {object} options.state       game state
 * @param {() => number} options.now   ms since the round started
 * @param {(type: string, data?: object) => void} options.onEvent
 *   'code-sent' {text}, 'unlock', 'account-viewed'
 */
export function createBank({ state, now, onEvent = () => {} }) {
  const root = el('div', 'bank');

  let view = 'login';
  let message = '';

  const go = (next, extra = {}) => {
    view = next;
    message = extra.message ?? '';
    render();
  };

  function think(text) {
    return () => {
      const line = root.querySelector('.bank-thought');
      line.textContent = text;
      line.classList.remove('show');
      void line.offsetWidth; // restart the animation
      line.classList.add('show');
    };
  }

  const locked = () => lockRemaining(state, 'bank', now());
  const lockMessage = () => `Trop de tentatives. Réessayez dans ${mss(locked())}.`;

  // A form with one field. `check` returns an error message, or nothing.
  function form({ label, numeric, submitLabel, check }) {
    const box = el('form', 'bank-form');
    const input = el('input', 'bank-field');
    input.type = numeric ? 'password' : 'text';
    if (numeric) input.inputMode = 'numeric';
    input.placeholder = label;
    input.autocomplete = 'off';
    input.setAttribute('aria-label', label);
    const submit = el('button', 'bank-primary', submitLabel);
    submit.type = 'submit';
    input.disabled = submit.disabled = locked() > 0;
    box.append(input, submit);
    box.addEventListener('submit', event => {
      event.preventDefault();
      if (!input.value.trim() || locked() > 0) return;
      const error = check(input.value);
      if (error) go(view, { message: error });
    });
    return box;
  }

  // A wrong try counts towards the lockout, whatever the step.
  function wrong(text) {
    const result = recordFailedAttempt(state, 'bank', now());
    return result.lockedOut ? lockMessage() : text;
  }

  function brand(...children) {
    const box = el('div', 'bank-card');
    box.append(icon('bank', 'bank-logo'), el('p', 'bank-brand', 'Banque Nébula'), ...children);
    return box;
  }

  const messageLine = () => el('p', 'bank-message', locked() > 0 ? lockMessage() : message);

  // ---- Getting in ----

  function loginView() {
    return [brand(
      el('p', 'bank-text', `Identifiant client : ${BANK.client}`),
      // Her code is in no clue: the way in is "Code oublié ?".
      form({ label: 'Code secret', numeric: true, submitLabel: 'Se connecter', check: () => wrong('Code incorrect.') }),
      messageLine(),
      button('bank-link', 'Code oublié ?', () => go('question')),
    )];
  }

  function questionView() {
    return [brand(
      el('p', 'bank-title', 'Question secrète'),
      el('p', 'bank-question', BANK.question),
      form({
        label: 'Votre réponse',
        submitLabel: 'Valider',
        check: value => {
          if (!answerSecretQuestion(state, value, BANK.answer)) return wrong('Réponse incorrecte.');
          const text = sendBankCode(state, now(), randomCode());
          onEvent('code-sent', { text });
          go('code');
          return null;
        },
      }),
      messageLine(),
      button('bank-link', 'Retour', () => go('login')),
    )];
  }

  function codeView() {
    // The text drops in at the top of the screen, as on any phone.
    const latest = state.texts[0];
    const notice = el('div', 'phone-notification bank-notice');
    notice.append(el('strong', '', 'Messages · Nébula'), el('span', '', BANK.text(latest.code)));
    return [notice, brand(
      el('p', 'bank-title', 'Validation par SMS'),
      el('p', 'bank-text', `Un code a été envoyé au ${BANK.phone}.`),
      form({
        label: 'Code à 6 chiffres',
        numeric: true,
        submitLabel: 'Valider',
        check: value => {
          if (!verifyBankCode(state, value, now())) return wrong('Code incorrect.');
          onEvent('unlock');
          go('accounts');
          onEvent('account-viewed');
          return null;
        },
      }),
      messageLine(),
      button('bank-link', 'Renvoyer le SMS', () => {
        const text = sendBankCode(state, now(), randomCode());
        onEvent('code-sent', { text });
        go('code', { message: 'Nouveau code envoyé.' });
      }),
    )];
  }

  // ---- Inside ----

  function tabs(current) {
    const bar = el('nav', 'bank-tabs');
    for (const [id, label] of [['accounts', 'Comptes'], ['transfer', 'Virement'], ['security', 'Sécurité']]) {
      bar.append(button(`bank-tab ${id === current ? 'current' : ''}`, label, () => go(id)));
    }
    return bar;
  }

  function accountsView() {
    const head = el('div', 'bank-balance');
    head.append(el('span', '', 'Compte courant'), el('strong', '', BANK.balance));
    const list = el('div', 'bank-operations');
    for (const op of BANK.operations) {
      const row = el('div', 'bank-operation');
      row.append(
        el('span', 'bank-op-date', op.date),
        el('span', 'bank-op-label', op.label),
        el('span', `bank-op-amount ${op.amount.startsWith('+') ? 'in' : ''}`, op.amount),
      );
      if (op.clue) notable(row, BANK.clue);
      list.append(row);
    }
    return [tabs('accounts'), head, el('p', 'bank-section', 'Dernières opérations'), list];
  }

  function transferView() {
    const box = el('div', 'bank-card');
    box.append(
      el('p', 'bank-title', 'Nouveau virement'),
      button('bank-field bank-fake-field', 'Bénéficiaire', think(THOUGHTS.transfer)),
      button('bank-field bank-fake-field', 'Montant', think(THOUGHTS.transfer)),
      button('bank-primary', 'Continuer', think(THOUGHTS.transfer)),
    );
    return [tabs('transfer'), box];
  }

  function securityView() {
    const list = el('div', 'bank-settings');
    list.dataset.subject = 'bank-security';
    for (const [name, value] of [
      ['Question secrète', 'Ville de naissance'],
      ['Validation des connexions', 'Par SMS'],
      ['Clé de sécurité', 'Aucune'],
    ]) {
      const row = button('bank-setting', '', think(THOUGHTS.security));
      row.append(el('span', '', name), el('span', 'bank-setting-value', value));
      list.append(row);
    }
    return [tabs('security'), list, button('bank-link', 'Modifier', think(THOUGHTS.trace))];
  }

  const OUTSIDE = { login: loginView, question: questionView };
  const INSIDE = { accounts: accountsView, transfer: transferView, security: securityView };

  function render() {
    let views;
    if (isUnlocked(state, 'bank')) {
      if (!INSIDE[view]) view = 'accounts';
      views = INSIDE[view]();
    } else if (state.bank.code) {
      // A code was sent: coming back to the app goes straight to it.
      view = 'code';
      views = codeView();
    } else {
      if (!OUTSIDE[view]) view = 'login';
      views = OUTSIDE[view]();
    }
    root.dataset.view = view;
    root.dataset.subject = isUnlocked(state, 'bank') ? 'bank' : 'bank-locked';
    root.replaceChildren(...views, el('p', 'bank-thought', ''));
    root.querySelector('input:not(:disabled), button:not(:disabled)')?.focus();
  }

  // The lockout countdown keeps running while the app is on screen.
  const ticker = setInterval(() => {
    if (!root.isConnected) return clearInterval(ticker);
    const input = root.querySelector('.bank-form .bank-field');
    if (!input) return;
    const wait = locked();
    if (input.disabled && wait === 0) return render();
    if (wait > 0) root.querySelector('.bank-message').textContent = lockMessage();
  }, 250);

  render();
  return root;
}
