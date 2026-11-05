// Camille's phone in the foreground. For now only the lock screen; the PIN
// pad comes with chapter 1.

const DATE_FORMAT = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });

export function createPhoneView(now = new Date()) {
  const handset = document.createElement('div');
  handset.className = 'handset';
  handset.innerHTML = `
    <div class="handset-screen">
      <div class="lock-time"></div>
      <div class="lock-date"></div>
      <div class="lock-status">Verrouillé</div>
    </div>`;

  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  handset.querySelector('.lock-time').textContent = `${hours}:${minutes}`;
  handset.querySelector('.lock-date').textContent = DATE_FORMAT.format(now);
  return handset;
}
