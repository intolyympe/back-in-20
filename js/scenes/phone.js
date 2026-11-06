// Camille's phone, held in the foreground: lock screen, PIN pad, home screen,
// photos and "Supprimés récemment", plus the other apps. Everything can be
// looked at (and time gets lost doing it); anything that would leave a trace
// Camille could notice is refused with a thought. Fictional OS.
//
// The view only draws and reacts; the game state (attempts, lockout, photos)
// lives in js/state.js, and main.js turns events into notebook entries.

import { PHONE, MAIL, BANK } from '../data/camille.js';
import { createMailbox } from './mailbox.js';
import { MORE_APPS, moreAppScreens } from './phone-apps.js';
import { createBulle } from './bulle.js';
import { createBank } from './bank.js';
import { createVault } from './vault.js';
import {
  recordFailedAttempt, lockRemaining, unlock, isUnlocked,
  takeIntruderPhoto, deletePhoto, emptyTrash, leftoverTraces, deleteBankTexts,
} from '../state.js';
import { el, button, hhmm, mss } from '../dom.js';
import { icon } from '../icons.js';
import { notable } from '../notable.js';

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

const HOURLY = [['14h', 'sun', 31], ['15h', 'sun', 32], ['16h', 'sun', 33], ['17h', 'sun-cloud', 32], ['18h', 'sun-cloud', 30]];
const FORECAST = [
  ['Ven.', 'sun', 32], ['Sam.', 'sun-cloud', 29], ['Dim.', 'cloud', 26], ['Lun.', 'sun', 30], ['Mar.', 'sun', 31],
];

// Settings: each row opens a page. Rows of a `readOnly` page are only
// information; the others would change something.
const SETTINGS = [
  {
    name: 'Wi-Fi',
    value: 'Bureau-Invités',
    rows: [['Wi-Fi', 'Activé'], ['Bureau-Invités', 'Connecté'], ['Bureau-Pro', 'Protégé'], ['Imprimante-2e', 'Protégé']],
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

// The dock at the bottom of the home screen, and the grid above it.
const DOCK = [
  { id: 'photos', name: 'Photos', icon: 'photos', color: '#f2a65a' },
  { id: 'messages', name: 'Messages', icon: 'messages', color: '#4d8a52' },
  { id: 'mail', name: 'Mail', icon: 'mail', color: '#2b5fa8' },
  { id: 'camera', name: 'Caméra', icon: 'camera', color: '#555b66' },
];
const GRID = [
  ...MORE_APPS.slice(0, 4), // Plans, Calendrier, Notes, Musique
  { id: 'weather', name: 'Météo', icon: 'sun', color: '#e0a830' },
  { id: 'settings', name: 'Réglages', icon: 'settings', color: '#6b7079' },
  ...MORE_APPS.slice(4),    // Bulle, Nébula, Coffre
];

/**
 * @param {object} options
 * @param {object} options.state       game state
 * @param {() => number} options.now   ms since the round started
 * @param {(ms: number) => Date} options.storyTime  story clock at that time
 * @param {(type: string, data?: object) => void} options.onEvent
 *   'unlock', 'lockout', 'photo-viewed' {photo}, 'thread-viewed' {thread},
 *   'note-viewed' {note}, 'photo-deleted', 'trash-emptied', 'texts-deleted'
 * @param {(type: string, data?: object) => void} options.onMailEvent
 *   events of the Mail app (see mailbox.js)
 * @param {(type: string, data?: object) => void} options.onBulleEvent
 *   events of the Bulle app (see bulle.js)
 * @param {(type: string, data?: object) => void} options.onBankEvent
 *   events of the bank app (see bank.js)
 * @param {(type: string) => void} options.onVaultEvent
 *   events of Coffre (see vault.js)
 */
export function createPhoneView({
  state, now, storyTime, onEvent = () => {}, onMailEvent = () => {}, onBulleEvent = () => {},
  onBankEvent = () => {}, onVaultEvent = () => {},
}) {
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
    bar.append(el('span', 'phone-status-time', hhmm(storyTime(now()))), el('span', '', '4G   62 %'));
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
    // The wallpaper itself: the empty middle of the screen can be noted.
    parts.push(notable(el('div', 'lock-wallpaper'), PHONE.wallpaperClue));

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
    for (const key of ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'erase']) {
      if (!key) { pad.append(el('span')); continue; }
      const b = button(key === 'erase' ? 'pin-key erase' : 'pin-key', key === 'erase' ? 'Effacer' : key, () => press(key));
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
    // The bank's text, while it is on the phone.
    if (state.texts.length) {
      const text = el('div', 'phone-notification');
      text.append(el('strong', '', 'Messages · Nébula'), el('span', '', BANK.text(state.texts[0].code)));
      parts.push(text);
    }
    // Mail notification while an alert e-mail sits in her inbox: the latest.
    const alert = state.inbox.find(email => email.alert);
    if (alert) {
      const { from, subject } = MAIL.alerts[alert.alert];
      const mail = el('div', 'phone-notification');
      mail.append(el('strong', '', `Mail · ${from}`), el('span', '', subject));
      parts.push(mail);
    }
    const appButton = app => {
      const b = button('app', '', () => go(app.id));
      const tile = el('span', 'app-icon');
      tile.style.background = app.color;
      tile.append(icon(app.icon));
      b.append(tile, el('span', 'app-name', app.name));
      return b;
    };
    const grid = el('div', 'app-grid');
    grid.append(...GRID.map(appButton));
    const dock = el('div', 'app-dock');
    dock.append(...DOCK.map(appButton));
    parts.push(grid, dock);
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
    // Texts from her bank, received during the round, come first.
    if (state.texts.length) {
      const b = button('thread-row', '', () => go('bank-texts'));
      const text = el('span', 'thread-text');
      text.append(el('strong', '', 'Nébula'), el('span', 'thread-last', BANK.text(state.texts[0].code)));
      b.append(el('span', 'thread-avatar bank-avatar', 'N'), text, el('span', 'thread-time', hhmm(storyTime(state.texts[0].sentAt))));
      list.append(b);
    }
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
    bubbles.dataset.subject = `phone-thread-${thread.id}`;
    for (const m of thread.messages) {
      if (m.day) bubbles.append(el('p', 'bubble-day', m.day));
      else if (m.scam) bubbles.append(button('bubble link', m.text, think(THOUGHTS.scam)));
      else {
        const bubble = el('p', m.me ? 'bubble me' : 'bubble', m.text);
        bubbles.append(m.clue ? notable(bubble, m.clue) : bubble);
      }
    }
    const reply = button('reply-field', 'Message', think(THOUGHTS.reply));
    return [header(thread.name, 'messages'), bubbles, notNowLine(), reply];
  }

  function bankTextsScreen() {
    const bubbles = el('div', 'bubbles');
    for (const text of [...state.texts].reverse()) bubbles.append(el('p', 'bubble', BANK.text(text.code)));
    const remove = button('photo-delete', 'Supprimer la conversation', () => {
      deleteBankTexts(state);
      onEvent('texts-deleted');
      go('messages');
    });
    return [header('Nébula', 'messages'), bubbles, notNowLine(), remove];
  }

  function bankScreen() {
    return [header('Nébula', 'home'), createBank({ state, now, onEvent: onBankEvent })];
  }

  function mailScreen() {
    // The reset link in Bulle's e-mail opens the Bulle app.
    const onMail = (type, data) => {
      onMailEvent(type, data);
      if (type === 'reset-link') go('bulle');
    };
    return [header('Mail', 'home'), createMailbox({ state, now, storyTime, variant: 'phone', onEvent: onMail })];
  }

  function bulleScreen() {
    return [header('Bulle', 'home'), createBulle({ state, now, variant: 'phone', onEvent: onBulleEvent })];
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
    for (const [label, sky, temp] of entries) {
      const cell = el('div', 'forecast-day');
      cell.append(el('span', '', label), icon(sky, 'forecast-glyph'), el('span', '', `${temp}°`));
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
    frame.dataset.subject = `phone-photo-${photo.intruder ? 'intruder' : photo.id}`;
    const img = el('img');
    img.src = photoSrc(photo);
    img.alt = '';
    frame.append(img);
    if (photo.intruder) frame.append(el('span', 'photo-stamp', `Tentative d’accès · ${hhmm(storyTime(photo.takenAt))}`));
    if (photo.clue) notable(frame, photo.clue);

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
    ...moreAppScreens({ go, header, think, thoughtLine: notNowLine, onEvent }),
    bulle: bulleScreen,
    bank: bankScreen,
    vault: () => [header('Coffre', 'home'), createVault({ state, variant: 'phone', onEvent: onVaultEvent })],
    'bank-texts': bankTextsScreen,
  };

  function render() {
    screen.className = `handset-screen screen-${view}`;
    // What a photo of the phone would show: locked, or her phone open.
    screen.dataset.subject = view === 'lock' || view === 'pin' ? 'phone-locked' : 'phone';
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
    if (key === 'erase') entered = entered.slice(0, -1);
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
    else if (event.key === 'Backspace') press('erase');
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
