// Close-up of a desk object: a copy of the object, enlarged. Any view (the
// copy, the calendar taken off the wall...) can get the player's thought
// written underneath.

const MAX_WIDTH = 900;  // stage px available in the overlay
const MAX_HEIGHT = 520;
const MAX_ZOOM = 3;

export function createCloseUp(button) {
  const width = button.offsetWidth;
  const height = button.offsetHeight;
  const zoom = Math.min(MAX_WIDTH / width, MAX_HEIGHT / height, MAX_ZOOM);

  // A plain copy (not a button): it is only there to be looked at.
  const copy = document.createElement('div');
  copy.className = button.className;
  copy.innerHTML = button.innerHTML;
  copy.style.width = `${width}px`;
  copy.style.height = `${height}px`;
  copy.style.zoom = zoom;

  const object = document.createElement('div');
  object.className = 'closeup-object';
  object.append(copy);
  return object;
}

/** Puts the player's thought under a view. Without a thought, the view as is. */
export function withThought(view, thought) {
  if (!thought) return view;
  const figure = document.createElement('figure');
  figure.className = 'closeup';
  const caption = document.createElement('figcaption');
  caption.className = 'closeup-thought';
  caption.textContent = thought;
  figure.append(view, caption);
  return figure;
}
