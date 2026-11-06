// Camille's account on Bulle, a made-up social network: the login, "mot de
// passe oublié ?", the new password once the reset link is opened, then her
// private profile, a chat and the settings. Same component on the phone and
// on the PC, on the same game state.

import { BULLE, PC } from '../data/camille.js';
import {
  recordFailedAttempt, lockRemaining, isUnlocked, requestBulleReset, changeBullePassword,
} from '../state.js';
import { el, button, mss } from '../dom.js';
import { icon } from '../icons.js';
import { proofButton } from '../proof.js';
import { notable } from '../notable.js';

const MIN_LENGTH = 8;

const THOUGHTS = {
  notPc: 'Pas le même que le PC… Ici, elle en a un autre.',
  trace: 'Surtout pas : elle le verrait.',
  like: 'Surtout pas : un « j’aime » de son propre compte, ça se remarque.',
  twoFactor: 'Désactivée… C’est pour ça que le lien a suffi.',
};

/**
 * @param {object} options
 * @param {object} options.state       game state
 * @param {() => number} options.now   ms since the round started
 * @param {'phone'|'pc'} options.variant  where it is shown
 * @param {(type: string, data?: object) => void} options.onEvent
 *   'reset-sent', 'unlock', 'post-viewed' {post}, 'chat-viewed' {chat}, 'proof' {id}
 */
export function createBulle({ state, now, variant, onEvent = () => {} }) {
  const root = el('div', `bulle bulle--${variant}`);

  let view = 'login';
  let open = null; // the post being looked at
  let message = '';

  const go = (next, extra = {}) => {
    view = next;
    if ('open' in extra) open = extra.open;
    message = extra.message ?? '';
    render();
  };

  function think(text) {
    return () => {
      const line = root.querySelector('.bulle-thought');
      line.textContent = text;
      line.classList.remove('show');
      void line.offsetWidth; // restart the animation
      line.classList.add('show');
    };
  }

  function passwordField(label) {
    const input = el('input', 'bulle-field');
    input.type = 'password';
    input.placeholder = label;
    input.autocomplete = 'off';
    input.setAttribute('aria-label', label);
    return input;
  }

  function card(...children) {
    const box = el('div', 'bulle-card');
    const logo = icon('bulle', 'bulle-logo');
    box.append(logo, el('p', 'bulle-brand', 'Bulle'), ...children);
    return box;
  }

  // ---- Signed out ----

  function loginView() {
    const form = el('form', 'bulle-form');
    const input = passwordField('Mot de passe');
    const submit = el('button', 'bulle-primary', 'Se connecter');
    submit.type = 'submit';
    const wait = lockRemaining(state, 'bulle', now());
    input.disabled = submit.disabled = wait > 0;
    form.append(input, submit);
    form.addEventListener('submit', event => {
      event.preventDefault();
      const value = input.value;
      if (!value || lockRemaining(state, 'bulle', now()) > 0) return;
      // Her real Bulle password is not in any clue: the way in is the reset.
      const result = recordFailedAttempt(state, 'bulle', now());
      go('login', { message: result.lockedOut ? '' : 'Mot de passe incorrect.' });
      if (value === PC.password) think(THOUGHTS.notPc)();
    });
    return [card(
      el('p', 'bulle-account', `Compte : ${BULLE.handle}`),
      form,
      el('p', 'bulle-message', wait > 0 ? `Trop de tentatives. Réessayez dans ${mss(wait)}.` : message),
      button('bulle-link', 'Mot de passe oublié ?', () => go('forgot')),
    )];
  }

  function forgotView() {
    return [card(
      el('p', 'bulle-title', 'Mot de passe oublié'),
      el('p', 'bulle-text', `Nous allons envoyer un lien de réinitialisation à l’adresse e-mail liée à ${BULLE.handle}.`),
      button('bulle-primary', 'Envoyer le lien', () => {
        requestBulleReset(state, now());
        onEvent('reset-sent');
        go('sent');
      }),
      button('bulle-link', 'Retour', () => go('login')),
    )];
  }

  function sentView() {
    return [card(
      el('p', 'bulle-title', 'E-mail envoyé'),
      el('p', 'bulle-text', 'Ouvrez le lien reçu dans votre boîte mail pour choisir un nouveau mot de passe.'),
      // Sending it again is one more e-mail in her inbox.
      button('bulle-link', 'Renvoyer le lien', () => {
        requestBulleReset(state, now());
        onEvent('reset-sent');
        go('sent', { message: 'Nouveau lien envoyé.' });
      }),
      el('p', 'bulle-message', message),
    )];
  }

  function resetView() {
    const form = el('form', 'bulle-form');
    const input = passwordField('Nouveau mot de passe');
    const submit = el('button', 'bulle-primary', 'Valider');
    submit.type = 'submit';
    form.append(input, submit);
    form.addEventListener('submit', event => {
      event.preventDefault();
      if (input.value.length < MIN_LENGTH) return go('reset', { message: `Au moins ${MIN_LENGTH} caractères.` });
      changeBullePassword(state, now());
      onEvent('unlock');
      go('profile');
    });
    return [card(
      el('p', 'bulle-title', 'Nouveau mot de passe'),
      el('p', 'bulle-text', `Choisissez un nouveau mot de passe pour ${BULLE.handle}.`),
      form,
      el('p', 'bulle-message', message),
    )];
  }

  // ---- Signed in ----

  function tabs(current) {
    const bar = el('nav', 'bulle-tabs');
    for (const [id, label] of [['profile', 'Publications'], ['chat', 'Messages'], ['settings', 'Réglages']]) {
      const tab = button(`bulle-tab ${id === current ? 'current' : ''}`, label, () => {
        go(id);
        if (id === 'chat') onEvent('chat-viewed', { chat: BULLE.chat });
      });
      bar.append(tab);
    }
    return bar;
  }

  function profileHead() {
    const head = el('header', 'bulle-head');
    const text = el('div', 'bulle-head-text');
    text.append(
      el('strong', '', BULLE.name),
      el('span', 'bulle-handle', BULLE.handle),
      el('span', '', BULLE.bio),
      el('span', 'bulle-private', `Compte privé · ${BULLE.followers} abonnés`),
    );
    head.append(el('span', 'bulle-avatar', BULLE.name[0]), text, proofButton(state, 'bulle', onEvent));
    return head;
  }

  function postCard(post, onClick) {
    const item = onClick ? button('bulle-post', '', onClick) : el('div', 'bulle-post');
    if (post.src) {
      const img = el('img');
      img.src = post.src;
      img.alt = '';
      item.append(img);
    } else {
      item.classList.add('text-only');
    }
    item.append(el('span', 'bulle-post-text', post.text));
    const meta = [post.date, post.place && `à ${post.place}`, `${post.likes} j’aime`].filter(Boolean).join(' · ');
    item.append(el('span', 'bulle-post-meta', meta));
    return item;
  }

  function profileView() {
    const list = el('div', 'bulle-posts');
    for (const post of BULLE.posts) {
      list.append(postCard(post, () => {
        go('post', { open: post });
        onEvent('post-viewed', { post });
      }));
    }
    return [profileHead(), tabs('profile'), list];
  }

  function postView() {
    const actions = el('div', 'bulle-actions');
    actions.append(
      button('bulle-secondary', 'J’aime', think(THOUGHTS.like)),
      button('bulle-secondary', 'Commenter', think(THOUGHTS.trace)),
    );
    return [
      button('bulle-back', '‹ Publications', () => go('profile')),
      open.clue ? notable(postCard(open), open.clue) : postCard(open),
      actions,
    ];
  }

  function chatView() {
    const bubbles = el('div', 'bulle-bubbles');
    for (const m of BULLE.chat.messages) {
      const bubble = el('p', m.me ? 'bulle-bubble me' : 'bulle-bubble', m.text);
      bubbles.append(m.clue ? notable(bubble, m.clue) : bubble);
    }
    return [
      profileHead(),
      tabs('chat'),
      el('p', 'bulle-chat-with', `Conversation avec ${BULLE.chat.name}`),
      bubbles,
      button('bulle-reply', 'Écrire un message…', think(THOUGHTS.trace)),
    ];
  }

  function settingsView() {
    const list = el('div', 'bulle-settings');
    const rows = [
      ['Adresse e-mail', 'c••••••@•••••', THOUGHTS.trace],
      ['Double authentification', 'Désactivée', THOUGHTS.twoFactor],
      ['Appareils connectés', '2', THOUGHTS.trace],
      ['Se déconnecter', '', THOUGHTS.trace],
    ];
    for (const [name, value, thought] of rows) {
      const row = button('bulle-setting', '', think(thought));
      row.append(el('span', '', name), el('span', 'bulle-setting-value', value));
      list.append(row);
    }
    return [profileHead(), tabs('settings'), list];
  }

  const SIGNED_OUT = { login: loginView, forgot: forgotView, sent: sentView };
  const SIGNED_IN = { profile: profileView, post: postView, chat: chatView, settings: settingsView };

  function render() {
    let views;
    if (isUnlocked(state, 'bulle')) {
      if (!SIGNED_IN[view]) view = 'profile';
      views = SIGNED_IN[view]();
    } else if (state.bulle.linkOpened) {
      view = 'reset';
      views = resetView();
    } else {
      if (!SIGNED_OUT[view]) view = 'login';
      views = SIGNED_OUT[view]();
    }
    root.dataset.view = view;
    // What a photo would show: her account open (a post, the 2FA setting…).
    root.dataset.subject = !isUnlocked(state, 'bulle') ? 'bulle-locked'
      : view === 'settings' ? 'bulle-settings'
        : view === 'post' ? `bulle-${open.id}` : 'bulle';
    root.replaceChildren(...views, el('p', 'bulle-thought', ''));
    root.querySelector('input:not(:disabled), button:not(:disabled)')?.focus();
  }

  // The lockout countdown keeps running while Bulle is on screen.
  const ticker = setInterval(() => {
    if (!root.isConnected) return clearInterval(ticker);
    if (view !== 'login' || isUnlocked(state, 'bulle')) return;
    const message = root.querySelector('.bulle-message');
    const wait = lockRemaining(state, 'bulle', now());
    const input = root.querySelector('.bulle-field');
    if (input?.disabled && wait === 0) return render();
    if (wait > 0 && message) message.textContent = `Trop de tentatives. Réessayez dans ${mss(wait)}.`;
  }, 250);

  render();
  return root;
}
