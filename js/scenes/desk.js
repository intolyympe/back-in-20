// The desk scene. For each object:
//   verb    handwritten word shown on hover ("Regarder", "Prendre"...)
//   text    what the player thinks when looking at it
//   clue    added to the notebook, if any
//   opens   a dedicated view (the phone) instead of the close-up
//   toggle  a class switched on the desk (the lamp), with [off, on] verbs
// Chapter content (the circled date, the phone lock screen...) comes later.

export const DESK_OBJECTS = {
  postit: {
    verb: 'Lire',
    text: '« De retour dans 20 minutes. — C. » Camille vient de partir.',
    clue: { id: 'back-in-20', text: 'Camille revient dans 20 minutes.' },
  },
  calendar: {
    verb: 'Regarder',
    text: 'Le calendrier de Camille, ouvert sur novembre.',
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
    text: 'Une photo de vacances : Camille sur une plage, au coucher du soleil.',
  },
  pens: {
    verb: 'Fouiller',
    text: 'Des stylos, un surligneur, une règle. Rien de caché dedans.',
  },
  notepad: {
    verb: 'Lire',
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
    text: 'Le téléphone de Camille. Elle l’a oublié sur le bureau.',
    opens: 'phone',
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
  for (const button of root.querySelectorAll('[data-hotspot]')) {
    const id = button.dataset.hotspot;
    const object = DESK_OBJECTS[id];
    button.dataset.verb = verbFor(object);
    button.addEventListener('click', () => onInspect(id, object, button));
  }
}
