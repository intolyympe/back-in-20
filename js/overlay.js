// Shows one object in the foreground (the phone, later the laptop...).
// Escape or a click on the backdrop puts it back down. While it is open, the
// rest of the desk is inert, so Tab cannot reach the objects behind it.

export function createOverlay(overlayEl, contentEl) {
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
  };

  overlayEl.addEventListener('click', event => {
    if (event.target === overlayEl) close();
  });

  return {
    isOpen: () => !overlayEl.hidden,
    close,
    /** `from` is the desk object picked up: hidden while held, focused again after. */
    open(view, from) {
      opener = from ?? null;
      opener?.classList.add('picked-up');
      contentEl.replaceChildren(view);
      behind().forEach(el => { el.inert = true; });
      overlayEl.hidden = false;
      (view.querySelector('input, button') ?? overlayEl).focus();
    },
  };
}
