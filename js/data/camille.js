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
//   - PC password Rex2019! -> chapter 2: Rex + the year he arrived, and the
//     company rule written in her notes (8 characters, a capital, a digit,
//     a special character) explains the "!". Rex2019! is exactly 8.
//   - "ne JAMAIS réutiliser ses mdp (oups…)" in the notes, and her Notes app
//     on the PC: "Mail perso : même mdp que le PC" -> chapter 3, her mailbox
//     opens with Rex2019! too
//   - in her mailbox, an e-mail from Bulle (social network) sent to the
//     address tied to her account: "mot de passe oublié ?" -> chapter 4, the
//     reset link lands in the mailbox the player already holds
//   - on her private Bulle account: a post from her 29th birthday, "dans la
//     ville où tout a commencé", tagged Annecy, and a chat with Léa: her bank
//     falls back on a secret question, "la ville où je suis née" -> chapter 5,
//     the answer is Annecy, then the bank texts a code to the phone the
//     player is holding
//   - in her bank operations: a USB security key and a Coffre subscription
//     -> the final boss resists (passphrase + physical key)

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
    { text: '   mdp PC : 8 car., 1 MAJ, 1 chiffre, 1 !?#' },
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
  // Notes app on the phone (the PC has its own), newest first.
  notes: [
    {
      id: 'cadeaux',
      title: 'Cadeaux 🎁',
      date: '05/07/2026',
      lines: ['Julie : cagnotte + un petit mot', 'Papa : le livre sur le Tour de France', 'Léa (21/03) : raté cette année… l’an prochain !'],
    },
    {
      id: 'sac-bretagne',
      title: 'Sac Bretagne',
      date: '03/07/2026',
      lines: ['Maillot, crème, lunettes', 'Laisse + gamelle + croquettes Rex', 'Chargeur !!'],
    },
    {
      id: 'velo',
      title: 'Vélo',
      date: '14/04/2026',
      lines: ['Cadenas : 2103 (l’anniv de Léa, facile à retenir)', 'Révision avant l’été'],
      // Her habit: dates of people she loves as codes.
      clue: { id: 'bike-lock', text: 'Note du téléphone : cadenas du vélo = 2103, l’anniversaire de Léa.' },
    },
    {
      id: 'a-voir',
      title: 'À regarder',
      date: '02/02/2026',
      lines: ['Le docu sur les fjords', 'La série que Hugo conseille (?)', 'Un film qui ne fait PAS pleurer'],
    },
  ],
  // Plans app: saved places, placed on a drawn map (x, y in %).
  places: [
    { id: 'home', name: 'Domicile', detail: 'Croix-Rousse, Lyon', x: 36, y: 26 },
    { id: 'park', name: 'Parc (balades de Rex)', detail: 'Presque tous les soirs', x: 66, y: 16 },
    { id: 'work', name: 'Bureau', detail: 'Part-Dieu, Lyon', x: 64, y: 54 },
    { id: 'vet', name: 'Clinique vétérinaire', detail: 'Dernière visite : 3 juillet', x: 26, y: 62 },
    { id: 'mum', name: 'Chez Maman', detail: 'Villeurbanne · le dimanche', x: 86, y: 40 },
  ],
  // Musique app.
  music: {
    playing: { title: 'Lumière du Nord', artist: 'Les Aurores' },
    playlists: [
      { name: 'Balade avec Rex 🐶', count: 42 },
      { name: 'Road trip Norvège', count: 67 },
      { name: 'Concentration bureau', count: 120 },
      { name: 'Mariage Julie 💃', count: 18 },
    ],
  },
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

// Camille's work computer. The password hint shows after a wrong try, as
// on real systems (one more mistake of hers).
export const PC = {
  password: 'Rex2019!',
  hint: 'mon bébé ❤',
  // Notes app, newest first. Opening a note with a `clue` writes it down.
  notes: [
    {
      id: 'courses',
      title: 'Courses',
      date: '08/07/2026',
      lines: ['Croquettes Rex (grand sac !)', 'Tomates, feta', 'Crème solaire', 'Carte pour Julie'],
    },
    {
      id: 'julie',
      title: 'Mariage Julie 💍',
      date: '01/07/2026',
      lines: ['Samedi 18/07, 15h à la mairie', 'Cagnotte : 50 €', 'Robe ✓  Chaussures ✗', 'Discours : Léa s’en charge 🙏'],
    },
    {
      id: 'bretagne',
      title: 'Vacances Bretagne',
      date: '20/06/2026',
      lines: ['Départ vendredi 31/07', 'Rex vient ! (croquettes + gamelle)', 'Ferry pour Belle-Île à réserver', 'Retour le 15/08'],
    },
    {
      id: 'codes',
      title: 'Codes 🤫',
      date: '12/05/2026',
      lines: ['Digicode immeuble : 4580B', 'Wifi maison : au dos de la box', 'Mail perso : même mdp que le PC (flemme…)', 'Banque : NE PAS NOTER ICI !!'],
      clue: { id: 'mail-same-as-pc', text: 'Note « Codes » sur le PC : « Mail perso : même mdp que le PC ».' },
    },
  ],
  files: ['Budget_T3_final_v2.xlsx', 'Slides_vendredi.pres', 'Factures_Hugo (vide)', 'CV_2024.pdf'],
};

// Camille's mailbox, the same on her phone and her PC. Same password as the
// PC: that is the chapter 3 mistake. Brands are made up (Bulle, Banque
// Nébula, Compagnie des Îles).
export const MAIL = {
  password: PC.password,
  // Inbox, newest first. `scam` is a link not to click, `clue` is written
  // in the notebook when the e-mail is opened.
  emails: [
    {
      id: 'it-reminder',
      from: 'Service informatique',
      subject: 'Rappel : formation cybersécurité',
      time: '09:12',
      body: [
        'Bonjour à tous,',
        'Petit rappel après la formation de mardi :',
        '• un mot de passe différent pour chaque compte ;',
        '• ne notez jamais vos mots de passe ;',
        '• verrouillez votre poste dès que vous le quittez.',
        'Merci à tous, le service informatique',
      ],
    },
    {
      id: 'bulle-likes',
      from: 'Bulle',
      subject: 'Léa et 2 autres personnes ont aimé votre photo',
      time: 'Hier',
      body: [
        'Bonjour Camille,',
        'Léa, Julie et 1 autre personne ont aimé votre photo « Balade du soir avec Rex 🌙 ».',
        'Cet e-mail a été envoyé à l’adresse liée à votre compte Bulle @cam.et.rex.',
        'Mot de passe oublié ? Recevez un lien de réinitialisation à cette adresse.',
      ],
      clue: {
        id: 'bulle-account',
        text: 'Mail de Bulle : son compte @cam.et.rex est lié à cette boîte (« mot de passe oublié » → lien envoyé ici).',
      },
    },
    {
      id: 'julie-wedding',
      from: 'Julie',
      subject: 'Infos mariage 💍',
      time: 'Mar.',
      body: [
        'Coucou les filles !',
        'Rendez-vous samedi 18 à 15h à la mairie, puis vin d’honneur au domaine.',
        'Dress code : couleurs d’été ☀',
        'Bisous, J.',
      ],
    },
    {
      id: 'bulle-scam',
      from: 'Bulle Sécurité',
      subject: 'Votre compte va être suspendu',
      time: 'Lun.',
      body: [
        'Cher utilisateur,',
        'Une activité inhabituelle a été détectée sur votre compte. Confirmez votre identité sous 24 h pour éviter sa suspension :',
      ],
      scam: 'bulle-verification-compte.co/login',
    },
    {
      id: 'ferry',
      from: 'Compagnie des Îles',
      subject: 'Réservation confirmée : Quiberon → Belle-Île',
      time: '2 juil.',
      body: [
        'Bonjour Camille,',
        'Aller : samedi 1er août, 10h15.',
        'Passagers : 1 adulte + 1 chien.',
        'Bonne traversée !',
      ],
    },
    {
      id: 'bank',
      from: 'Banque Nébula',
      subject: 'Votre relevé de juin est disponible',
      time: '1 juil.',
      body: [
        'Bonjour Madame,',
        'Votre relevé de compte de juin est disponible dans votre espace client.',
        'Banque Nébula ne vous demandera jamais vos codes par e-mail.',
      ],
    },
  ],
  // Security e-mails sent during the round (see sendAlert in state.js).
  alerts: {
    phone: {
      from: 'Sécurité du téléphone',
      subject: 'Tentative d’accès à votre téléphone',
      body: [
        '5 codes erronés ont été saisis sur votre téléphone.',
        'La caméra avant a pris cette photo :',
        'Si ce n’était pas vous, changez votre code.',
      ],
    },
    login: {
      from: 'Messagerie',
      subject: 'Connexion bloquée sur votre compte',
      body: [
        'Plusieurs mots de passe erronés ont été saisis sur votre compte.',
        'Par sécurité, la connexion a été bloquée pendant 1 minute.',
        'Si ce n’était pas vous, changez votre mot de passe.',
      ],
    },
    'bulle-reset': {
      from: 'Bulle',
      subject: 'Réinitialisez votre mot de passe',
      body: [
        'Bonjour Camille,',
        'Vous avez demandé à réinitialiser le mot de passe de votre compte @cam.et.rex.',
        'Si ce n’était pas vous, ignorez cet e-mail.',
      ],
      // A button in the e-mail: the mailbox sends this event when pressed.
      action: { label: 'Choisir un nouveau mot de passe', event: 'reset-link' },
    },
    'bank-login': {
      from: 'Banque Nébula',
      subject: 'Nouvelle connexion à votre espace client',
      body: [
        'Bonjour Madame,',
        'Une connexion à votre espace client a eu lieu aujourd’hui, après validation par SMS.',
        'Si ce n’était pas vous, contactez votre conseiller.',
      ],
    },
    'bulle-changed': {
      from: 'Bulle',
      subject: 'Votre mot de passe a été modifié',
      body: [
        'Le mot de passe de votre compte @cam.et.rex vient d’être modifié.',
        'Si ce n’était pas vous, sécurisez votre compte immédiatement.',
      ],
    },
  },
};

// Her account on Bulle, a made-up social network. Private: only her
// followers see her posts, so the player has to get in.
export const BULLE = {
  handle: '@cam.et.rex',
  name: 'Camille',
  bio: 'Lyon · ☕ · 🐶 Rex · 🏔',
  followers: 214,
  // Newest first. `src` is a photo, else the post is text only.
  posts: [
    { id: 'post-walk', src: 'assets/photos/rex-walk.jpg', date: '8 juil.', text: 'Balade du soir avec Rex 🌙', likes: 3 },
    { id: 'post-coffee', src: 'assets/photos/coffee.jpg', date: '6 juil.', text: 'Pause café avec Léa ☕', likes: 12 },
    {
      id: 'post-birthday',
      date: '14 nov. 2025',
      text: '29 ans aujourd’hui, fêtés dans la ville où tout a commencé 💛',
      place: 'Annecy',
      likes: 31,
      clue: { id: 'born-annecy', text: 'Bulle, 14/11/2025 : « 29 ans, fêtés dans la ville où tout a commencé », à Annecy.' },
    },
    { id: 'post-norway', src: 'assets/photos/norway-falls.jpg', date: '20 août 2025', text: 'Norvège, on y retourne quand ? 🌈', likes: 27 },
    { id: 'post-rex', src: 'assets/photos/rex-arrival.jpg', date: '12 mars 2019', text: 'Bienvenue à la maison, Rex ! 🐶', likes: 58 },
  ],
  // Private messages on Bulle.
  chat: {
    name: 'Léa',
    messages: [
      { text: 'Alors, t’as pu payer le ferry ?' },
      { text: 'Oui ! J’avais encore oublié mon code Nébula 🙈', me: true },
      { text: 'Encore ?? 😂' },
      { text: 'Heureusement il y a la question secrète : la ville où je suis née. Trop facile', me: true },
    ],
    clue: { id: 'bank-question', text: 'Bulle, à Léa : code de banque oublié → « la question secrète : la ville où je suis née ».' },
  },
};

// Her bank, Banque Nébula (made up). She forgets her code, so she goes
// through the secret question, whose answer is on her Bulle account, then a
// code texted to her phone.
export const BANK = {
  client: '•••• 4821',
  question: 'Dans quelle ville êtes-vous née ?',
  answer: 'Annecy',
  phone: '06 •• •• •• 17',
  text: code => `Nébula : votre code de validation est ${code}. Ne le communiquez jamais, même à un conseiller.`,
  balance: '1 284,52 €',
  // Newest first, in line with the rest of her life (ferry, rent, café).
  operations: [
    { date: '08/07', label: 'Boulangerie', amount: '−3,40 €' },
    { date: '06/07', label: 'Café du coin', amount: '−7,80 €' },
    { date: '02/07', label: 'Compagnie des Îles · ferry', amount: '−64,00 €' },
    { date: '01/07', label: 'Salaire', amount: '+2 140,00 €' },
    { date: '26/06', label: 'Loyer', amount: '−720,00 €' },
    { date: '15/06', label: 'Clé de sécurité USB', amount: '−29,00 €' },
    { date: '15/06', label: 'Coffre · abonnement annuel', amount: '−24,00 €' },
  ],
  clue: {
    id: 'security-key',
    text: 'Banque, 15/06 : « Clé de sécurité USB » et « Coffre · abonnement ». Son coffre à mots de passe a une clé physique.',
  },
};

// When the player has found every clue in `from`, the notebook writes the
// conclusion. Several entries can share an id: they are different ways to
// reach the same conclusion, and only the first one reached is written.
export const DEDUCTIONS = [
  {
    id: 'birthday',
    from: ['cake-1411', 'birthday-card'],
    text: '→ Son anniv, c’est le 14 novembre !',
  },
  // Rex is her dog: the calendar only says Rex goes to the vet, the phone
  // shows a puppy, and the gallery or her mum's text tie the two together.
  {
    id: 'dog-rex',
    from: ['vet-rex', 'dog-wallpaper'],
    text: '→ Rex, c’est son chien (sûrement le chiot du fond d’écran) !',
  },
  {
    id: 'dog-rex',
    from: ['rex-2019', 'dog-wallpaper'],
    text: '→ Le chiot du fond d’écran, c’est Rex : son chien, depuis mars 2019 !',
  },
  {
    id: 'dog-rex',
    from: ['rex-7-years'],
    text: '→ Rex, c’est son chien. Elle l’a depuis 7 ans.',
  },
];
