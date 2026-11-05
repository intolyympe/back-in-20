import { EFF_WORDS } from './eff-wordlist.js';

export const CHARSETS = {
  upper:   'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  lower:   'abcdefghijklmnopqrstuvwxyz',
  digits:  '0123456789',
  symbols: '!@#$%^&*()-_=+[]{}|;:,.<>?',
};

// Uniform random integer in [0, max) from the browser's CSPRNG.
// Plain "random % max" slightly favours small values; rejecting the top of
// the range removes that bias.
export function randomInt(max) {
  const limit = Math.floor(0x100000000 / max) * max;
  const buf = new Uint32Array(1);
  do crypto.getRandomValues(buf); while (buf[0] >= limit);
  return buf[0] % max;
}

function randomChar(set) {
  return set[randomInt(set.length)];
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * @param {number} length
 * @param {{upper?: boolean, lower?: boolean, digits?: boolean, symbols?: boolean}} options
 *        Enabled sets are each guaranteed to appear at least once.
 */
export function generatePassword(length, options) {
  const enabled = enabledSets(options);
  const charset = enabled.map(name => CHARSETS[name]).join('');
  const chars = enabled.map(name => randomChar(CHARSETS[name])).slice(0, length);
  while (chars.length < length) chars.push(randomChar(charset));

  return shuffle(chars).join('');
}

function enabledSets(options) {
  const enabled = Object.keys(CHARSETS).filter(name => options[name]);
  return enabled.length ? enabled : ['lower'];
}

/** Entropy in bits of generatePassword(length, options) (upper bound). */
export function passwordEntropy(length, options) {
  const size = enabledSets(options).reduce((sum, name) => sum + CHARSETS[name].length, 0);
  return length * Math.log2(size);
}

export const PASSPHRASE_SEPARATORS = ['-', '_', '.', ' '];

/**
 * Diceware-style passphrase: words drawn uniformly from the EFF list.
 * @param {number} count number of words
 * @param {{separator?: string, capitalize?: boolean}} [options]
 */
export function generatePassphrase(count, { separator = '-', capitalize = false } = {}) {
  const words = Array.from({ length: count }, () => EFF_WORDS[randomInt(EFF_WORDS.length)]);
  return words
    .map(word => (capitalize ? word[0].toUpperCase() + word.slice(1) : word))
    .join(separator);
}

/** Entropy in bits of generatePassphrase(count). */
export function passphraseEntropy(count) {
  return count * Math.log2(EFF_WORDS.length);
}
