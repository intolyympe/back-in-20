// The debrief: each of Camille's mistakes and how she could have avoided it,
// in the order the player met them. Kind to her: these are everyone's
// mistakes, and the point is how easy they made it.

export const LESSONS = [
  {
    device: 'phone',
    title: '1 · Téléphone',
    mistake: 'Son code, 1411, c’est sa date d’anniversaire : un gâteau sur le calendrier et une vieille carte ont suffi.',
    fix: 'Un code tiré au hasard, d’au moins 6 chiffres, sans la date de personne.',
  },
  {
    device: 'pc',
    title: '2 · Session du PC',
    mistake: 'Rex2019! : le nom de son chien, l’année de son arrivée, et un « ! » pour la règle. L’indice « mon bébé ❤ » aidait encore.',
    fix: 'Une longue phrase de passe tirée au hasard, sans rien de sa vie, et pas d’indice.',
  },
  {
    device: 'mail',
    title: '3 · Messagerie',
    mistake: 'Le même mot de passe que le PC, et noté en clair dans une note « Codes ».',
    fix: 'Un mot de passe différent pour chaque compte, rangé dans un gestionnaire.',
  },
  {
    device: 'bulle',
    title: '4 · Bulle',
    mistake: 'Qui tient sa boîte mail réinitialise ses comptes : sans double authentification, le lien a suffi.',
    fix: 'Protéger la messagerie en premier, avec une double authentification par appli ou par clé.',
  },
  {
    device: 'bank',
    title: '5 · Banque',
    mistake: 'Une question secrète dont la réponse est publique sur Bulle, et un code par SMS sur un téléphone mal protégé.',
    fix: 'Une fausse réponse tirée au hasard, gardée dans le gestionnaire, et une double authentification par appli ou par clé.',
  },
  {
    device: 'vault',
    title: 'Coffre',
    mistake: 'Aucune : une phrase de passe tirée au hasard et une clé physique, toujours sur elle.',
    fix: 'Le modèle à suivre partout. Si tout avait été comme lui, la partie se serait arrêtée au téléphone.',
  },
];
