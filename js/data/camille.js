// Everything written on Camille's things, in one place so the clues stay
// consistent from chapter to chapter. All fictional.
//
// Clues planted here:
//   - birthday circled on the calendar (14/11)  -> chapter 1, phone PIN
//   - the dog's name on the calendar (Rex)        -> chapter 2, laptop password
//   - "le même qu'avant" in the meeting notes     -> chapter 3, reused password

// The round starts when Camille leaves her desk: Thursday 12 November 2026,
// 14:05 (local time). She is back 20 minutes later.
export const STORY_START = new Date(2026, 10, 12, 14, 5);

export const CALENDAR = {
  year: 2026,
  month: 11, // 1-12
  today: 12, // days before are crossed out
  events: [
    { day: 3, text: 'Dentiste 9h' },
    { day: 6, text: 'Véto Rex (vaccin)' },
    { day: 10, text: 'Réunion budget' },
    { day: 14, text: 'MON ANNIV !', circled: true },
    { day: 19, text: 'Resto Léa 20h' },
    { day: 25, text: 'Loyer' },
    { day: 28, text: 'Week-end Lyon' },
  ],
};

export const MEETING_NOTES = {
  title: 'Réunion budget — 10/11',
  lines: [
    { text: '– Budget T4 validé (enfin)' },
    { text: '– Relancer Hugo pour les factures' },
    { text: '– Slides à envoyer avant vendredi !', highlight: true },
    { text: '– Changer le mdp de la messagerie' },
    { text: '   (le service info insiste…)' },
    { text: '   → remettre le même qu’avant ?' },
  ],
};
