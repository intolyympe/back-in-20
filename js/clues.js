// Every clue the player can note, wherever it hides. Used by the tests, to
// check that ids are unique, texts are plain and deductions can be reached.

import { CALENDAR, MEETING_NOTES, BIRTHDAY_CARD, PHONE, PC, MAIL, BULLE, BANK } from './data/camille.js';
import { DESK_OBJECTS } from './scenes/desk.js';

export const ALL_CLUES = [
  ...Object.values(DESK_OBJECTS).map(object => object.detail),
  ...Object.values(CALENDAR.events).flat().map(event => event.clue),
  ...MEETING_NOTES.lines.map(line => line.clue),
  BIRTHDAY_CARD.clue,
  PHONE.wallpaperClue,
  ...PHONE.photos.map(photo => photo.clue),
  ...PHONE.threads.flatMap(thread => thread.messages.map(message => message.clue)),
  ...PHONE.notes.map(note => note.clue),
  ...PC.notes.map(note => note.clue),
  ...MAIL.emails.map(email => email.clue),
  ...BULLE.posts.map(post => post.clue),
  ...BULLE.chat.messages.map(message => message.clue),
  BANK.clue,
].filter(Boolean);
