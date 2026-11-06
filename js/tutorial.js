// The tutorial, before the clock starts: the post-it on her screen teaches
// the four gestures of the game, one after the other. Each step waits for
// the player to do it: open, note, photograph, put down.

export const STEPS = [
  { waitFor: 'open', text: 'Commence par le post-it collé sur son écran : clique dessus.' },
  { waitFor: 'note', text: 'Survole ses mots : « Noter » apparaît. Clique pour les écrire dans ton carnet.' },
  {
    waitFor: 'photo',
    text: 'Ce post-it prouve qu’elle a laissé son poste sans surveillance : c’est une faille. Photographie-le (bouton Photographier, ou touche P).',
  },
  { waitFor: 'close', text: 'Repose-le : touche Espace.' },
];

export const READY_TEXT = 'Le chrono démarre. Fouille, note, déduis… et ne te fais pas prendre !';

/** The step after `index` once `event` happened (the same if it is not the awaited one). */
export function nextStep(index, event) {
  return STEPS[index]?.waitFor === event ? index + 1 : index;
}

/** During the tutorial, only the post-it can be opened. */
export const TUTORIAL_OBJECT = 'postit';
