// Everything written on Camille's things, in one place so the clues stay
// consistent from chapter to chapter. All fictional.
//
// Clues planted here, and how the player gets them:
//   - birthday 14/11 -> chapter 1, phone PIN 1411. The game is in July: the
//     player flips the calendar to November and finds a cake drawn on the
//     14th, with no name (people write other people's names, not their own:
//     "Anniv Léa" is written in March). The drawer holds last year's
//     birthday card, kept in its envelope: the postmark is smudged, only
//     "NOV. 2025" can be read. Card + cake = 14/11.
//   - the dog's name (Rex): "Véto Rex" on the calendar in July only says Rex
//     is an animal; the puppy on the phone's wallpaper makes him her dog.
//     The year he arrived (2019) is in the phone's photos once it is
//     unlocked; her mum's text "déjà 7 ans" backs it up -> chapter 2
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

// Last year's card: Camille kept it in her drawer.
export const BIRTHDAY_CARD = {
  front: 'Joyeux anniversaire !',
  postmark: { day: '1?', month: 'NOV.', year: '2025' }, // the day is smudged
  message: [
    'Ma Cam, joyeux 29 ans !',
    'Encore une année à supporter',
    'tes blagues (et Rex qui mange',
    'mes chaussures) !',
    'Gros bisous,',
    'Léa',
  ],
};

// Camille's phone. The gallery is newest first; a photo or a conversation
// with a `clue` adds it to the notebook when the player opens it.
//
// The phone is there to get lost in: most of what it holds leads nowhere,
// and some of it looks like a lead on purpose (Moka is Léa's cat, not
// Camille's; the Norway trip is not in any password). Every minute spent on
// it is a minute of the round.
export const PHONE = {
  pin: '1411',
  photos: [
    { id: 'coffee', src: 'assets/photos/coffee.jpg', date: [2026, 7, 6], caption: 'Pause café avec Léa ☕' },
    { id: 'rex-walk', src: 'assets/photos/rex-walk.jpg', date: [2026, 6, 27], caption: 'Balade du soir avec Rex 🌙' },
    { id: 'salad', src: 'assets/photos/salad.jpg', date: [2026, 6, 21], caption: 'Mode healthy activé 🥗' },
    {
      id: 'moka',
      src: 'assets/photos/moka.jpg',
      date: [2026, 5, 30],
      caption: 'Moka en week-end à la maison 😻',
      clue: { id: 'moka-photo', text: 'Photo : « Moka en week-end à la maison », un chat (mai 2026).' },
    },
    { id: 'norway-falls', src: 'assets/photos/norway-falls.jpg', date: [2025, 8, 18], caption: 'Cascade + arc-en-ciel 🌈' },
    { id: 'norway-canoe', src: 'assets/photos/norway-canoe.jpg', date: [2025, 8, 16], caption: 'Canoë au lever du soleil' },
    {
      id: 'fjord',
      src: 'assets/wallpapers/pc-fjord.jpg',
      date: [2025, 8, 14],
      caption: 'Norvège ❤',
      clue: { id: 'norway-2025', text: 'Photos : voyage en Norvège, août 2025.' },
    },
    // Rex is 7 now: the puppy pictures all date from the week he arrived.
    { id: 'rex-floor', src: 'assets/photos/rex-floor.jpg', date: [2019, 3, 28], caption: 'Monsieur attend sa promenade' },
    { id: 'rex-face', src: 'assets/photos/rex-face.jpg', date: [2019, 3, 20], caption: 'Ce regard…' },
    {
      id: 'rex-arrival',
      src: 'assets/photos/rex-arrival.jpg',
      date: [2019, 3, 12],
      caption: 'Bienvenue à la maison, Rex !',
      clue: { id: 'rex-2019', text: 'Photo : « Bienvenue à la maison, Rex ! », 12 mars 2019.' },
    },
  ],
  // Messages app, most recent first. `me: true` is Camille writing, `day`
  // starts a new day in the conversation, `scam` is a link not to touch.
  threads: [
    {
      id: 'lea',
      name: 'Léa',
      time: '13:40',
      messages: [
        { day: 'Lundi' },
        { text: 'Resto le 24, toujours ok ? 🍝' },
        { text: 'Oui ! 20h comme d’hab', me: true },
        { text: 'Et tu ramènes enfin les photos de Norvège 😍' },
        { text: 'Promis 🙈', me: true },
        { day: 'Aujourd’hui' },
        { text: 'Tu pourrais reprendre Moka samedi ? Je pars chez mes parents 🙏' },
        { text: 'Bien sûr ! Rex va être ravi 🙄', me: true },
        { text: 'Ils s’adorent, arrête 😂' },
      ],
      clue: { id: 'moka-lea', text: 'SMS de Léa : « Tu pourrais reprendre Moka samedi ? »' },
    },
    {
      id: 'julie',
      name: 'Julie',
      time: '13:12',
      messages: [
        { day: 'Mardi' },
        { text: 'Plan de table fini !! T’es à côté de Hugo 😏' },
        { text: 'JULIE.', me: true },
        { text: '😇' },
        { day: 'Aujourd’hui' },
        { text: 'J-9 avant le mariage !!! 💍' },
        { text: 'Trop hâte 🥹 J’ai enfin trouvé la robe', me: true },
        { text: 'Samedi 18, 15h à la mairie. Sois pas en retard 😘' },
      ],
    },
    {
      id: 'hugo',
      name: 'Hugo (boulot)',
      time: '11:48',
      messages: [
        { text: 'Hugo, il me manque toujours tes factures du T2 🙏', me: true },
        { text: 'Oui oui, je te les envoie avant vendredi, promis' },
        { text: 'Tu dis ça depuis lundi 🙃', me: true },
      ],
    },
    {
      id: 'scam',
      // Fiction number range reserved by the French regulator (ARCEP).
      name: '+33 6 39 98 42 17',
      time: '10:02',
      messages: [
        { text: 'COLIS : votre livraison est suspendue. Frais de réexpédition de 1,99 € à régler sous 24h :' },
        { text: 'relivraison-colis.cc/k8Qz', scam: true },
      ],
    },
    {
      id: 'maman',
      name: 'Maman',
      time: 'Hier',
      messages: [
        { text: 'Tu passes dimanche avec Rex ?' },
        { text: 'Oui ! Vers midi', me: true },
        { text: 'Déjà 7 ans que tu as ce chien, le temps passe vite…' },
        { text: 'Ne m’en parle pas 😭', me: true },
        { text: 'Et mets de la crème, ils annoncent 33° 🙃' },
      ],
      clue: { id: 'rex-7-years', text: 'SMS de sa mère : « Tu passes dimanche avec Rex ? […] Déjà 7 ans que tu as ce chien ».' },
    },
    {
      id: 'papa',
      name: 'Papa',
      time: 'Dim.',
      messages: [
        { day: '14 novembre 2025' },
        { text: 'Joyeux anniversaire ma grande ! 🎂 Déjà 29 ans…' },
        { text: 'Merci papa ❤', me: true },
        { day: 'Dimanche' },
        { text: 'Tu as vu le match ?' },
        { text: 'Non 😅', me: true },
      ],
    },
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
  {
    id: 'dog-rex',
    from: ['vet-rex', 'dog-wallpaper'],
    text: '→ Rex, c’est son chien (sûrement le chiot du fond d’écran) !',
  },
];
