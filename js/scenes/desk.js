// The desk scene: what each object says when the player inspects it, the
// clue it adds to the notebook, the view it opens or the state it toggles.
// Chapter content (the circled date, the phone lock screen...) comes later.

export const DESK_OBJECTS = {
  postit: {
    text: '« De retour dans 20 minutes. — C. » Camille vient de partir.',
    clue: { id: 'back-in-20', text: 'Camille revient dans 20 minutes.' },
  },
  calendar: {
    text: 'Le calendrier de Camille, ouvert sur novembre.',
  },
  window: {
    text: 'Dehors, la ville. Personne dans la rue ne regarde par ici.',
  },
  monitor: {
    text: 'L’ordinateur est verrouillé.',
  },
  plant: {
    text: 'Une sansevieria. Elle survit à tout, même aux oublis d’arrosage.',
  },
  photo: {
    text: 'Une photo de vacances : Camille sur une plage, au coucher du soleil.',
  },
  pens: {
    text: 'Des stylos, un surligneur, une règle. Rien de caché dedans.',
  },
  notepad: {
    text: 'Des notes de réunion griffonnées. Rien d’utile… pour l’instant.',
  },
  mug: {
    text: 'Le café est encore chaud. Elle ne va pas tarder.',
  },
  lamp: {
    toggle: 'lamp-on', // class switched on the desk, no description
  },
  phone: {
    text: 'Le téléphone de Camille. Elle l’a oublié sur le bureau.',
    opens: 'phone',
  },
};

/**
 * Wires every [data-hotspot] button in `root` to onInspect(id, object, button).
 */
export function setupDesk(root, onInspect) {
  for (const button of root.querySelectorAll('[data-hotspot]')) {
    const id = button.dataset.hotspot;
    button.addEventListener('click', () => onInspect(id, DESK_OBJECTS[id], button));
  }
}
