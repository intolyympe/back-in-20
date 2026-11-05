// Password strength estimator based on pattern matching, inspired by
// Dropbox's zxcvbn (https://github.com/dropbox/zxcvbn).
//
// Counting character classes is misleading: "abcdefghijklmnopqrstuvwxyz"
// uses 26 symbols over 26 characters (~122 bits) but an attacker tries
// alphabet sequences long before random strings.
//
// Instead we:
//   1. find every known pattern in the password (dictionary words, leaked
//      passwords, passphrases, sequences, keyboard walks, repeats, dates,
//      and optionally the user's own personal info),
//   2. estimate how many guesses each pattern costs an attacker,
//   3. pick the cheapest way to cover the whole password with patterns and
//      random ("bruteforce") chunks, since that is what a smart attacker does.
//
// All guess counts are stored as log2 values ("bits") to avoid overflowing
// floats on long passwords.

import { DICTIONARIES, KEYBOARD_LINES } from './wordlists.js';
import { EFF_WORDS } from './eff-wordlist.js';

const MAX_ANALYZED_LENGTH = 128;
const MIN_PATTERN_LENGTH = 3;
// Each extra pattern in the sequence costs at least this many guesses,
// so the estimator doesn't split a random string into many tiny "patterns".
const LOG2_GUESSES_PER_EXTRA_PATTERN = Math.log2(10000);
const LOG2_MIN_PATTERN_GUESSES = Math.log2(50);
const REFERENCE_YEAR = 2026;
const MIN_YEAR_SPACE = 20;

// Keyboard walk cost: ~47 starting keys, ~4 neighbours per key.
const KEYBOARD_STARTS = 47;
const KEYBOARD_DEGREE = 4;

const LEET = {
  '4': ['a'], '@': ['a'], '8': ['b'], '(': ['c'], '{': ['c'], '[': ['c'], '<': ['c'],
  '3': ['e'], '6': ['g'], '9': ['g'], '1': ['i', 'l'], '!': ['i'], '|': ['i', 'l'],
  '0': ['o'], '$': ['s'], '5': ['s'], '7': ['t'], '+': ['t'], '%': ['x'], '2': ['z'],
};

// Labels and colors live in the UI (translations, themes); the analyzer only
// knows the thresholds.
export const LEVELS = [
  { id: 'veryWeak',   minBits: 0 },
  { id: 'weak',       minBits: 20 },
  { id: 'fair',       minBits: 35 },
  { id: 'good',       minBits: 55 },
  { id: 'strong',     minBits: 70 },
  { id: 'veryStrong', minBits: 85 },
];

/**
 * @param {string} password
 * @param {{personal?: object|null}} [options]
 *        personal: dictionary from buildPersonalDictionary(), tried first
 * @returns {{
 *   bits: number,         // log2 of the estimated number of guesses
 *   naiveBits: number,    // what a "character classes x length" formula would say
 *   score: number,        // index into LEVELS
 *   sequence: object[],   // patterns that cover the password, in order
 *   warnings: {code: string, params?: object}[],     // see buildFeedback
 *   suggestions: {code: string, params?: object}[],
 * }}
 */
export function analyze(password, options = {}) {
  // The search is roughly cubic in length, so very long inputs are analyzed
  // in chunks whose costs add up.
  let bits = 0;
  const sequence = [];
  for (let offset = 0; offset < password.length; offset += MAX_ANALYZED_LENGTH) {
    const chunk = password.slice(offset, offset + MAX_ANALYZED_LENGTH);
    const result = cheapestSequence(chunk, findMatches(chunk, options));
    bits += result.bits;
    sequence.push(...result.sequence.map(m => ({ ...m, i: m.i + offset, j: m.j + offset })));
  }
  const { warnings, suggestions } = buildFeedback(sequence, bits);

  return {
    bits,
    naiveBits: password.length * Math.log2(charPool(password)),
    score: scoreFromBits(bits),
    sequence,
    warnings,
    suggestions,
  };
}

export function scoreFromBits(bits) {
  let score = 0;
  LEVELS.forEach((level, i) => { if (bits >= level.minBits) score = i; });
  return score;
}

// ---------------------------------------------------------------------------
// Pattern matching
// ---------------------------------------------------------------------------

function findMatches(pwd, options) {
  // Personal info comes first so it wins ties against generic patterns.
  const dictionaries = options.personal
    ? { personal: options.personal, ...DICTIONARIES }
    : DICTIONARIES;
  return [
    ...dictionaryMatches(pwd, dictionaries),
    ...personalComboMatches(pwd, options.personal),
    ...passphraseMatches(pwd),
    ...sequenceMatches(pwd),
    ...keyboardMatches(pwd),
    ...repeatMatches(pwd, options),
    ...dateMatches(pwd),
  ];
}

function dictionaryMatches(pwd, dictionaries) {
  const matches = [];
  const lower = pwd.toLowerCase();
  const maxWordLength = Math.max(...Object.values(dictionaries).map(d => d.maxLength));
  // Personal dictionaries may hold 2-letter initials.
  const minWordLength = Math.min(...Object.values(dictionaries).map(d => d.minLength ?? MIN_PATTERN_LENGTH));

  for (let i = 0; i < pwd.length; i++) {
    const maxJ = Math.min(pwd.length, i + maxWordLength);
    for (let j = i + minWordLength; j <= maxJ; j++) {
      const token = pwd.slice(i, j);

      for (const { word, substitutions } of unleetVariants(lower.slice(i, j))) {
        const reversedWord = [...word].reverse().join('');
        const candidates = [{ text: word, reversed: false }];
        if (reversedWord !== word) candidates.push({ text: reversedWord, reversed: true });

        for (const { text, reversed } of candidates) {
          for (const [name, dict] of Object.entries(dictionaries)) {
            const rank = dict.ranked.get(text);
            if (!rank) continue;
            const bits = Math.log2(dict.guessesForRank(rank))
              + Math.log2(uppercaseVariations(token))
              + substitutions          // x2 per kind of substitution
              + (reversed ? 1 : 0);    // x2 for trying words backwards
            matches.push({
              type: 'dictionary', dictionary: name, i, j, token,
              word: text, leet: substitutions > 0, reversed, bits,
              sources: dict.sources ? [dict.sources.get(text)] : undefined,
            });
          }
        }
      }
    }
  }
  return matches;
}

// Chains of 2-4 personal tokens, optionally joined by a separator:
// "lea-hugo", "Rex120590", "camille.lyon". An attacker with info about the
// person tries these combinations early, so the chain is a single pattern.
const COMBO_SEPARATORS = ' -_.&+/@!*#';
const MAX_COMBO_PARTS = 4;

function personalComboMatches(pwd, personal) {
  if (!personal) return [];
  const matches = [];
  const lower = pwd.toLowerCase();
  const log2Tokens = Math.log2(personal.ranked.size);
  const log2Separators = Math.log2(COMBO_SEPARATORS.length + 1);

  // tokenEnds[i]: end indices of personal tokens starting at i
  const tokenEnds = Array.from({ length: pwd.length + 1 }, () => []);
  for (let i = 0; i < pwd.length; i++) {
    for (let j = i + personal.minLength; j <= Math.min(pwd.length, i + personal.maxLength); j++) {
      if (personal.ranked.has(lower.slice(i, j))) tokenEnds[i].push(j);
    }
  }

  const extend = (start, end, parts) => {
    if (parts.length >= 2) {
      const token = pwd.slice(start, end);
      matches.push({
        type: 'dictionary', dictionary: 'personal', combo: true, i: start, j: end, token,
        sources: [...new Set(parts.map(p => personal.sources.get(p.toLowerCase())))],
        bits: parts.length * log2Tokens
          + (parts.length - 1) * log2Separators
          + parts.reduce((sum, p) => sum + Math.log2(uppercaseVariations(p)), 0),
      });
    }
    if (parts.length === MAX_COMBO_PARTS) return;
    const nextStarts = COMBO_SEPARATORS.includes(pwd[end]) ? [end, end + 1] : [end];
    for (const next of nextStarts) {
      for (const j of tokenEnds[next] ?? []) extend(start, j, [...parts, pwd.slice(next, j)]);
    }
  };

  for (let i = 0; i < pwd.length; i++) {
    for (const j of tokenEnds[i]) extend(i, j, [pwd.slice(i, j)]);
  }
  return matches;
}

// Diceware-style passphrases: "cactus-velvet-tulip-anchor". Every word of the
// EFF list is equally likely, so each one costs log2(7776) ≈ 12.9 bits; a
// consistent separator adds a few bits.
const EFF_SET = new Set(EFF_WORDS);
const EFF_MAX_LENGTH = Math.max(...EFF_WORDS.map(w => w.length));
const LOG2_PER_EFF_WORD = Math.log2(EFF_WORDS.length);
const PASSPHRASE_SEPARATORS = ' -_.,+/';
const MAX_PASSPHRASE_WORDS = 12;

function passphraseMatches(pwd) {
  const matches = [];
  const lower = pwd.toLowerCase();

  const wordEnds = Array.from({ length: pwd.length + 1 }, () => []);
  for (let i = 0; i < pwd.length; i++) {
    for (let j = i + MIN_PATTERN_LENGTH; j <= Math.min(pwd.length, i + EFF_MAX_LENGTH); j++) {
      if (EFF_SET.has(lower.slice(i, j))) wordEnds[i].push(j);
    }
  }

  // separator: null = not decided yet, '' = words glued together
  const walk = (start, end, words, separator) => {
    if (words.length >= 2) {
      matches.push({
        type: 'passphrase', i: start, j: end, token: pwd.slice(start, end), words: words.length,
        bits: words.length * LOG2_PER_EFF_WORD
          + (separator ? Math.log2(PASSPHRASE_SEPARATORS.length + 1) : 0)
          + passphraseCaseBits(words),
      });
    }
    if (words.length === MAX_PASSPHRASE_WORDS) return;
    const next = [];
    if (separator === null || separator === '') next.push([end, '']);
    const ch = pwd[end];
    if (ch && PASSPHRASE_SEPARATORS.includes(ch) && (separator === null || separator === ch)) {
      next.push([end + 1, ch]);
    }
    for (const [from, sep] of next) {
      for (const j of wordEnds[from] ?? []) walk(start, j, [...words, pwd.slice(from, j)], sep);
    }
  };

  for (let i = 0; i < pwd.length; i++) {
    for (const j of wordEnds[i]) walk(i, j, [pwd.slice(i, j)], null);
  }
  return matches;
}

// Same capitalization on every word ("Tulip-Anchor") is one cheap rule;
// anything else is paid per word.
function passphraseCaseBits(words) {
  const style = w => (w === w.toLowerCase() ? 'lower'
    : w === w.toUpperCase() ? 'upper'
      : /^\p{Lu}[^\p{Lu}]*$/u.test(w) ? 'title' : 'mixed');
  const styles = new Set(words.map(style));
  if (styles.size === 1 && !styles.has('mixed')) return styles.has('lower') ? 0 : 1;
  return words.reduce((sum, w) => sum + Math.log2(uppercaseVariations(w)), 0);
}

// Returns the token itself plus its fully "un-leeted" spellings
// (e.g. "p@ssw0rd" -> "password"). "1" and "|" can be "i" or "l".
function unleetVariants(token) {
  const variants = [{ word: token, substitutions: 0 }];
  if (![...token].some(ch => LEET[ch])) return variants;

  let partial = [{ word: '', kinds: new Set() }];
  for (const ch of token) {
    const options = LEET[ch];
    if (!options) {
      partial = partial.map(p => ({ word: p.word + ch, kinds: p.kinds }));
      continue;
    }
    partial = partial
      .flatMap(p => options.map(letter => ({
        word: p.word + letter,
        kinds: new Set([...p.kinds, ch + letter]),
      })))
      .slice(0, 32);
  }
  for (const p of partial) variants.push({ word: p.word, substitutions: p.kinds.size });
  return variants;
}

function uppercaseVariations(token) {
  const upper = (token.match(/[A-Z]/g) || []).length;
  const lower = (token.match(/[a-z]/g) || []).length;
  if (upper === 0) return 1;
  // ALL CAPS, Capitalized, or lastLetterUp: the usual suspects, cheap to try.
  if (lower === 0 || /^[A-Z][^A-Z]+$/.test(token) || /^[^A-Z]+[A-Z]$/.test(token)) return 2;
  let variations = 0;
  for (let k = 1; k <= Math.min(upper, lower); k++) variations += binomial(upper + lower, k);
  return variations;
}

// Runs of characters with a constant code step: "abcd", "9753", "ACEG"...
function sequenceMatches(pwd) {
  const matches = [];
  if (pwd.length < MIN_PATTERN_LENGTH) return matches;

  const push = (i, j, delta) => {
    const length = j - i + 1;
    if (length < MIN_PATTERN_LENGTH || delta === 0 || Math.abs(delta) > 5) return;
    const token = pwd.slice(i, j + 1);
    const first = token[0];
    let start = 'aAzZ019'.includes(first) ? 4 : /\d/.test(first) ? 10 : 26;
    if (delta < 0) start *= 2;
    matches.push({
      type: 'sequence', i, j: j + 1, token, delta,
      bits: Math.log2(start * length * Math.abs(delta)),
    });
  };

  let start = 0;
  let lastDelta = pwd.charCodeAt(1) - pwd.charCodeAt(0);
  for (let k = 2; k < pwd.length; k++) {
    const delta = pwd.charCodeAt(k) - pwd.charCodeAt(k - 1);
    if (delta === lastDelta) continue;
    push(start, k - 1, lastDelta);
    start = k - 1;
    lastDelta = delta;
  }
  push(start, pwd.length - 1, lastDelta);
  return matches;
}

// Straight lines on QWERTY / AZERTY keyboards: "qwerty", "azerty", "1qaz"...
function keyboardMatches(pwd) {
  const matches = [];
  const lower = pwd.toLowerCase();
  const lines = KEYBOARD_LINES.flatMap(line => [line, [...line].reverse().join('')]);

  for (let i = 0; i < pwd.length; i++) {
    let longest = 0;
    for (const line of lines) {
      let k = longest + 1;
      while (i + k <= pwd.length && line.includes(lower.slice(i, i + k))) k++;
      longest = Math.max(longest, k - 1);
    }
    for (let length = MIN_PATTERN_LENGTH; length <= longest; length++) {
      const token = pwd.slice(i, i + length);
      matches.push({
        type: 'keyboard', i, j: i + length, token,
        bits: Math.log2(KEYBOARD_STARTS * KEYBOARD_DEGREE * (length - 1))
          + Math.log2(uppercaseVariations(token)),
      });
    }
  }
  return matches;
}

// "aaaa", "abcabcabc", "lol123lol123"...
function repeatMatches(pwd, options) {
  const matches = [];
  const greedy = /(.+)\1+/g;
  const lazy = /(.+?)\1+/g;
  const lazyAnchored = /^(.+?)\1+$/;

  let lastIndex = 0;
  while (lastIndex < pwd.length) {
    greedy.lastIndex = lazy.lastIndex = lastIndex;
    const g = greedy.exec(pwd);
    const l = lazy.exec(pwd);
    if (!g) break;

    // The greedy match catches "abcabc" inside "abcabcabc"-like strings, the
    // lazy one catches "aaaa"; keep whichever covers more.
    const [match, base] = g[0].length > l[0].length
      ? [g, lazyAnchored.exec(g[0])[1]]
      : [l, l[1]];
    const count = match[0].length / base.length;
    matches.push({
      type: 'repeat', i: match.index, j: match.index + match[0].length,
      token: match[0], base, count,
      bits: analyze(base, options).bits + Math.log2(count),
    });
    lastIndex = match.index + match[0].length;
  }
  return matches;
}

function dateMatches(pwd) {
  const matches = [];
  const separated = /^(\d{1,4})([\s/\\_.-])(\d{1,2})\2(\d{1,4})$/;

  for (let i = 0; i < pwd.length; i++) {
    for (let j = i + 4; j <= Math.min(pwd.length, i + 10); j++) {
      const token = pwd.slice(i, j);

      if (/^(19|20)\d\d$/.test(token)) {
        matches.push({ type: 'year', i, j, token, bits: Math.log2(yearSpace(+token)) });
      }

      let candidates = [];
      let hasSeparator = false;
      const sep = separated.exec(token);
      if (sep) {
        const [, a, , b, c] = sep;
        hasSeparator = true;
        candidates = [[a, b, c], [b, a, c], [c, b, a]]; // d/m/y, m/d/y, y/m/d
      } else if (/^\d+$/.test(token)) {
        const s = (from, to) => token.slice(from, to);
        if (token.length === 4) candidates = [[s(0, 2), s(2, 4), null], [s(2, 4), s(0, 2), null]];
        if (token.length === 6) candidates = [[s(0, 2), s(2, 4), s(4)], [s(2, 4), s(0, 2), s(4)], [s(4), s(2, 4), s(0, 2)]];
        if (token.length === 8) candidates = [[s(0, 2), s(2, 4), s(4)], [s(2, 4), s(0, 2), s(4)], [s(6), s(4, 6), s(0, 4)]];
      }

      for (const [day, month, year] of candidates) {
        const fullYear = year === null ? null : toFullYear(year);
        if (!isValidDate(+day, +month, fullYear, year)) continue;
        const guesses = 365 * (fullYear === null ? 1 : yearSpace(fullYear)) * (hasSeparator ? 4 : 1);
        matches.push({ type: 'date', i, j, token, bits: Math.log2(guesses) });
        break;
      }
    }
  }
  return matches;
}

function toFullYear(year) {
  if (year.length === 4) return +year;
  if (year.length === 2) return +year < 50 ? 2000 + +year : 1900 + +year;
  return NaN;
}

function isValidDate(day, month, fullYear, rawYear) {
  if (!(day >= 1 && day <= 31 && month >= 1 && month <= 12)) return false;
  if (fullYear === null) return true;
  return rawYear.length !== 3 && fullYear >= 1900 && fullYear <= 2099;
}

function yearSpace(year) {
  return Math.max(Math.abs(year - REFERENCE_YEAR), MIN_YEAR_SPACE);
}

// ---------------------------------------------------------------------------
// Finding the cheapest cover of the password
// ---------------------------------------------------------------------------

// Dynamic programming over prefixes, like zxcvbn's most_guessable_match_sequence.
// best[k] maps "number of patterns used" -> cheapest way to cover pwd[0..k).
// Total guesses for l patterns = l! * product(guesses) + 10000^(l-1).
function cheapestSequence(pwd, matches) {
  const n = pwd.length;
  if (n === 0) return { bits: 0, sequence: [] };

  const endingAt = Array.from({ length: n + 1 }, () => []);
  for (const m of matches) endingAt[m.j].push(m);

  const best = Array.from({ length: n + 1 }, () => new Map());
  const pool = poolCounter(pwd);

  const consider = (match, l) => {
    const previous = l > 1 ? best[match.i].get(l - 1).product : 0;
    const cost = match.type === 'bruteforce' ? match.bits : Math.max(match.bits, LOG2_MIN_PATTERN_GUESSES);
    const product = previous + cost;
    const total = log2Add(log2Factorial(l) + product, LOG2_GUESSES_PER_EXTRA_PATTERN * (l - 1));
    for (const [otherL, other] of best[match.j]) {
      if (otherL <= l && other.total <= total) return;
    }
    best[match.j].set(l, { product, total, match });
  };

  for (let k = 1; k <= n; k++) {
    for (const match of endingAt[k]) {
      if (match.i === 0) consider(match, 1);
      else for (const l of best[match.i].keys()) consider(match, l + 1);
    }
    for (let i = 0; i < k; i++) {
      const bruteforce = {
        type: 'bruteforce', i, j: k, token: pwd.slice(i, k),
        bits: (k - i) * Math.log2(pool(i, k)),
      };
      if (i === 0) consider(bruteforce, 1);
      else {
        for (const [l, entry] of best[i]) {
          // Two random chunks in a row are just one bigger random chunk.
          if (entry.match.type !== 'bruteforce') consider(bruteforce, l + 1);
        }
      }
    }
  }

  let bestL = null;
  for (const [l, entry] of best[n]) {
    if (bestL === null || entry.total < best[n].get(bestL).total) bestL = l;
  }

  const sequence = [];
  for (let k = n, l = bestL; k > 0; l--) {
    const { match } = best[k].get(l);
    sequence.unshift(match);
    k = match.i;
  }
  return { bits: best[n].get(bestL).total, sequence };
}

// Size of the character set an attacker must try for a random chunk.
function charPool(s) {
  let pool = 0;
  if (/[a-z]/.test(s)) pool += 26;
  if (/[A-Z]/.test(s)) pool += 26;
  if (/\d/.test(s)) pool += 10;
  if (/[ -/:-@[-`{-~]/.test(s)) pool += 33;
  if (/[^\x20-\x7e]/.test(s)) pool += 100;
  return pool || 26;
}

// Fast charPool(pwd.slice(i, k)) using prefix counts per character class.
function poolCounter(pwd) {
  const classes = [
    [/[a-z]/, 26], [/[A-Z]/, 26], [/\d/, 10], [/[ -/:-@[-`{-~]/, 33], [/[^\x20-\x7e]/, 100],
  ];
  const prefix = classes.map(([re]) => {
    const counts = [0];
    for (const ch of pwd) counts.push(counts[counts.length - 1] + (re.test(ch) ? 1 : 0));
    return counts;
  });
  // Iterating "for (const ch of pwd)" walks code points; keep indices aligned
  // with UTF-16 slicing by falling back to charPool on non-BMP strings.
  if (prefix[0].length !== pwd.length + 1) return (i, k) => charPool(pwd.slice(i, k));

  return (i, k) => {
    let pool = 0;
    classes.forEach(([, size], c) => { if (prefix[c][k] - prefix[c][i] > 0) pool += size; });
    return pool || 26;
  };
}

// ---------------------------------------------------------------------------
// Feedback
// ---------------------------------------------------------------------------

// Returns message codes; the UI turns them into text in the current language.
//   warnings:    commonPassword, containsCommonPassword, dictionaryWord, leet,
//                reversed, sequence, keyboard, repeat, date, personal {sources}
//   suggestions: capitalizeFirst, addLength
function buildFeedback(sequence, bits) {
  const warnings = new Map();
  const suggestions = new Map();
  const personalSources = new Set();
  const warn = code => warnings.set(code, { code });

  for (const m of sequence) {
    switch (m.type) {
      case 'dictionary':
        if (m.dictionary === 'personal') {
          m.sources.forEach(source => personalSources.add(source));
        } else if (m.dictionary === 'passwords') {
          warn(sequence.length === 1 ? 'commonPassword' : 'containsCommonPassword');
        } else {
          warn('dictionaryWord');
        }
        if (m.leet) warn('leet');
        if (m.reversed) warn('reversed');
        if (/^[A-Z][^A-Z]+$/.test(m.token)) suggestions.set('capitalizeFirst', { code: 'capitalizeFirst' });
        break;
      case 'sequence':
      case 'keyboard':
      case 'repeat':
        warn(m.type);
        break;
      case 'date':
      case 'year':
        warn('date');
        break;
    }
  }

  const result = [...warnings.values()];
  if (personalSources.size > 0) {
    result.unshift({ code: 'personal', params: { sources: [...personalSources] } });
  }
  if (bits < LEVELS[3].minBits) suggestions.set('addLength', { code: 'addLength' });
  return { warnings: result, suggestions: [...suggestions.values()] };
}

// ---------------------------------------------------------------------------
// Math helpers
// ---------------------------------------------------------------------------

function binomial(n, k) {
  let result = 1;
  for (let i = 1; i <= k; i++) result = (result * (n - k + i)) / i;
  return result;
}

function log2Factorial(n) {
  let sum = 0;
  for (let i = 2; i <= n; i++) sum += Math.log2(i);
  return sum;
}

// log2(2^a + 2^b) without overflowing.
function log2Add(a, b) {
  const [hi, lo] = a > b ? [a, b] : [b, a];
  return hi + Math.log2(1 + 2 ** (lo - hi));
}
