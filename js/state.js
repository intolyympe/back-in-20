// Game state: what the player has found and unlocked. No DOM here, so it can
// be tested with node.

export const ROUND_MINUTES = 20;
export const MAX_ATTEMPTS = 5;

export function createState() {
  return {
    clues: [],          // {id, text}, in the order they were found
    unlocked: new Set(), // device or account ids
    attempts: {},        // device id -> wrong tries so far
  };
}

/** Adds a clue to the notebook. Returns false if it was already there. */
export function addClue(state, clue) {
  if (state.clues.some(c => c.id === clue.id)) return false;
  state.clues.push(clue);
  return true;
}

/** Counts a wrong try on a device; it locks after MAX_ATTEMPTS. */
export function recordFailedAttempt(state, deviceId) {
  const attempts = (state.attempts[deviceId] || 0) + 1;
  state.attempts[deviceId] = attempts;
  return { attempts, locked: attempts >= MAX_ATTEMPTS };
}

export function isLocked(state, deviceId) {
  return (state.attempts[deviceId] || 0) >= MAX_ATTEMPTS;
}

export function unlock(state, deviceId) {
  state.unlocked.add(deviceId);
}

export function isUnlocked(state, deviceId) {
  return state.unlocked.has(deviceId);
}
