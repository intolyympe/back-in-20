// The final boss: Coffre, Camille's password manager. A random passphrase
// AND a physical key that is on her keyring, in her pocket. It resists, as it
// should: after a few tries the player can give up, and the debrief follows.
// Same component on the phone and on the PC.

import { tryVault } from '../state.js';
import { el, button } from '../dom.js';
import { icon } from '../icons.js';

export const GIVE_UP_AFTER = 3;

// What the player thinks after each wrong passphrase, then for good.
const TRIES = [
  'Raté. Ce n’est pas un mot de passe, c’est une phrase entière…',
  'Pas de chien, pas de date, pas de ville… Rien de sa vie là-dedans.',
  'Et même avec la phrase, il faudrait sa clé. Celui-là ne cédera pas.',
];

const THOUGHTS = {
  key: 'Sa clé est sur son trousseau… et son trousseau est dans sa poche.',
  forgot: 'Pas de « mot de passe oublié » ici : sans la phrase et la clé, personne n’entre.',
};

/**
 * @param {object} options
 * @param {object} options.state       game state
 * @param {'phone'|'pc'} options.variant  where it is shown
 * @param {(type: string) => void} options.onEvent  'tried', 'give-up'
 */
export function createVault({ state, variant, onEvent = () => {} }) {
  const root = el('div', `vault vault--${variant}`);
  root.dataset.subject = 'vault';
  let message = '';
  let thought = '';

  function think(text) {
    return () => {
      const line = root.querySelector('.vault-thought');
      line.textContent = text;
      line.classList.remove('show');
      void line.offsetWidth; // restart the animation
      line.classList.add('show');
    };
  }

  function render() {
    const form = el('form', 'vault-form');
    const input = el('input', 'vault-field');
    input.type = 'password';
    input.placeholder = 'Phrase de passe';
    input.autocomplete = 'off';
    input.setAttribute('aria-label', 'Phrase de passe du Coffre');
    const submit = el('button', 'vault-primary', 'Déverrouiller');
    submit.type = 'submit';
    form.append(input, submit);
    form.addEventListener('submit', event => {
      event.preventDefault();
      if (!input.value) return;
      tryVault(state);
      message = 'Phrase de passe incorrecte.';
      thought = TRIES[Math.min(state.vaultTries, TRIES.length) - 1];
      onEvent('tried');
      render();
    });

    const key = el('div', 'vault-key');
    key.append(icon('key', 'vault-key-icon'), el('span', '', 'Clé de sécurité : aucune clé détectée'));
    const insert = button('vault-link', 'Insérer la clé', think(THOUGHTS.key));

    const parts = [
      icon('vault', 'vault-logo'),
      el('p', 'vault-title', 'Coffre de Camille'),
      el('p', 'vault-text', '142 identifiants protégés'),
      form,
      el('p', 'vault-message', message),
      key,
      insert,
      button('vault-link', 'Phrase de passe oubliée ?', think(THOUGHTS.forgot)),
    ];
    if (state.vaultTries >= GIVE_UP_AFTER) {
      parts.push(button('vault-give-up', 'Laisser tomber', () => onEvent('give-up')));
    }
    parts.push(el('p', 'vault-thought', thought));
    root.replaceChildren(...parts);
    input.focus();
  }

  render();
  return root;
}
