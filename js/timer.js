// Countdown until Camille comes back. The clock is injectable so tests don't
// have to wait.

export function createTimer(durationMs, now = () => performance.now()) {
  let remainingAtStart = durationMs;
  let startedAt = null;

  const remaining = () => {
    const left = startedAt === null ? remainingAtStart : remainingAtStart - (now() - startedAt);
    return Math.max(0, left);
  };

  return {
    remaining,
    isRunning: () => startedAt !== null,
    start() {
      if (startedAt === null) startedAt = now();
    },
    pause() {
      if (startedAt === null) return;
      remainingAtStart = remaining();
      startedAt = null;
    },
    /** Takes time off the clock, e.g. if some actions end up costing minutes. */
    penalize(ms) {
      remainingAtStart -= ms;
    },
  };
}

/** 61_500 -> "01:02" (rounds up, so "00:00" only shows once time is out). */
export function formatClock(ms) {
  const total = Math.ceil(Math.max(0, ms) / 1000);
  const minutes = String(Math.floor(total / 60)).padStart(2, '0');
  const seconds = String(total % 60).padStart(2, '0');
  return `${minutes}:${seconds}`;
}
