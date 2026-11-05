// The rank at the end of a round: how cleanly the player got away. Only the
// traces the player could have erased count; Bulle's changed password cannot
// be undone, so it does not.

export const RANKS = {
  caught: { title: 'Pris sur le fait', line: 'Elle te trouve en train de fouiller son bureau.' },
  ghost: { title: 'Fantôme', line: 'Elle ne se doutera jamais de rien.' },
  burglar: { title: 'Cambrioleur', line: 'Quelques miettes… Elle pourrait avoir des doutes.' },
  elephant: { title: 'Éléphant', line: 'Elle sait que quelqu’un est passé.' },
};

/** How many traces the player left that could have been erased. */
export function avoidableTraces(traces) {
  return traces.intruderPhotos
    + traces.alerts
    + (traces.missingEmails ? 1 : 0)
    + (traces.openPc ? 1 : 0)
    + (traces.bankTexts ? 1 : 0);
}

/**
 * @param {object} traces  from leftoverTraces()
 * @param {boolean} caught  still holding something or sitting at her PC
 */
export function rankFor(traces, caught) {
  if (caught) return RANKS.caught;
  const count = avoidableTraces(traces);
  if (count === 0) return RANKS.ghost;
  if (count <= 2) return RANKS.burglar;
  return RANKS.elephant;
}
