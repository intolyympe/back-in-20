// Who the player is: a penetration tester, secretly hired by Camille's
// company to show how dangerous an unattended desk is. The loot is proofs:
// photos of the accounts opened and of her security mistakes, taken with the
// tester's own phone (js/data/photos.js). The debrief is their report, and
// says what a real thief would have done.

export const MISSION = {
  from: 'Direction de la sécurité',
  title: 'Mission : test d’intrusion',
  lines: [
    'Tu es engagé en secret, avec l’accord de la direction : montre-nous à quel point un poste laissé sans surveillance est dangereux.',
    'Camille vient de quitter son bureau. Elle revient dans 20 minutes.',
    'Rapporte des preuves : photographie (touche P) chaque compte que tu ouvres et chaque faille que tu trouves, avec ton propre téléphone.',
    'Ne te fais pas prendre, et remets tout comme tu l’as trouvé.',
  ],
};

// One proof per account, in the order of the chain. `thief` is what a real
// attacker would have done with that access, for the report.
export const PROOFS = {
  phone: { label: 'son téléphone ouvert', thief: 'Lire ses messages, voir ses photos, recevoir ses codes par SMS.' },
  pc: { label: 'sa session sur le PC', thief: 'Copier les fichiers de l’entreprise, envoyer des mails en son nom.' },
  mail: { label: 'sa boîte mail', thief: 'Réinitialiser ses comptes, un par un, comme tu l’as fait pour Bulle.' },
  bulle: { label: 'son compte Bulle', thief: 'Se faire passer pour elle auprès de ses 214 abonnés.' },
  bank: { label: 'son espace bancaire', thief: 'Vider son compte, ou demander un crédit à son nom.' },
};
