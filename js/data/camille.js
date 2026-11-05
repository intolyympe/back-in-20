// Everything written on Camille's things, in one place so the clues stay
// consistent from chapter to chapter. All fictional.
//
// Clues planted here, and how the player gets them:
//   - birthday 14/11 -> chapter 1, phone PIN 1411. The game is in July: the
//     player flips the calendar to November and finds a cake drawn on the
//     14th, with no name (people write other people's names, not their own:
//     "Anniv Léa" is written in March). The birthday card in the drawer
//     confirms it.
//   - the dog's name (Rex), on the calendar in July -> chapter 2
//   - "ne JAMAIS réutiliser ses mdp (oups…)" in the notes -> chapter 3

// The round starts when Camille leaves her desk: Thursday 9 July 2026, 14:05
// (local time). She is back 20 minutes later.
export const STORY_START = new Date(2026, 6, 9, 14, 5);

export const CALENDAR = {
  year: 2026,
  month: 7,  // page showing on the wall, 1-12
  today: 9,  // days before are crossed out
  // Month (1-12) -> what is written on its page. `doodle` is drawn instead of
  // words; `circled` gets a red ring.
  events: {
    3: [{ day: 21, text: 'Anniv Léa' }],
    6: [{ day: 12, text: 'Contrôle technique' }, { day: 26, text: 'Loyer' }],
    7: [
      { day: 3, text: 'Véto Rex (vaccin)' },
      { day: 7, text: 'Réunion budget' },
      { day: 16, text: 'Dentiste 9h' },
      { day: 18, text: 'Mariage Julie', circled: true },
      { day: 24, text: 'Resto Léa 20h' },
      { day: 26, text: 'Loyer' },
      { day: 31, text: 'Départ vacances !' },
    ],
    8: [{ day: 1, text: 'Bretagne' }, { day: 15, text: 'Retour' }, { day: 26, text: 'Loyer' }],
    9: [{ day: 7, text: 'Formation Excel' }, { day: 26, text: 'Loyer' }],
    11: [{ day: 14, doodle: 'cake' }],
    12: [{ day: 24, text: 'Noël chez maman' }],
  },
};

export const MEETING_NOTES = {
  title: 'Réunion budget — 07/07',
  lines: [
    { text: '– Budget T3 validé (enfin)' },
    { text: '– Relancer Hugo pour les factures' },
    { text: '– Slides à envoyer avant vendredi !', highlight: true },
    { text: '– Formation cybersécu obligatoire :' },
    { text: '   « ne JAMAIS réutiliser ses mdp »' },
    { text: '                       (oups…)' },
  ],
};

export const BIRTHDAY_CARD = {
  front: 'Joyeux anniversaire !',
  message: [
    'Ma Cam,',
    'Encore une année à supporter',
    'tes blagues (et Rex qui mange',
    'mes chaussures) !',
    'Gros bisous,',
    'Léa',
  ],
};

// When the player has found every clue in `from`, the notebook writes the
// conclusion.
export const DEDUCTIONS = [
  {
    id: 'birthday',
    from: ['cake-1411', 'birthday-card'],
    text: '→ Son anniv, c’est le 14 novembre !',
  },
];
