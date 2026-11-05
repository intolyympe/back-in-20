import { setupDesk } from './scenes/desk.js';

const STAGE_W = 1600;
const STAGE_H = 900;
const TOAST_MS = 3500;

const stage = document.getElementById('stage');
const toast = document.getElementById('toast');

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

fitStage();
window.addEventListener('resize', fitStage);

setupDesk(stage, (id, object) => showToast(object.text));
