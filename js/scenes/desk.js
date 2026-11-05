// The desk scene. For each object:
//   verb    handwritten word shown on hover ("Regarder", "Prendre"...)
//   text    what the player thinks when looking at it
//   clues   what gets written in the notebook when the object is looked at
//   pickUp  the object leaves the desk while seen up close
//   opens   a dedicated view instead of the zoomed copy (phone, calendar...)
//   toggle  a class switched on the desk (the lamp), with [off, on] verbs
// What is written on Camille's things lives in js/data/camille.js.

import { fillDeskCalendar } from './calendar.js';

export const DESK_OBJECTS = {
  postit: {
    verb: 'Lire',
    pickUp: true,
    text: '« De retour dans 20 minutes. — C. » Camille vient de partir.',
    clues: [{ id: 'back-in-20', text: 'Camille revient dans 20 min.' }],
  },
  calendar: {
    verb: 'Regarder',
    pickUp: true,
    opens: 'calendar',
    text: 'Juillet. On peut tourner les pages…',
    clues: [{ id: 'vet-rex', text: 'Calendrier, 3 juillet : « Véto Rex ». Rex… un animal ?' }],
  },
  window: {
    verb: 'Regarder',
    text: 'Dehors, la ville. Personne dans la rue ne regarde par ici.',
  },
  monitor: {
    verb: 'Regarder',
    text: 'L’ordinateur est verrouillé.',
    clues: [{ id: 'pc-locked', text: 'PC : session « Camille », mot de passe demandé.' }],
  },
  plant: {
    verb: 'Regarder',
    text: 'Une sansevieria. Elle survit à tout, même aux oublis d’arrosage.',
  },
  photo: {
    verb: 'Prendre',
    pickUp: true,
    text: 'Une photo de vacances : une plage au coucher du soleil, quelqu’un fait coucou. Sûrement Camille.',
    clues: [{ id: 'beach', text: 'Photo de vacances à la plage.' }],
  },
  pens: {
    verb: 'Fouiller',
    text: 'Des stylos, un surligneur, une règle. Rien de caché dedans.',
  },
  notepad: {
    verb: 'Lire',
    pickUp: true,
    opens: 'notepad',
    text: 'Ses notes de la réunion de mardi.',
    clues: [
      { id: 'reuses-passwords', text: 'Notes : « ne JAMAIS réutiliser ses mdp »… (oups ?)' },
      { id: 'pc-policy', text: 'Notes : mdp du PC = 8 caractères, 1 majuscule, 1 chiffre, 1 caractère spécial.' },
    ],
  },
  mug: {
    verb: 'Regarder',
    text: 'Le café est encore chaud. Elle ne va pas tarder.',
  },
  drawer: {
    verb: 'Ouvrir',
    opens: 'drawer',
    text: 'Le bazar habituel… et une carte d’anniversaire, encore dans son enveloppe.',
    clues: [{ id: 'birthday-card', text: 'Carte de Léa à « Ma Cam » : joyeux 29 ans. Cachet : « 1? NOV. 2025 ».' }],
  },
  lamp: {
    toggle: 'lamp-on',
    verbs: ['Allumer', 'Éteindre'],
  },
  phone: {
    verb: 'Prendre',
    pickUp: true,
    opens: 'phone', // no thought: the phone needs the whole height
    clues: [{ id: 'dog-wallpaper', text: 'Fond d’écran du téléphone : un chiot noir.' }],
  },
};

/** The hover verb for an object, given whether its toggle is on. */
export function verbFor(object, on = false) {
  return object.verbs ? object.verbs[on ? 1 : 0] : object.verb;
}

/**
 * Wires every [data-hotspot] button in `root` to onInspect(id, object, button)
 * and gives it its hover verb.
 */
export function setupDesk(root, onInspect) {
  fillDeskCalendar(root.querySelector('[data-hotspot=calendar]'));
  for (const button of root.querySelectorAll('[data-hotspot]')) {
    const id = button.dataset.hotspot;
    const object = DESK_OBJECTS[id];
    button.dataset.verb = verbFor(object);
    button.addEventListener('click', () => onInspect(id, object, button));
  }
}
