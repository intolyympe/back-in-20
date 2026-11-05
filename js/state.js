// Game state: what the player has found, unlocked, and left behind. No DOM
// here, so it can be tested with node.
//
// Times (`now`) are milliseconds since the round started: they stop when the
// round is paused, like the countdown.

export const ROUND_MINUTES = 20;
export const MAX_ATTEMPTS = 5;
export const LOCKOUT_MS = 60_000;

/** @param {{photos?: object[]}} [phone] photos already on Camille's phone */
export function createState({ photos = [] } = {}) {
  return {
    clues: [],           // {id, text, deduction?, done?}, in the order found
    unlocked: new Set(), // devices or accounts open right now
    cracked: new Set(),  // devices or accounts the player got into at least once
    attempts: {},        // device id -> wrong tries since the last lockout
    lockedUntil: {},     // device id -> time the lockout ends
    photos: [...photos], // phone gallery, newest first
    trash: [],           // "Supprimés récemment"
    alerts: [],          // security e-mails sent to Camille
  };
}

/** Adds a clue to the notebook. Returns false if it was already there. */
export function addClue(state, clue) {
  if (state.clues.some(c => c.id === clue.id)) return false;
  state.clues.push(clue);
  return true;
}

/** Ticks off a notebook entry (a task done). Returns false if nothing changed. */
/**
 * Ticks a notebook entry off (or back on, with done = false). Returns
 * whether it changed.
 */
export function markDone(state, clueId, done = true) {
  const clue = state.clues.find(c => c.id === clueId);
  if (!clue || Boolean(clue.done) === done) return false;
  clue.done = done;
  return true;
}

/**
 * Adds the conclusion of every deduction whose clues have all been found.
 * Returns the deductions just added (marked `deduction: true`).
 */
export function applyDeductions(state, deductions) {
  const found = new Set(state.clues.map(c => c.id));
  return deductions
    .filter(d => d.from.every(id => found.has(id)))
    .map(d => ({ id: d.id, text: d.text, deduction: true }))
    .filter(clue => addClue(state, clue));
}

/**
 * Counts a wrong code on a device. After MAX_ATTEMPTS it is locked out for
 * LOCKOUT_MS, then the player gets MAX_ATTEMPTS new tries.
 */
export function recordFailedAttempt(state, deviceId, now) {
  const attempts = (state.attempts[deviceId] || 0) + 1;
  if (attempts < MAX_ATTEMPTS) {
    state.attempts[deviceId] = attempts;
    return { attempts, left: MAX_ATTEMPTS - attempts, lockedOut: false };
  }
  state.attempts[deviceId] = 0;
  state.lockedUntil[deviceId] = now + LOCKOUT_MS;
  return { attempts, left: 0, lockedOut: true };
}

/** Milliseconds left before the device accepts codes again (0 if it does). */
export function lockRemaining(state, deviceId, now) {
  return Math.max(0, (state.lockedUntil[deviceId] ?? 0) - now);
}

export function unlock(state, deviceId) {
  state.unlocked.add(deviceId);
  state.cracked.add(deviceId);
  state.attempts[deviceId] = 0;
}

/** Locks a device again (the player's way of tidying up). */
export function relock(state, deviceId) {
  return state.unlocked.delete(deviceId);
}

export function isUnlocked(state, deviceId) {
  return state.unlocked.has(deviceId);
}

/** Did the player get into it at least once, even if it is locked again? */
export function hasCracked(state, deviceId) {
  return state.cracked.has(deviceId);
}

/**
 * The phone's front camera catches whoever failed too many times, and an
 * alert goes to Camille's mailbox. Returns the photo.
 */
export function takeIntruderPhoto(state, now) {
  const n = state.alerts.length + 1;
  const photo = { id: `intruder-${n}`, intruder: true, takenAt: now };
  state.photos.unshift(photo);
  state.alerts.push({ id: `alert-${n}`, photoId: photo.id, sentAt: now });
  return photo;
}

/** Moves a photo from the gallery to "Supprimés récemment". */
export function deletePhoto(state, photoId) {
  const index = state.photos.findIndex(p => p.id === photoId);
  if (index === -1) return false;
  state.trash.unshift(...state.photos.splice(index, 1));
  return true;
}

/** Empties "Supprimés récemment": those photos are gone for good. */
export function emptyTrash(state) {
  state.trash = [];
}

/** What Camille would find if she came back now. */
export function leftoverTraces(state) {
  return {
    intruderPhotos: [...state.photos, ...state.trash].filter(p => p.intruder).length,
    alerts: state.alerts.length,
    openPc: state.unlocked.has('pc'), // she would find her session open
  };
}
