// Camille's phone, held in the foreground: lock screen, PIN pad, home screen,
// photos and "Supprimés récemment", plus the other apps. Everything can be
// looked at (and time gets lost doing it); anything that would leave a trace
// Camille could notice is refused with a thought. Fictional OS.
//
// The view only draws and reacts; the game state (attempts, lockout, photos)
// lives in js/state.js, and main.js turns events into notebook entries.

import { PHONE } from '../data/camille.js';
import { createMailbox } from './mailbox.js';
import {
  recordFailedAttempt, lockRemaining, unlock, isUnlocked,
  takeIntruderPhoto, deletePhoto, emptyTrash, leftoverTraces,
} from '../state.js';
import { el, button, hhmm, mss } from '../dom.js';

const DATE_FORMAT = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
const PHOTO_DATE = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
const INTRUDER_SRC = 'assets/photos/intruder.svg';
const PIN_LENGTH = PHONE.pin.length;

// What the player thinks when trying to do something that would show.
const THOUGHTS = {
  trace: 'Surtout pas : elle le verrait.',
  reply: 'Surtout pas : elle verrait le message.',
  photo: 'Surtout pas : la photo resterait dans sa galerie.',
  scam: 'Payer 1,99 € par un lien inconnu ? C’est du hameçonnage.',
};

const HOURLY = [['14h', '☀', 31], ['15h', '☀', 32], ['16h', '☀', 33], ['17h', '⛅', 32], ['18h', '⛅', 30]];
const FORECAST = [
  ['Ven.', '☀', 32], ['Sam.', '⛅', 29], ['Dim.', '☁', 26], ['Lun.', '☀', 30], ['Mar.', '☀', 31],
];

// Settings: each row opens a page. Rows of a `readOnly` page are only
// information; the others would change something.
const SETTINGS = [
  {
    name: 'Wi-Fi',
    value: 'Bureau-Invités',
    rows: [['Wi-Fi', 'Activé'], ['Bureau-Invités', 'Connecté ✓'], ['Bureau-Pro', '🔒'], ['Imprimante-2e', '🔒']],
  },
  {
    name: 'Bluetooth',
    value: 'Activé',
    rows: [['Bluetooth', 'Activé'], ['Écouteurs de Camille', 'Non connecté'], ['Voiture', 'Non connecté']],
  },
  {
    name: 'Notifications',
    value: '',
    rows: [['Messages', 'Autorisées'], ['Mail', 'Autorisées'], ['Photos', 'Désactivées'], ['Météo', 'Autorisées']],
  },
  {
    name: 'Code de verrouillage',
    value: '4 chiffres',
    rows: [
      ['Modifier le code', ''],
      ['Photo de l’intrus après 5 échecs', 'Activé'],
      ['Alerte par e-mail', 'Activé'],
      ['Effacer les données après 10 échecs', 'Désactivé'],
    ],
  },
  {
    name: 'Batterie',
    value: '62 %',
    readOnly: true,
    rows: [['Photos', '31 %'], ['Messages', '22 %'], ['Mail', '18 %'], ['Météo', '4 %']],
  },
  {
    name: 'Général',
    value: '',
    readOnly: true,
    rows: [['Nom', 'Téléphone de Camille'], ['Système', 'PhoneOS 7.2'], ['Stockage', '41 Go sur 64 Go']],
  },
];

const APPS = [
  { id: 'photos', name: 'Photos', glyph: '✿', color: '#f2a65a' },
  { id: 'messages', name: 'Messages', glyph: '…', color: '#4d8a52' },
  { id: 'mail', name: 'Mail', glyph: '✉', color: '#2b5fa8' },
  { id: 'camera', name: 'Caméra', glyph: '◉', color: '#555b66' },
  { id: 'weather', name: 'Météo', glyph: '☀', color: '#e0a830' },
  { id: 'settings', name: 'Réglages', glyph: '⚙', color: '#6b7079' },
];

/**
 * @param {object} options
 * @param {object} options.state       game state
 * @param {() => number} options.now   ms since the round started
 * @param {(ms: number) => Date} options.storyTime  story clock at that time
 * @param {(type: string, data?: object) => void} options.onEvent
 *   'unlock', 'lockout', 'photo-viewed' {photo}, 'thread-viewed' {thread},
 *   'photo-deleted', 'trash-emptied'
 * @param {(type: string, data?: object) => void} options.onMailEvent
 *   events of the Mail app (see mailbox.js)
 */
export function createPhoneView({ state, now, storyTime, onEvent = () => {}, onMailEvent = () => {} }) {
  const handset = el('div', 'handset');
  const screen = el('div', 'handset-screen');
  handset.append(screen);

  let view = isUnlocked(state, 'phone') ? 'home' : 'lock';
  let entered = '';
  let message = '';
  let openPhoto = null;
  let openThread = null;
  let openSetting = null;
  let confirmEmpty = false;

  const go = (next, extra = {}) => {
    view = next;
    if ('openPhoto' in extra) openPhoto = extra.openPhoto;
    if ('openThread' in extra) openThread = extra.openThread;
    if ('openSetting' in extra) openSetting = extra.openSetting;
    message = extra.message ?? '';
    confirmEmpty = false;
    render();
  };

  const photoSrc = photo => (photo.intruder ? INTRUDER_SRC : photo.src);
  const photoDate = photo => (photo.intruder
    ? `Aujourd’hui, ${hhmm(storyTime(photo.takenAt))}`
    : PHOTO_DATE.format(new Date(photo.date[0], photo.date[1] - 1, photo.date[2])));

  // ---- Screens ----

  function statusBar() {
    const bar = el('div', 'phone-status');
    bar.append(el('span', 'phone-status-time', hhmm(storyTime(now()))), el('span', '', '●●● ▮'));
    return bar;
  }

  function header(title, back) {
    const bar = el('div', 'phone-header');
    bar.append(button('phone-back', '‹', () => go(back)), el('span', 'phone-title', title));
    return bar;
  }

  function alertNotification() {
    const note = el('div', 'phone-notification');
    note.append(
      el('strong', '', 'Sécurité'),
      el('span', '', 'Photo de l’intrus enregistrée. Alerte envoyée par e-mail à Camille.'),
    );
    return note;
  }

  function lockScreen() {
    const time = storyTime(now());
    const parts = [el('div', 'lock-time', hhmm(time)), el('div', 'lock-date', DATE_FORMAT.format(time))];
    // The notification goes once the intruder photo is erased.
    if (leftoverTraces(state).intruderPhotos) parts.push(alertNotification());

    const bottom = el('div', 'lock-bottom');
    const wait = lockRemaining(state, 'phone', now());
    if (wait > 0) {
      bottom.append(el('p', 'lock-blocked', `Téléphone bloqué · réessayez dans ${mss(wait)}`));
    } else {
      bottom.append(button('lock-open', 'Déverrouiller', () => go('pin')));
    }
    parts.push(bottom);
    return parts;
  }

  function pinScreen() {
    const dots = el('div', 'pin-dots');
    for (let i = 0; i < PIN_LENGTH; i++) dots.append(el('span', i < entered.length ? 'filled' : ''));

    const pad = el('div', 'pin-pad');
    for (const key of ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫']) {
      if (!key) { pad.append(el('span')); continue; }
      const b = button(key === '⌫' ? 'pin-key erase' : 'pin-key', key, () => press(key));
      if (key === '⌫') b.setAttribute('aria-label', 'Effacer');
      pad.append(b);
    }

    return [
      el('p', 'pin-title', 'Saisissez le code'),
      dots,
      el('p', 'pin-message', message),
      pad,
      button('pin-cancel', 'Annuler', () => { entered = ''; go('lock'); }),
    ];
  }

  function homeScreen() {
    const parts = [statusBar()];
    // Mail notification while an alert e-mail sits in her inbox.
    if (state.inbox.some(email => email.alert)) {
      const mail = el('div', 'phone-notification');
      mail.append(
        el('strong', '', 'Mail · Alerte de sécurité'),
        el('span', '', 'Quelqu’un a tenté de déverrouiller votre téléphone. Photo jointe.'),
      );
      parts.push(mail);
    }
    const grid = el('div', 'app-grid');
    for (const app of APPS) {
      const b = button('app', '', () => go(app.id));
      const icon = el('span', 'app-icon', app.glyph);
      icon.style.background = app.color;
      b.append(icon, el('span', 'app-name', app.name));
      grid.append(b);
    }
    parts.push(grid);
    return parts;
  }

  // ---- Apps that can only be looked at ----

  // A line at the bottom of the screen for the player's thought. It is
  // filled in place so the focus stays on the control that was pressed.
  const notNowLine = () => el('p', 'app-message', '');
  const think = text => () => {
    const line = screen.querySelector('.app-message');
    if (!line) return;
    line.textContent = text;
    line.classList.remove('show');
    void line.offsetWidth; // restart the animation
    line.classList.add('show');
  }

  function messagesScreen() {
    const list = el('div', 'thread-list');
    for (const thread of PHONE.threads) {
      const b = button('thread-row', '', () => {
        go('thread', { openThread: thread });
        onEvent('thread-viewed', { thread });
      });
      const last = thread.messages.filter(m => m.text).at(-1);
      const text = el('span', 'thread-text');
      text.append(el('strong', '', thread.name), el('span', 'thread-last', last.text));
      b.append(el('span', 'thread-avatar', thread.name[0]), text, el('span', 'thread-time', thread.time));
      list.append(b);
    }
    return [header('Messages', 'home'), list, notNowLine()];
  }

  function threadScreen() {
    const thread = openThread;
    const bubbles = el('div', 'bubbles');
    for (const m of thread.messages) {
      if (m.day) bubbles.append(el('p', 'bubble-day', m.day));
      else if (m.scam) bubbles.append(button('bubble link', m.text, think(THOUGHTS.scam)));
      else bubbles.append(el('p', m.me ? 'bubble me' : 'bubble', m.text));
    }
    const reply = button('reply-field', 'Message', think(THOUGHTS.reply));
    return [header(thread.name, 'messages'), bubbles, notNowLine(), reply];
  }

  function mailScreen() {
    return [header('Mail', 'home'), createMailbox({ state, now, storyTime, variant: 'phone', onEvent: onMailEvent })];
  }

  function cameraScreen() {
    // The front camera is on: the player sees themselves.
    const finder = el('div', 'camera-finder');
    const img = el('img');
    img.src = INTRUDER_SRC;
    img.alt = 'Vous, dans l’objectif de la caméra avant';
    finder.append(img);
    const shutter = button('camera-shutter', '', think(THOUGHTS.photo));
    shutter.setAttribute('aria-label', 'Prendre une photo');
    return [header('', 'home'), finder, notNowLine(), shutter];
  }

  function forecastRow(entries) {
    const row = el('div', 'forecast');
    for (const [label, glyph, temp] of entries) {
      const cell = el('div', 'forecast-day');
      cell.append(el('span', '', label), el('span', 'forecast-glyph', glyph), el('span', '', `${temp}°`));
      row.append(cell);
    }
    return row;
  }

  function weatherScreen() {
    return [
      header('', 'home'),
      el('p', 'weather-city', 'Lyon'),
      el('p', 'weather-temp', '31°'),
      el('p', 'weather-sky', 'Ensoleillé · max. 33° min. 19°'),
      forecastRow(HOURLY),
      forecastRow(FORECAST),
      notNowLine(),
      button('weather-add', '+ Ajouter une ville', think(THOUGHTS.trace)),
    ];
  }

  function settingsScreen() {
    const list = el('div', 'settings-list');
    for (const setting of SETTINGS) {
      const b = button('settings-row', '', () => go('setting', { openSetting: setting }));
      b.append(el('span', '', setting.name), el('span', 'settings-value', `${setting.value} ›`));
      list.append(b);
    }
    return [header('Réglages', 'home'), list, notNowLine()];
  }

  function settingScreen() {
    const setting = openSetting;
    const list = el('div', 'settings-list');
    for (const [name, value] of setting.rows) {
      const row = setting.readOnly
        ? el('div', 'settings-row')
        : button('settings-row', '', think(THOUGHTS.trace));
      row.append(el('span', '', name), el('span', 'settings-value', value));
      list.append(row);
    }
    return [header(setting.name, 'settings'), list, notNowLine()];
  }

  function thumbnails(photos) {
    const grid = el('div', 'photo-grid');
    for (const photo of photos) {
      const b = button(`photo-thumb ${photo.intruder ? 'intruder' : ''}`, '', () => {
        go('photo', { openPhoto: photo });
        onEvent('photo-viewed', { photo });
      });
      const img = el('img');
      img.src = photoSrc(photo);
      img.alt = photo.intruder ? 'Photo de l’intrus' : photo.caption;
      b.append(img);
      grid.append(b);
    }
    return grid;
  }

  function photosScreen() {
    const albums = button('album-row', '', () => go('trash'));
    albums.append(el('span', '', 'Supprimés récemment'), el('span', 'album-count', `${state.trash.length} ›`));
    return [header('Photos', 'home'), thumbnails(state.photos), albums];
  }

  function photoScreen() {
    const photo = openPhoto;
    const frame = el('div', 'photo-full');
    const img = el('img');
    img.src = photoSrc(photo);
    img.alt = '';
    frame.append(img);
    if (photo.intruder) frame.append(el('span', 'photo-stamp', `Tentative d’accès · ${hhmm(storyTime(photo.takenAt))}`));

    const info = el('div', 'photo-info');
    info.append(
      el('p', 'photo-caption', photo.intruder ? 'Photo de sécurité' : photo.caption),
      el('p', 'photo-date', photoDate(photo)),
    );
    const remove = button('photo-delete', 'Supprimer', () => {
      deletePhoto(state, photo.id);
      onEvent('photo-deleted', { photo });
      go('photos');
    });
    return [header('', 'photos'), frame, info, remove];
  }

  function trashScreen() {
    // In the trash, photos are only shown, not opened.
    const grid = el('div', 'photo-grid');
    const parts = [
      header('Supprimés récemment', 'photos'),
      el('p', 'trash-note', 'Ces photos seront supprimées définitivement dans 30 jours.'),
      grid,
    ];
    for (const photo of state.trash) {
      const img = el('img', 'trash-thumb');
      img.src = photoSrc(photo);
      img.alt = '';
      grid.append(img);
    }
    if (!state.trash.length) grid.append(el('p', 'trash-empty', 'Aucune photo.'));

    if (confirmEmpty) {
      const ask = el('div', 'trash-confirm');
      ask.append(
        el('p', '', `Supprimer définitivement ${state.trash.length} photo${state.trash.length > 1 ? 's' : ''} ?`),
        button('trash-cancel', 'Annuler', () => { confirmEmpty = false; render(); }),
        button('trash-confirm-yes', 'Supprimer', () => {
          emptyTrash(state);
          onEvent('trash-emptied');
          go('trash');
        }),
      );
      parts.push(ask);
    } else {
      const empty = button('trash-empty-all', 'Tout supprimer', () => { confirmEmpty = true; render(); });
      empty.disabled = !state.trash.length;
      parts.push(empty);
    }
    return parts;
  }

  const SCREENS = {
    lock: lockScreen, pin: pinScreen, home: homeScreen,
    photos: photosScreen, photo: photoScreen, trash: trashScreen,
    messages: messagesScreen, thread: threadScreen, mail: mailScreen,
    camera: cameraScreen, weather: weatherScreen, settings: settingsScreen, setting: settingScreen,
  };

  function render() {
    screen.className = `handset-screen screen-${view}`;
    screen.replaceChildren(...SCREENS[view]());
    // A conversation opens on its latest messages.
    const bubbles = screen.querySelector('.bubbles');
    if (bubbles) bubbles.scrollTop = bubbles.scrollHeight;
    // Keep the keyboard working: a field to type in (Mail), else the first
    // control of the new screen.
    (screen.querySelector('input:not(:disabled)') ?? screen.querySelector('button:not(:disabled)'))?.focus();
  }

  // ---- PIN ----

  function press(key) {
    if (view !== 'pin') return;
    if (key === '⌫') entered = entered.slice(0, -1);
    else if (entered.length < PIN_LENGTH) entered += key;
    message = '';
    if (entered.length === PIN_LENGTH) return submit();
    render();
  }

  function submit() {
    const code = entered;
    entered = '';
    if (code === PHONE.pin) {
      unlock(state, 'phone');
      onEvent('unlock');
      return go('home');
    }
    const result = recordFailedAttempt(state, 'phone', now());
    handset.classList.remove('shake');
    void handset.offsetWidth; // restart the animation
    handset.classList.add('shake');
    if (result.lockedOut) {
      takeIntruderPhoto(state, now());
      handset.classList.add('flash');
      setTimeout(() => handset.classList.remove('flash'), 600);
      onEvent('lockout');
      return go('lock');
    }
    message = result.left <= 2
      ? `Code incorrect · ${result.left} essai${result.left > 1 ? 's' : ''} avant blocage`
      : 'Code incorrect';
    render();
  }

  handset.addEventListener('keydown', event => {
    const digit = /^[0-9]$/.test(event.key);
    if (view === 'lock' && digit && lockRemaining(state, 'phone', now()) === 0) go('pin');
    if (view !== 'pin') return;
    if (digit) press(event.key);
    else if (event.key === 'Backspace') press('⌫');
    else return;
    event.preventDefault();
  });

  // Clocks on screen (time, lockout countdown) keep running while it is held.
  const ticker = setInterval(() => {
    if (!handset.isConnected) return clearInterval(ticker);
    if (view === 'lock') {
      const blocked = screen.querySelector('.lock-blocked');
      const wait = lockRemaining(state, 'phone', now());
      if (blocked && wait === 0) return render();
      if (blocked) blocked.textContent = `Téléphone bloqué · réessayez dans ${mss(wait)}`;
      const time = screen.querySelector('.lock-time');
      if (time) time.textContent = hhmm(storyTime(now()));
    }
    const status = screen.querySelector('.phone-status-time');
    if (status) status.textContent = hhmm(storyTime(now()));
  }, 250);

  render();
  return handset;
}
