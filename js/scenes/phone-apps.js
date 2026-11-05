// More apps on Camille's phone: Notes, Plans, Musique, Calendrier, and the
// accounts of the chapters to come (Bulle, Nébula, Coffre), shown locked for
// now. Each app can be looked at; anything that would leave a trace is
// refused with a thought.

import { PHONE, CALENDAR } from '../data/camille.js';
import { el, button } from '../dom.js';

export const MORE_APPS = [
  { id: 'maps', name: 'Plans', glyph: '⌖', color: '#3f8f6b' },
  { id: 'calendar', name: 'Calendrier', glyph: '▦', color: '#d9482b' },
  { id: 'notes', name: 'Notes', glyph: '✎', color: '#e0a830' },
  { id: 'music', name: 'Musique', glyph: '♫', color: '#c2477a' },
  { id: 'bulle', name: 'Bulle', glyph: '◍', color: '#ff7a59' },
  { id: 'bank', name: 'Nébula', glyph: '◈', color: '#3b3f8f' },
  { id: 'vault', name: 'Coffre', glyph: '⚿', color: '#2d2f36' },
];

const THOUGHTS = {
  trace: 'Surtout pas : elle le verrait.',
  search: 'Surtout pas : la recherche resterait dans son historique.',
  play: 'Surtout pas : la musique partirait à fond dans le bureau !',
  bulle: 'Pas le bon mot de passe… La suite au chapitre 4 (bientôt).',
  bulleReset: 'Le lien arriverait dans sa boîte mail… La suite au chapitre 4 (bientôt).',
  bank: 'Sa banque… La suite au chapitre 5 (bientôt).',
  vault: 'Une phrase de passe ET une clé physique… Celui-là va résister.',
};

const DAY = new Intl.DateTimeFormat('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });

/**
 * The screens of those apps, for the phone.
 * @param {object} ui  the phone's helpers
 * @param {(view: string) => void} ui.go
 * @param {(title: string, back: string) => HTMLElement} ui.header
 * @param {(text: string) => () => void} ui.think  a click handler showing a thought
 * @param {() => HTMLElement} ui.thoughtLine  where thoughts are written
 * @param {(event: string, data: object) => void} ui.onEvent
 */
export function moreAppScreens({ go, header, think, thoughtLine, onEvent }) {
  let openNote = null;

  function notes() {
    const list = el('div', 'settings-list');
    for (const note of PHONE.notes) {
      const row = button('settings-row note-row', '', () => {
        openNote = note;
        go('note');
        onEvent('note-viewed', { note });
      });
      row.append(el('span', '', note.title), el('span', 'settings-value', note.date));
      list.append(row);
    }
    return [header('Notes', 'home'), list, thoughtLine()];
  }

  function note() {
    const page = el('div', 'phone-note');
    page.append(el('h3', '', openNote.title), el('p', 'phone-note-date', openNote.date));
    for (const line of openNote.lines) page.append(el('p', '', line));
    return [header('Notes', 'notes'), page, thoughtLine(), button('reply-field', 'Modifier la note…', think(THOUGHTS.trace))];
  }

  function maps() {
    const map = el('div', 'map');
    map.append(el('div', 'map-river'));
    for (const place of PHONE.places) {
      const pin = el('span', 'map-pin', place.icon);
      pin.style.left = `${place.x}%`;
      pin.style.top = `${place.y}%`;
      pin.title = place.name;
      map.append(pin);
    }
    const list = el('div', 'settings-list places');
    for (const place of PHONE.places) {
      const row = el('div', 'settings-row');
      const text = el('span', 'place-text');
      text.append(el('strong', '', `${place.icon}  ${place.name}`), el('span', 'settings-value', place.detail));
      row.append(text);
      list.append(row);
    }
    return [
      header('Plans', 'home'),
      button('reply-field map-search', 'Rechercher un lieu', think(THOUGHTS.search)),
      map,
      el('p', 'places-title', 'Lieux enregistrés'),
      list,
      thoughtLine(),
    ];
  }

  function music() {
    const { playing, playlists } = PHONE.music;
    const card = el('div', 'now-playing');
    const cover = el('span', 'now-cover', '♫');
    const text = el('span', 'now-text');
    text.append(el('strong', '', playing.title), el('span', '', playing.artist));
    const play = button('now-play', '▶', think(THOUGHTS.play));
    play.setAttribute('aria-label', 'Lecture');
    card.append(cover, text, play);

    const list = el('div', 'settings-list');
    for (const playlist of playlists) {
      const row = button('settings-row', '', think(THOUGHTS.play));
      row.append(el('span', '', playlist.name), el('span', 'settings-value', `${playlist.count} titres`));
      list.append(row);
    }
    return [header('Musique', 'home'), card, el('p', 'places-title', 'Playlists'), list, thoughtLine()];
  }

  function calendar() {
    // Her agenda is the wall calendar, synced: what is coming up.
    const list = el('div', 'settings-list agenda');
    const { year, month, today, events } = CALENDAR;
    for (let m = month; m <= month + 1; m++) {
      for (const event of events[m] ?? []) {
        if (!event.text || (m === month && event.day < today)) continue;
        const row = el('div', 'settings-row');
        row.append(el('span', '', event.text), el('span', 'settings-value', DAY.format(new Date(year, m - 1, event.day))));
        list.append(row);
      }
    }
    return [header('Calendrier', 'home'), list, thoughtLine(), button('reply-field', '+ Nouvel évènement', think(THOUGHTS.trace))];
  }

  // The accounts of the next chapters: a login, not open yet.
  function login({ title, logo, color, account, fieldLabel, link, onTry, onLink }) {
    const form = el('form', 'app-login');
    const mark = el('span', 'app-login-logo', logo);
    mark.style.background = color;
    const input = el('input', 'app-login-field');
    input.type = 'password';
    input.placeholder = fieldLabel;
    input.autocomplete = 'off';
    input.setAttribute('aria-label', fieldLabel);
    const go = el('button', 'app-login-go', 'Se connecter');
    go.type = 'submit';
    form.append(mark, el('p', 'app-login-title', title), el('p', 'app-login-account', account), input, go);
    if (link) form.append(button('app-login-link', link, onLink));
    form.addEventListener('submit', event => {
      event.preventDefault();
      onTry();
    });
    return form;
  }

  function bulle() {
    return [
      header('', 'home'),
      login({
        title: 'Bulle', logo: '◍', color: '#ff7a59', account: 'Compte : @cam.et.rex',
        fieldLabel: 'Mot de passe', link: 'Mot de passe oublié ?',
        onTry: think(THOUGHTS.bulle), onLink: think(THOUGHTS.bulleReset),
      }),
      thoughtLine(),
    ];
  }

  function bank() {
    return [
      header('', 'home'),
      login({
        title: 'Banque Nébula', logo: '◈', color: '#3b3f8f', account: 'Identifiant client : •••• 4821',
        fieldLabel: 'Code secret', onTry: think(THOUGHTS.bank),
      }),
      thoughtLine(),
    ];
  }

  function vault() {
    return [
      header('', 'home'),
      login({
        title: 'Coffre', logo: '⚿', color: '#2d2f36', account: 'Clé de sécurité : non détectée',
        fieldLabel: 'Phrase de passe', onTry: think(THOUGHTS.vault),
      }),
      thoughtLine(),
    ];
  }

  return { notes, note, maps, music, calendar, bulle, bank, vault };
}
