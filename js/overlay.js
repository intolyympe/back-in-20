// Shows one object in the foreground: the phone, or any desk object up close.
// Space, Escape or a click on the backdrop puts it back. While it is open, the rest
// of the desk is inert, so Tab cannot reach the objects behind it.

/** `onClose` is called each time the object is put back. */
export function createOverlay(overlayEl, contentEl, { onClose = () => {} } = {}) {
  const hint = overlayEl.querySelector('.overlay-hint-action');
  let opener = null;
  const behind = () => [...overlayEl.parentElement.children].filter(el => el !== overlayEl);

  const close = () => {
    if (overlayEl.hidden) return;
    overlayEl.hidden = true;
    contentEl.replaceChildren();
    behind().forEach(el => { el.inert = false; });
    if (opener) {
      opener.classList.remove('picked-up');
      opener.focus();
    }
    onClose();
  };

  overlayEl.addEventListener('click', event => {
    if (event.target === overlayEl) close();
  });

  return {
    isOpen: () => !overlayEl.hidden,
    close,
    /**
     * `from` is the desk object it came from, focused again on close. With
     * `pickUp`, that object leaves the desk while it is held.
     */
    open(view, from, { pickUp = false } = {}) {
      opener = from ?? null;
      if (pickUp) opener?.classList.add('picked-up');
      hint.textContent = pickUp ? 'pour reposer' : 'pour revenir';
      contentEl.replaceChildren(view);
      behind().forEach(el => { el.inert = true; });
      overlayEl.hidden = false;
      (view.querySelector('input, button') ?? overlayEl).focus();
    },
  };
}
