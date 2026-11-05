import { createState, addClue, ROUND_MINUTES } from './state.js';
import { createTimer, formatClock } from './timer.js';
import { createNotebook } from './notebook.js';
import { createOverlay } from './overlay.js';
import { setupDesk } from './scenes/desk.js';
import { createPhoneView } from './scenes/phone.js';

const STAGE_W = 1600;
const STAGE_H = 900;
const TOAST_MS = 3500;
const URGENT_MS = 60_000;

const $ = id => document.getElementById(id);
const stage = $('stage');
const toast = $('toast');
const clock = $('clock');

// Dev shortcut: index.html?seconds=10 for a short round.
const seconds = Number(new URLSearchParams(location.search).get('seconds'));
const roundMs = seconds > 0 ? seconds * 1000 : ROUND_MINUTES * 60_000;

const state = createState();
const timer = createTimer(roundMs);
const notebook = createNotebook($('notebook-list'), $('notebook-empty'));
const overlay = createOverlay($('overlay'), $('overlay-content'));
let playing = false;

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

const VIEWS = {
  phone: createPhoneView,
};

function inspect(id, object, button) {
  if (!playing) return;
  if (object.opens) {
    overlay.open(VIEWS[object.opens](), button);
  } else {
    showToast(object.text);
  }
  if (object.clue && addClue(state, object.clue)) notebook.render(state.clues);
}

function tick() {
  const left = timer.remaining();
  clock.textContent = formatClock(left);
  clock.classList.toggle('urgent', left <= URGENT_MS);
  if (left === 0) return endGame();
  requestAnimationFrame(tick);
}

function startGame(event) {
  $('start-screen').hidden = true;
  playing = true;
  timer.start();
  requestAnimationFrame(tick);
  // Started with the keyboard (no mouse click): keep the focus on the desk.
  if (event.detail === 0) stage.querySelector('[data-hotspot]').focus();
}

function endGame() {
  playing = false;
  timer.pause();
  overlay.close();
  $('end-screen').hidden = false;
  $('restart-button').focus();
}

// The clock stops while the tab is hidden, so leaving the game is not a penalty.
document.addEventListener('visibilitychange', () => {
  if (!playing) return;
  if (document.hidden) timer.pause();
  else timer.start();
});

document.addEventListener('keydown', event => {
  if (event.key === 'Escape') overlay.close();
});

fitStage();
window.addEventListener('resize', fitStage);
clock.textContent = formatClock(roundMs);

setupDesk(stage, inspect);
$('start-button').addEventListener('click', startGame);
$('restart-button').addEventListener('click', () => location.reload());
$('start-button').focus();
