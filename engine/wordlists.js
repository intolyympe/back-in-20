import { EFF_WORDS } from './eff-wordlist.js';

// Small built-in dictionaries, ordered from most to least common.
// Real attackers use lists with millions of entries, so a match here is a
// strong signal, while the absence of a match proves nothing.

const PASSWORDS = `
123456 password 12345678 qwerty 123456789 12345 1234 111111 1234567 dragon
123123 baseball abc123 football monkey letmein 696969 shadow master 666666
qwertyuiop 123321 mustang 1234567890 michael 654321 superman 1qaz2wsx 7777777
121212 000000 qazwsx 123qwe killer trustno1 jordan jennifer zxcvbnm asdfgh
hunter buster soccer harley batman andrew tigger sunshine iloveyou charlie
robert thomas hockey ranger daniel starwars 112233 george computer michelle
jessica pepper 1111 zxcvbn 555555 11111111 131313 freedom 777777 pass maggie
159753 aaaaaa ginger princess joshua cheese amanda summer love ashley nicole
chelsea biteme matthew access yankees 987654321 dallas austin thunder taylor
matrix minecraft welcome admin azerty azertyuiop motdepasse soleil doudou
loulou chouchou marseille nicolas camille bonjour coucou 123654 abcdef
abcd1234 password1 password123 admin123 welcome1 qwerty123 iloveyou1
football1 monkey1 letmein1 passw0rd changeme secret login root toor default
guest test test123 hello hello123 whatever sunshine1 princess1 dragon1
shadow1 master1 888888 999999 159357 147258369 147258 azerty123 jetaime
marine julien chocolat portugal france paris loveyou samsung apple google
facebook pokemon naruto qwe123 asd123 zaq12wsx 1q2w3e4r 1q2w3e 1q2w3e4r5t
qazwsxedc 1qaz2wsx3edc qwertz qwertz123 aqwzsx azerty1 soleil1 bonjour1
motdepasse1 loveme lovely flower hottie loveyou1 babygirl angel1 superman1
`;

const WORDS = `
love life time house money music family friend summer winter spring autumn
happy sunny star moon water fire earth wind dragon tiger lion eagle wolf bear
horse dog cat bird fish blue red green black white yellow orange purple pink
gold silver diamond angel devil heaven hell king queen prince princess knight
magic secret power hero ninja pirate rock metal guitar piano dance baby sweet
sugar honey cookie candy apple banana cherry lemon coffee chocolate pizza
beach ocean river mountain forest flower rose garden city street school
computer internet game gamer player soccer football basketball hockey tennis
golf baseball freedom peace dream hope faith trust truth heart soul spirit
shadow ghost death blood storm thunder light dark night day morning evening
monday sunday january february march april june july august september october
november december lucky crazy cool super hello welcome brother sister mother
father mommy daddy jesus christ god user login master correct horse battery
staple
amour bonjour soleil maison famille ami amie chat chien oiseau poisson cheval
loup ours tigre bleu rouge vert noir blanc jaune violet argent diamant ange
diable ciel enfer roi reine princesse chevalier magie pouvoir heros musique
danse bebe doux sucre miel gateau bonbon pomme banane cerise citron cafe plage
riviere montagne foret fleur jardin ville rue ecole ordinateur jeu joueur foot
liberte paix reve espoir confiance verite coeur ame esprit ombre fantome mort
sang orage tonnerre lumiere nuit jour matin soir lundi mardi mercredi jeudi
vendredi samedi dimanche janvier fevrier mars avril mai juin juillet aout
septembre octobre novembre decembre chance heureux fou salut bienvenue frere
soeur maman papa mere pere dieu
michael david james john maria marie julie sophie pierre paul jean lucas louis
emma lea chloe manon sarah laura kevin alex alexandre antoine maxime hugo
`;

export function toRankedMap(words) {
  const map = new Map();
  for (const word of words) {
    if (!map.has(word)) map.set(word, map.size + 1);
  }
  return map;
}

function makeDictionary(words, guessesForRank) {
  const ranked = toRankedMap(typeof words === 'string' ? words.trim().split(/\s+/) : words);
  const maxLength = Math.max(...[...ranked.keys()].map(w => w.length));
  return { ranked, maxLength, guessesForRank };
}

export const DICTIONARIES = {
  // Leaked passwords: the rank is roughly the number of guesses needed.
  passwords: makeDictionary(PASSWORDS, r => r),
  // Plain words: attackers' word lists are much bigger than ours, so a rank
  // here is scaled up to stay realistic.
  words: makeDictionary(WORDS, r => 100 + r * 50),
  // The passphrase list: all 7776 words are equally likely.
  eff: makeDictionary(EFF_WORDS, () => EFF_WORDS.length),
};

// Keyboard rows and columns for QWERTY and AZERTY layouts.
export const KEYBOARD_LINES = [
  // QWERTY rows
  '`1234567890-=', 'qwertyuiop[]\\', "asdfghjkl;'", 'zxcvbnm,./',
  // AZERTY rows
  '²&é"\'(-è_çà)=', 'azertyuiop^$', 'qsdfghjklmù*', '<wxcvbn,;:!',
  // QWERTY columns
  '1qaz', '2wsx', '3edc', '4rfv', '5tgb', '6yhn', '7ujm', '8ik,', '9ol.', '0p;/',
  // AZERTY columns
  '1aqw', '2zsx', '6yhn', '7uj,', '8ik;', '9ol:', '0pm!',
];
