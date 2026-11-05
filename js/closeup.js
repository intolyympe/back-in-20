// Close-up of a desk object: a copy of the object, enlarged, with the
// player's thought written underneath.

const MAX_WIDTH = 900;  // stage px available in the overlay
const MAX_HEIGHT = 520;
const MAX_ZOOM = 3;

export function createCloseUp(button, thought) {
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

  const figure = document.createElement('figure');
  figure.className = 'closeup';
  const object = document.createElement('div');
  object.className = 'closeup-object';
  object.append(copy);
  const caption = document.createElement('figcaption');
  caption.className = 'closeup-thought';
  caption.textContent = thought;
  figure.append(object, caption);
  return figure;
}
