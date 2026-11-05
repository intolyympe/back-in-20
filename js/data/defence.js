// The words of "Défendre Camille": each door, the choices, and what the
// ghost runs into. The rules are in js/defence.js.

export const DOOR_TEXT = {
  phone: {
    title: '1 · Téléphone',
    question: 'Son nouveau code',
    placeholder: '6 chiffres ou plus',
    random: 'Tirer au hasard',
    ghost: 'Il tape 1411, puis ses dates…',
  },
  pc: {
    title: '2 · Session du PC',
    question: 'Son nouveau mot de passe',
    placeholder: 'Une longue phrase de passe',
    random: 'Tirer une phrase de passe',
    ghost: 'Il essaie Rex2019!, puis le chien, les dates, les villes…',
  },
  mail: {
    title: '3 · Messagerie',
    question: 'Son mot de passe',
    options: [
      ['same', 'Le même que le PC'],
      ['noted', 'Un autre, noté dans « Codes »'],
      ['vault', 'Un autre, unique, rangé dans Coffre'],
    ],
    ghost: 'Il essaie le mot de passe du PC, et fouille ses notes…',
  },
  bulle: {
    title: '4 · Bulle',
    question: 'Double authentification',
    options: [
      ['none', 'Aucune'],
      ['sms', 'Code par SMS'],
      ['app', 'Appli sur son téléphone'],
      ['key', 'Clé de sécurité'],
    ],
    ghost: 'Il demande un lien de réinitialisation…',
  },
  bank: {
    title: '5 · Banque',
    question: 'Réponse à « Dans quelle ville êtes-vous née ? »',
    options: [
      ['true', 'La vraie : Annecy'],
      ['fake', 'Une fausse, tirée au hasard, rangée dans Coffre'],
    ],
    secondQuestion: 'Validation des connexions',
    secondOptions: [
      ['sms', 'Code par SMS'],
      ['app', 'Appli sur son téléphone'],
      ['key', 'Clé de sécurité'],
    ],
    ghost: 'Il répond à la question secrète, puis attend le code…',
  },
};

// Why a door gave way or held (the `why` of replayAttack, and the live
// feedback under the code and password fields).
export const WHY = {
  digits: 'Un code de téléphone, ce sont des chiffres.',
  short: 'Trop court : il le trouve vite, ou le lit par-dessus son épaule.',
  personal: 'Il y a un bout de sa vie dedans : il commence par là.',
  date: 'Une date : il les essaie en premier.',
  commonPassword: 'Un des plus courants au monde.',
  guessable: 'Trop facile à deviner.',
  random: 'Tiré au hasard, et bloqué après 5 essais : il abandonne.',
  weak: 'Trop court ou trop simple : ça tombe en quelques minutes.',
  strong: 'Long et sans rien de sa vie : il peut toujours essayer.',
  same: 'Le même que le PC : il entre du premier coup.',
  noted: 'Noté dans « Codes », sur le PC qu’il vient d’ouvrir.',
  'same-pc-held': 'Le même que le PC… mais le PC a tenu : il ne le connaît pas.',
  'noted-pc-held': 'Noté sur le PC… qui a tenu.',
  unique: 'Unique et rangé dans Coffre : rien à réutiliser.',
  none: 'Pas de double authentification : le lien suffit.',
  'sms-phone': 'Le code arrive par SMS… sur le téléphone qu’il tient.',
  'app-phone': 'L’appli est sur le téléphone qu’il tient.',
  'sms-phone-held': 'Le code arrive par SMS sur un téléphone qu’il n’a pas.',
  'app-phone-held': 'L’appli est sur un téléphone qu’il n’a pas.',
  key: 'Il faudrait la clé, et elle est dans sa poche.',
  'fake-answer': 'La réponse ne correspond à rien de sa vie : introuvable.',
  'answer-hidden': 'Sa ville natale est sur Bulle… qui a tenu.',
};
