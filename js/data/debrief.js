// The debrief: each step of the chain, as a domino (the clue on top, what it
// opened below), with Camille's mistake and how she could have avoided it.
// Kind to her: these are everyone's mistakes, and the point is how easy they
// made it. `missed` tells where the key was, for steps the player missed.

export const LESSONS = [
  {
    device: 'phone',
    clue: 'Gâteau + carte',
    key: 'Téléphone : 1411',
    missed: 'Un gâteau dessiné le 14 novembre sur le calendrier, et sa vieille carte d’anniversaire dans le tiroir.',
    title: '1 · Téléphone',
    mistake: 'Son code, 1411, c’est sa date d’anniversaire : un gâteau sur le calendrier et une vieille carte ont suffi.',
    fix: 'Un code tiré au hasard, d’au moins 6 chiffres, sans la date de personne.',
  },
  {
    device: 'pc',
    clue: 'Rex + 2019 + « ! »',
    key: 'PC : Rex2019!',
    missed: 'Le chien du calendrier, l’année de la photo « Bienvenue à la maison » et la règle notée dans son bloc-notes.',
    title: '2 · Session du PC',
    mistake: 'Rex2019! : le nom de son chien, l’année de son arrivée, et un « ! » pour la règle. L’indice « mon bébé » aidait encore.',
    fix: 'Une longue phrase de passe tirée au hasard, sans rien de sa vie, et pas d’indice.',
  },
  {
    device: 'mail',
    clue: '« Même mdp que le PC »',
    key: 'Messagerie',
    missed: 'La note « Codes » sur son PC : sa messagerie a le même mot de passe.',
    title: '3 · Messagerie',
    mistake: 'Le même mot de passe que le PC, et noté en clair dans une note « Codes ».',
    fix: 'Un mot de passe différent pour chaque compte, rangé dans un gestionnaire.',
  },
  {
    device: 'bulle',
    clue: 'Lien de réinitialisation',
    key: 'Bulle',
    missed: '« Mot de passe oublié ? » sur Bulle : le lien arrive dans la messagerie.',
    title: '4 · Bulle',
    mistake: 'Qui tient sa boîte mail réinitialise ses comptes : sans double authentification, le lien a suffi.',
    fix: 'Protéger la messagerie en premier, avec une double authentification par appli ou par clé.',
  },
  {
    device: 'bank',
    clue: 'Annecy + SMS',
    key: 'Banque',
    missed: 'Sa ville natale, sur Bulle, répond à la question secrète, et le code arrive sur son téléphone.',
    title: '5 · Banque',
    mistake: 'Une question secrète dont la réponse est publique sur Bulle, et un code par SMS sur un téléphone mal protégé.',
    fix: 'Une fausse réponse tirée au hasard, gardée dans le gestionnaire, et une double authentification par appli ou par clé.',
  },
  {
    device: 'vault',
    clue: 'Coffre',
    key: 'a tenu bon',
    title: 'Coffre',
    mistake: 'Aucune : une phrase de passe tirée au hasard et une clé physique, toujours sur elle.',
    fix: 'Le modèle à suivre partout. Si tout avait été comme lui, la partie se serait arrêtée au téléphone.',
  },
];
