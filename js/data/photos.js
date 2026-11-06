// What a photo shows. Each view in front of the player says what it is
// (`data-subject`): an account open (an access to prove), one of Camille's
// security mistakes (a flaw to document), or anything else (a useless photo,
// which the report counts too).

import { PROOFS } from './mission.js';

export const FLAWS = [
  { id: 'unattended', subjects: ['postit'], text: 'un post-it annonce son absence : poste laissé sans surveillance.' },
  { id: 'birthday', subjects: ['calendar-11', 'drawer'], text: 'sa date d’anniversaire se devine (un gâteau sur le calendrier, une vieille carte).' },
  { id: 'reuse', subjects: ['notepad'], text: 'ses notes : la règle des mots de passe, et « ne JAMAIS réutiliser… (oups) ».' },
  { id: 'hint', subjects: ['pc-hint'], text: 'l’indice de son mot de passe s’affiche : « mon bébé ».' },
  { id: 'plain-codes', subjects: ['pc-note-codes'], text: 'ses mots de passe notés en clair, dans « Codes ».' },
  { id: 'no-2fa', subjects: ['bulle-settings'], text: 'pas de double authentification sur Bulle.' },
  { id: 'public-answer', subjects: ['bulle-post-birthday'], text: 'sa ville natale publiée : la réponse à sa question secrète.' },
  { id: 'bank-sms', subjects: ['bank-security'], text: 'sa banque : une question secrète publique et un code par SMS.' },
];

// Useless photos, by subject (or its start), for a joke in the report.
const USELESS = [
  ['plant', 'la plante'], ['mug', 'la tasse'], ['window', 'la fenêtre'], ['pens', 'le pot à crayons'],
  ['photo', 'sa photo de vacances'], ['lamp', 'la lampe'], ['calendar', 'une page du calendrier'],
  ['phone-locked', 'un téléphone verrouillé'], ['pc-locked', 'un écran de connexion'],
  ['mail-locked', 'une page de connexion'], ['bulle-locked', 'une page de connexion'],
  ['bank-locked', 'une page de connexion'], ['vault', 'le Coffre, fermé'],
  ['pc-note', 'une note sans intérêt'], ['bulle-post', 'une publication sans intérêt'],
];

/**
 * @param {string} subject  the `data-subject` of the view photographed
 * @returns {{kind: 'access'|'flaw'|'useless', id: string, text: string}}
 */
export function classify(subject) {
  if (PROOFS[subject]) return { kind: 'access', id: subject, text: PROOFS[subject].label };
  const flaw = FLAWS.find(f => f.subjects.includes(subject));
  if (flaw) return { kind: 'flaw', id: flaw.id, text: flaw.text };
  const useless = USELESS.find(([start]) => subject === start || subject.startsWith(`${start}-`));
  return { kind: 'useless', id: subject, text: useless ? useless[1] : 'rien de bien utile' };
}
