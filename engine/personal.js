// Turns what an attacker could find out about someone (social media, data
// leaks, public records...) into a dictionary of guesses. A targeted attack
// tries these before anything else, so each one costs only a few guesses.
//
// Nothing here is stored or sent anywhere: the dictionary lives in memory for
// as long as the tab is open.

import { toRankedMap } from './wordlists.js';

// Labels are translated in the UI; "sources" reported by the analyzer are
// these ids (plus "initials").
export const PERSONAL_FIELDS = [
  { id: 'firstName', kind: 'text',  placeholder: 'Camille' },
  { id: 'lastName',  kind: 'text',  placeholder: 'Martin' },
  { id: 'birthDate', kind: 'date' },
  { id: 'city',      kind: 'text',  placeholder: 'Lyon' },
  { id: 'closeOnes', kind: 'list',  placeholder: 'Léa, Hugo, Rex' },
  { id: 'username',  kind: 'email', placeholder: 'cam.martin69@mail.fr' },
  { id: 'favorites', kind: 'list',  placeholder: 'OL, Nirvana' },
  { id: 'other',     kind: 'list',  placeholder: '2015, 06 12 34 56 78' },
];

const MIN_TOKEN_LENGTH = 3;

/**
 * @param {Record<string, string>} values field id -> what the user typed
 * @returns dictionary usable by analyze(), or null when nothing was filled in
 */
export function buildPersonalDictionary(values) {
  const sources = new Map(); // token -> field id (first one wins)
  const add = (token, source) => { if (!sources.has(token)) sources.set(token, source); };
  const filled = PERSONAL_FIELDS
    .map(field => ({ field, value: (values[field.id] || '').trim() }))
    .filter(({ value }) => value);

  // 1. Whole values, tried first.
  const wordsByField = filled.map(({ field, value }) => {
    const tokens = tokensFor(field.kind, value).filter(t => t.length >= MIN_TOKEN_LENGTH);
    tokens.forEach(t => add(t, field.id));
    return { field, value, tokens };
  });

  // 2. Initials: "Jean-Pierre Martin" -> jpm, jm, mj...
  const nameWords = filled
    .filter(({ field }) => field.id === 'firstName' || field.id === 'lastName')
    .flatMap(({ value }) => stripAccents(value.toLowerCase()).split(/[^a-z]+/).filter(Boolean));
  if (nameWords.length >= 2) {
    const initials = nameWords.map(w => w[0]);
    const firstLast = initials[0] + initials[initials.length - 1];
    for (const token of [initials.join(''), firstLast, [...firstLast].reverse().join('')]) {
      add(token, 'initials');
    }
  }

  // 3. Fragments of names and words: "camille" -> amille, mille, camil, cam...
  for (const { field, tokens } of wordsByField) {
    if (field.kind === 'date') continue;
    for (const word of tokens) {
      if (!/^\p{L}{4,}$/u.test(word)) continue;
      for (let cut = 1; word.length - cut >= MIN_TOKEN_LENGTH; cut++) {
        add(word.slice(cut), field.id);        // drop the start
        add(word.slice(0, -cut), field.id);    // drop the end
      }
    }
  }
  if (sources.size === 0) return null;

  const ranked = toRankedMap(sources.keys());
  const lengths = [...ranked.keys()].map(t => t.length);
  return {
    ranked,
    sources,
    minLength: Math.min(...lengths),
    maxLength: Math.max(...lengths),
    // An attacker with this list tries every entry almost immediately.
    guessesForRank: rank => rank,
  };
}

function tokensFor(kind, value) {
  switch (kind) {
    case 'date':  return dateTokens(value);
    case 'email': return wordTokens(value.split('@')[0]);
    case 'list':  return value.split(/[,;\n]/).flatMap(wordTokens);
    default:      return wordTokens(value);
  }
}

// "Jean-Pierre" -> jean-pierre, jean, pierre, jeanpierre
// "Hélène"      -> hélène, helene
// "cam.martin69" -> cam, martin69, cammartin69, martin, 69 (too short, dropped)
function wordTokens(text) {
  const lower = text.toLowerCase().trim();
  const tokens = new Set();
  for (const variant of new Set([lower, stripAccents(lower)])) {
    tokens.add(variant.replace(/\s+/g, ''));
    const parts = variant.split(/[^\p{L}\p{N}]+/u).filter(Boolean);
    for (const part of parts) {
      tokens.add(part);
      for (const piece of part.match(/\p{L}+|\p{N}+/gu) || []) tokens.add(piece);
    }
    if (parts.length > 1) tokens.add(parts.join(''));
  }
  return [...tokens];
}

// "1990-05-12" -> 1990, 1205, 0512, 12051990, 120590, 19900512, 12/05/1990...
function dateTokens(iso) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return wordTokens(iso);
  const [, y, m, d] = match;
  const yy = y.slice(2);
  const [dn, mn] = [String(+d), String(+m)]; // without leading zeros
  const tokens = [
    y, d + m, m + d,
    d + m + y, d + m + yy, m + d + y, m + d + yy, y + m + d, yy + m + d,
    dn + mn + y, dn + mn + yy,
  ];
  for (const sep of ['/', '-', '.', ' ']) tokens.push([d, m, y].join(sep), [d, m, yy].join(sep));
  return tokens;
}

function stripAccents(text) {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '');
}
