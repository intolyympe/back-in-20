// The "Photographier l'écran" button shown in every account the player has
// opened. It belongs to the game, not to Camille's interfaces, so it looks
// the same everywhere.

import { el, button } from './dom.js';
import { icon } from './icons.js';

/**
 * @param {object} state
 * @param {string} accountId  'phone', 'pc', 'mail', 'bulle', 'bank'
 * @param {(type: string, data: object) => void} onEvent  receives 'proof' {id}
 */
export function proofButton(state, accountId, onEvent) {
  if (state.proofs.has(accountId)) return el('span', 'proof-button taken', 'Preuve prise');
  const b = button('proof-button', '', () => {
    onEvent('proof', { id: accountId });
    if (state.proofs.has(accountId)) b.replaceWith(el('span', 'proof-button taken', 'Preuve prise'));
  });
  b.append(icon('camera'), el('span', '', 'Photographier l’écran'));
  b.title = 'Une preuve pour ton rapport, prise avec ton propre téléphone';
  return b;
}
