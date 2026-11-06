import {
  createState, addClue, markDone, applyDeductions, leftoverTraces, openBulleResetLink, recordPhoto,
  ROUND_MINUTES,
} from './state.js';
import { createTimer, formatClock } from './timer.js';
import { createNotebook } from './notebook.js';
import { createOverlay } from './overlay.js';
import { createCloseUp, withThought } from './closeup.js';
import { setupDesk, verbFor } from './scenes/desk.js';
import { createPhoneView } from './scenes/phone.js';
import { createPcView } from './scenes/pc.js';
import { createCalendarView } from './scenes/calendar.js';
import { notable } from './notable.js';
import { createNotepadView } from './scenes/notepad.js';
import { createDrawerView } from './scenes/drawer.js';
import { STORY_START, DEDUCTIONS, PHONE, PC, MAIL } from './data/camille.js';
import { renderDebrief } from './debrief.js';
import { rankFor } from './rank.js';
import { ding } from './sound.js';
import { createDefence } from './scenes/defend.js';
import { MISSION } from './data/mission.js';
import { classifyAll } from './data/photos.js';
import { STEPS, READY_TEXT, nextStep, TUTORIAL_OBJECT } from './tutorial.js';
import { icon } from './icons.js';

const STAGE_W = 1600;
const STAGE_H = 900;
const TOAST_MS = 3500;
const URGENT_MS = 60_000;

const $ = id => document.getElementById(id);
const stage = $('stage');
const toast = $('toast');
const clock = $('clock');

// Dev shortcuts: index.html?seconds=10 for a short round, ?tutorial=off to
// go straight to the desk.
const params = new URLSearchParams(location.search);
const seconds = Number(params.get('seconds'));
const withTutorial = params.get('tutorial') !== 'off';
const roundMs = seconds > 0 ? seconds * 1000 : ROUND_MINUTES * 60_000;

const state = createState({ photos: PHONE.photos, emails: MAIL.emails });
const timer = createTimer(roundMs);
const notebook = createNotebook($('notebook-list'), $('notebook-empty'));
const overlay = createOverlay($('overlay'), $('overlay-content'), { onClose: () => tutorialEvent('close') });
let playing = false;
let clockRunning = false;

// ---- Tutorial: the post-it teaches the four gestures before the clock starts.

const TUTORIAL_DONE_KEY = 'back-in-20:tutorial-done';
const READY_MS = 3500;
let tutorialStep = null; // index in STEPS, or null when no tutorial runs

function tutorialDoneBefore() {
  try {
    return localStorage.getItem(TUTORIAL_DONE_KEY) === 'yes';
  } catch {
    return false;
  }
}

function showTutorialStep() {
  const done = tutorialStep >= STEPS.length;
  $('tutorial-step').textContent = done ? 'C’est parti' : `Tutoriel · ${tutorialStep + 1} sur ${STEPS.length}`;
  $('tutorial-text').textContent = done ? READY_TEXT : STEPS[tutorialStep].text;
  document.querySelector(`[data-hotspot=${TUTORIAL_OBJECT}]`).classList.toggle('tuto-target', tutorialStep === 0);
  if (done) endTutorial();
}

/** The player did something: the tutorial moves on if it was the awaited gesture. */
function tutorialEvent(event) {
  if (tutorialStep === null) return;
  const next = nextStep(tutorialStep, event);
  if (next === tutorialStep) return;
  tutorialStep = next;
  showTutorialStep();
}

function endTutorial({ skipped = false } = {}) {
  tutorialStep = null;
  $('tutorial-skip').hidden = true;
  document.querySelector(`[data-hotspot=${TUTORIAL_OBJECT}]`).classList.remove('tuto-target');
  try {
    localStorage.setItem(TUTORIAL_DONE_KEY, 'yes');
  } catch {
    // Private mode: the tutorial will simply be offered again.
  }
  if (skipped) $('tutorial').hidden = true;
  else setTimeout(() => { $('tutorial').hidden = true; }, READY_MS);
  startClock();
}

function fitStage() {
  const scale = Math.min(window.innerWidth / STAGE_W, window.innerHeight / STAGE_H);
  stage.style.setProperty('--scale', scale);
}

let toastTimeout;
function showToast(text) {
  toast.textContent = text;
  toast.classList.add('visible');
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => toast.classList.remove('visible'), TOAST_MS);
}

/** Milliseconds since the round started (stops when the round is paused). */
const elapsed = () => roundMs - timer.remaining();

/** Time in the story: Camille left at STORY_START, the clock runs with the round. */
function storyTime(ms = elapsed()) {
  return new Date(STORY_START.getTime() + ms);
}

let bannerTimeout;
function showChapterBanner(number, title) {
  const banner = $('chapter-banner');
  banner.querySelector('.chapter-number').textContent = typeof number === 'number' ? `Chapitre ${number}` : number;
  banner.querySelector('.chapter-title').textContent = title;
  banner.hidden = false;
  clearTimeout(bannerTimeout);
  bannerTimeout = setTimeout(() => { banner.hidden = true; }, 4000);
}

/** What a photo of the view in front of the player would show, outer to inner. */
function currentShot() {
  const subjects = [...$('overlay-content').querySelectorAll('[data-subject]')].map(e => e.dataset.subject);
  return classifyAll(subjects.length ? subjects : ['nothing']);
}

/**
 * The tester photographs what is in front of them, with their own phone. A
 * photo can prove several things at once (her phone open, and Rex's photo on
 * it): each new access or flaw goes in the notebook and the report. A photo
 * that proves nothing is a useless one, which the report counts too.
 */
function photograph() {
  if (!playing || !overlay.isOpen()) return;
  const { proofs, useless } = currentShot();
  $('overlay').classList.remove('flash');
  void $('overlay').offsetWidth; // restart the flash
  $('overlay').classList.add('flash');
  tutorialEvent('photo');

  if (useless) {
    recordPhoto(state, 'useless', useless.id);
    const times = state.shots.filter(s => s.id === useless.id).length;
    // « de un téléphone » → « d’un téléphone »
    const of = /^[aeiouéèêh]/i.test(useless.text) ? `d’${useless.text}` : `de ${useless.text}`;
    showToast(times > 1 ? `Encore ${useless.text} ? La direction va se poser des questions.` : `Photo ${of}. Inutile pour le rapport.`);
  } else {
    const fresh = proofs.filter(shot => recordPhoto(state, shot.kind, shot.id) === 'new');
    if (!fresh.length) {
      showToast('Déjà photographié : rien de plus pour ton rapport.');
    } else {
      note(fresh.map(shot => ({
        id: `proof-${shot.id}`,
        text: shot.kind === 'access' ? `Preuve : accès à ${shot.text}.` : `Faille : ${shot.text}`,
        proof: true,
      })));
      showToast(fresh.length > 1 ? `${fresh.length} preuves ajoutées à ton rapport.`
        : fresh[0].kind === 'access' ? 'Accès prouvé : ajouté à ton rapport.' : 'Faille photographiée : ajoutée à ton rapport.');
    }
  }
  updatePhotoButton();
}

/** "Déjà photographié" when everything this view proves is in the report. */
function updatePhotoButton() {
  const { proofs } = currentShot();
  const done = proofs.length > 0 && proofs.every(shot => state.proofs.has(shot.id));
  $('photo-button').classList.toggle('taken', done);
  $('photo-label').textContent = done ? 'Déjà photographié' : 'Photographier';
}

// What the phone tells the notebook.
const PHONE_NOTES = {
  unlocked: { id: 'phone-unlocked', text: 'Téléphone déverrouillé avec 1411.' },
  caught: { id: 'phone-caught', text: 'Le téléphone m’a pris en photo ! Et il a prévenu Camille par mail…' },
  erasePhoto: { id: 'erase-photo', task: true, text: 'Effacer ma photo : galerie, puis « Supprimés récemment ».' },
  eraseAlert: { id: 'erase-alert', task: true, text: 'Effacer les mails d’alerte : sa boîte mail, puis la corbeille.' },
};

function onPhoneEvent(type, data) {
  if (type === 'unlock') {
    note([PHONE_NOTES.unlocked]);
    showChapterBanner(1, 'Le téléphone · terminé');
  } else if (type === 'lockout') {
    note([PHONE_NOTES.caught, PHONE_NOTES.erasePhoto, PHONE_NOTES.eraseAlert]);
    // A second lockout: both tasks are back if they were done.
    const reopened = [PHONE_NOTES.erasePhoto.id, PHONE_NOTES.eraseAlert.id].map(id => markDone(state, id, false));
    if (reopened.some(Boolean)) notebook.render(state.clues);
  } else if (type === 'texts-deleted' && markDone(state, BANK_NOTES.eraseText.id)) {
    notebook.render(state.clues);
    showToast('SMS de la banque effacé.');
  } else if (type === 'trash-emptied' && leftoverTraces(state).intruderPhotos === 0) {
    if (markDone(state, PHONE_NOTES.erasePhoto.id)) {
      notebook.render(state.clues);
      showToast('Photo effacée pour de bon.');
    }
  }
}

/** Writes new clues in the notebook, then any conclusion they lead to. */
function note(clues) {
  const found = clues.filter(clue => addClue(state, clue));
  if (!found.length) return;
  const deduced = applyDeductions(state, DEDUCTIONS);
  notebook.render(state.clues);
  if (deduced.length) showToast('Je crois que j’ai compris quelque chose…');
  else showToast(found.length > 1 ? `${found.length} indices notés dans le carnet.` : 'Noté dans le carnet.');
}

const PC_NOTES = {
  unlocked: { id: 'pc-unlocked', text: `PC déverrouillé avec ${PC.password}` },
  relock: { id: 'pc-relock', task: true, text: 'Reverrouiller le PC avant son retour.' },
};

function onPcEvent(type, data) {
  const desk = document.querySelector('.desk');
  if (type === 'unlock') {
    desk.classList.add('pc-open');
    const first = !state.clues.some(clue => clue.id === PC_NOTES.unlocked.id);
    note([PC_NOTES.unlocked, PC_NOTES.relock]);
    // Opened again after locking it: the task is back.
    if (markDone(state, PC_NOTES.relock.id, false)) notebook.render(state.clues);
    if (first) showChapterBanner(2, 'La session du PC · terminé');
  } else if (type === 'lock') {
    desk.classList.remove('pc-open');
    if (markDone(state, PC_NOTES.relock.id)) {
      notebook.render(state.clues);
      showToast('PC reverrouillé.');
    }
  }
}

const MAIL_NOTES = {
  unlocked: { id: 'mail-unlocked', text: `Messagerie ouverte avec ${MAIL.password}, comme le PC.` },
  caught: { id: 'mail-caught', text: 'La messagerie a bloqué la connexion et prévenu Camille par mail…' },
};

/** Crosses out "erase the alert" once no alert e-mail is left anywhere. */
function checkAlertsErased() {
  if (leftoverTraces(state).alerts === 0 && markDone(state, PHONE_NOTES.eraseAlert.id)) {
    notebook.render(state.clues);
    showToast('Mails d’alerte effacés pour de bon.');
  }
}

function onMailEvent(type, data) {
  if (type === 'unlock') {
    const first = !state.clues.some(clue => clue.id === MAIL_NOTES.unlocked.id);
    note([MAIL_NOTES.unlocked]);
    if (first) showChapterBanner(3, 'La messagerie · terminé');
  } else if (type === 'lockout') {
    note([MAIL_NOTES.caught, PHONE_NOTES.eraseAlert]);
    if (markDone(state, PHONE_NOTES.eraseAlert.id, false)) notebook.render(state.clues);
  } else if (type === 'trash-emptied') {
    checkAlertsErased();
  } else if (type === 'reset-link') {
    openBulleResetLink(state);
  }
}

const BANK_NOTES = {
  codeSent: { id: 'bank-code-sent', text: 'Nébula : bonne réponse ! Le code de validation arrive par SMS… sur ce téléphone.' },
  opened: { id: 'bank-opened', text: 'Espace bancaire ouvert. Je ne touche à rien.' },
  eraseText: { id: 'erase-bank-text', task: true, text: 'Effacer le SMS de Nébula dans Messages.' },
};

function onBankEvent(type, data) {
  if (type === 'code-sent') {
    note([BANK_NOTES.codeSent, BANK_NOTES.eraseText]);
    if (markDone(state, BANK_NOTES.eraseText.id, false)) notebook.render(state.clues);
  } else if (type === 'unlock') {
    note([BANK_NOTES.opened]);
    alertToErase();
    showChapterBanner(5, 'La banque · terminé');
  }
}

const VAULT_NOTE = {
  id: 'vault-tried',
  text: 'Coffre : une phrase de passe ET une clé physique. Celui-là résiste.',
};


function onVaultEvent(type) {
  if (type === 'tried') {
    note([VAULT_NOTE]);
  } else if (type === 'give-up') {
    // Time to go: jump to the last minute.
    const left = timer.remaining();
    if (left > FINALE_MS) timer.penalize(left - FINALE_MS);
  }
}

const BULLE_NOTES = {
  resetSent: { id: 'bulle-reset-sent', text: 'Bulle : lien de réinitialisation envoyé… dans sa boîte mail.' },
  taken: { id: 'bulle-taken', text: 'Compte Bulle repris avec un nouveau mot de passe. Elle ne pourra plus s’y connecter…' },
};

/** A new e-mail from Bulle is one more alert to erase. */
function alertToErase() {
  note([PHONE_NOTES.eraseAlert]);
  if (markDone(state, PHONE_NOTES.eraseAlert.id, false)) notebook.render(state.clues);
}

function onBulleEvent(type, data) {
  if (type === 'reset-sent') {
    note([BULLE_NOTES.resetSent]);
    alertToErase();
  } else if (type === 'unlock') {
    note([BULLE_NOTES.taken]);
    alertToErase();
    showChapterBanner(4, 'Le réseau social · terminé');
  }
}

const VIEWS = {
  phone: () => createPhoneView({
    state, now: elapsed, storyTime, onEvent: onPhoneEvent, onMailEvent, onBulleEvent, onBankEvent, onVaultEvent,
  }),
  pc: () => createPcView({ state, now: elapsed, storyTime, onEvent: onPcEvent, onMailEvent, onBulleEvent, onVaultEvent }),
  calendar: createCalendarView,
  notepad: createNotepadView,
  drawer: createDrawerView,
};

function inspect(id, object, button) {
  if (!playing) return;
  if (tutorialStep !== null && id !== TUTORIAL_OBJECT) {
    showToast('D’abord le post-it.');
    return;
  }
  if (object.toggle) {
    const on = button.closest('.desk').classList.toggle(object.toggle);
    button.setAttribute('aria-pressed', on);
    button.dataset.verb = verbFor(object, on);
  } else {
    const view = object.opens ? VIEWS[object.opens]() : createCloseUp(button);
    // A close-up can hide a detail to note (the post-it's words…).
    if (!object.opens && object.detail) notable(view.firstElementChild, object.detail);
    // What a photo would show, unless the view says more precisely.
    view.dataset.subject ??= id;
    overlay.open(withThought(view, object.text), button, { pickUp: object.pickUp });
    tutorialEvent('open');
  }
}

// The player clicked a detail: it goes in the notebook.
document.addEventListener('note-clue', event => {
  note([event.detail.clue]);
  tutorialEvent('note');
});

// The last minute: a "ding", she is on her way back. Everything must be put
// back and the player must leave her desk before the clock runs out.
const FINALE_MS = 60_000;
const FINALE_NOTE = { id: 'finale', task: true, text: 'Ding ! Elle revient. Tout reposer et quitter son bureau, vite !' };
let finale = false;

function startFinale() {
  finale = true;
  ding();
  stage.classList.add('finale');
  showChapterBanner('Ding !', 'Elle revient : tout remettre en place !');
  note([FINALE_NOTE]);
}

function tick() {
  const left = timer.remaining();
  clock.textContent = formatClock(left);
  clock.classList.toggle('urgent', left <= URGENT_MS);
  if (left === 0) return endGame();
  if (!finale && left <= FINALE_MS) startFinale();
  requestAnimationFrame(tick);
}

function startClock() {
  clockRunning = true;
  timer.start();
  requestAnimationFrame(tick);
}

/** "J'accepte la mission": the tutorial first, then the clock. */
function startGame(event) {
  $('start-screen').hidden = true;
  playing = true;
  if (!withTutorial) return startClock();
  tutorialStep = 0;
  $('tutorial').hidden = false;
  $('tutorial-skip').hidden = !tutorialDoneBefore();
  showTutorialStep();
  // Started with the keyboard (no mouse click): keep the focus on the desk.
  if (event.detail === 0) document.querySelector(`[data-hotspot=${TUTORIAL_OBJECT}]`).focus();
}

/**
 * Camille is back. Whatever the player still holds, or sitting at her PC,
 * gets them caught.
 */
function endGame() {
  playing = false;
  timer.pause();
  const caught = overlay.isOpen();
  overlay.close();
  $('chapter-banner').hidden = true;
  stage.classList.remove('finale');
  const traces = leftoverTraces(state);
  renderDebrief(state, { traces, caught, rank: rankFor(traces, caught) });
  $('end-screen').hidden = false;
  $('defend-button').focus();
}

// The clock stops while the tab is hidden, so leaving the game is not a penalty.
document.addEventListener('visibilitychange', () => {
  if (!playing || !clockRunning) return;
  if (document.hidden) timer.pause();
  else timer.start();
});

// Space puts the object back (Escape too), unless the player is typing in a
// field. The key is swallowed so it does not also press the button that gets
// the focus back on the desk.
let swallowSpaceUp = false;
document.addEventListener('keydown', event => {
  const typing = event.target.closest?.('input, textarea, [contenteditable]');
  if (event.key === ' ' && overlay.isOpen() && !typing) {
    event.preventDefault();
    swallowSpaceUp = true;
    overlay.close();
  }
}, { capture: true });
document.addEventListener('keyup', event => {
  if (event.key === ' ' && swallowSpaceUp) {
    event.preventDefault();
    swallowSpaceUp = false;
  }
}, { capture: true });

document.addEventListener('keydown', event => {
  if (event.key === 'Escape') overlay.close();
  // P takes a photo, unless the player is typing.
  const typing = event.target.closest?.('input, textarea, [contenteditable]');
  if ((event.key === 'p' || event.key === 'P') && !typing) photograph();
});

fitStage();
window.addEventListener('resize', fitStage);
clock.textContent = formatClock(roundMs);

setupDesk(stage, inspect);
$('photo-button').prepend(icon('camera'));
$('photo-button').addEventListener('click', photograph);
// The view changes (another app, another photo…): the button follows.
new MutationObserver(updatePhotoButton).observe($('overlay-content'), {
  childList: true, subtree: true, attributes: true, attributeFilter: ['data-subject'],
});
$('start-button').addEventListener('click', startGame);
$('tutorial-skip').addEventListener('click', () => endTutorial({ skipped: true }));
// The mission letter on the start screen.
$('mission').append(
  Object.assign(document.createElement('p'), { className: 'mission-from', textContent: MISSION.from }),
  Object.assign(document.createElement('h2'), { className: 'mission-title', textContent: MISSION.title }),
  ...MISSION.lines.map(line => Object.assign(document.createElement('p'), { textContent: line })),
);

$('restart-button').addEventListener('click', () => location.reload());
$('defend-button').addEventListener('click', () => {
  $('end-screen').hidden = true;
  $('defend-screen').hidden = false;
  createDefence($('defend-screen'));
});
$('start-button').focus();
