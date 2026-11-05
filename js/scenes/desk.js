// The desk scene. For each object:
//   verb    handwritten word shown on hover ("Regarder", "Prendre"...)
//   text    what the player thinks when looking at it
//   clue    added to the notebook, if any
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
    clue: { id: 'back-in-20', text: 'Camille revient dans 20 minutes.' },
  },
  calendar: {
    verb: 'Regarder',
    pickUp: true,
    opens: 'calendar',
    text: 'Les jours passés sont barrés. Le 14 est entouré en rouge.',
  },
  window: {
    verb: 'Regarder',
    text: 'Dehors, la ville. Personne dans la rue ne regarde par ici.',
  },
  monitor: {
    verb: 'Regarder',
    text: 'L’ordinateur est verrouillé.',
  },
  plant: {
    verb: 'Regarder',
    text: 'Une sansevieria. Elle survit à tout, même aux oublis d’arrosage.',
  },
  photo: {
    verb: 'Prendre',
    pickUp: true,
    text: 'Une photo de vacances : Camille sur une plage, au coucher du soleil.',
  },
  pens: {
    verb: 'Fouiller',
    text: 'Des stylos, un surligneur, une règle. Rien de caché dedans.',
  },
  notepad: {
    verb: 'Lire',
    pickUp: true,
    text: 'Des notes de réunion griffonnées. Rien d’utile… pour l’instant.',
  },
  mug: {
    verb: 'Regarder',
    text: 'Le café est encore chaud. Elle ne va pas tarder.',
  },
  lamp: {
    toggle: 'lamp-on',
    verbs: ['Allumer', 'Éteindre'],
  },
  phone: {
    verb: 'Prendre',
    pickUp: true,
    opens: 'phone', // no thought: the phone needs the whole height
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
