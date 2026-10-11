export interface DailyGreeting {
  hello: string;
  pun: string;
  fact: string;
}

const GREETINGS: readonly DailyGreeting[] = [
  {
    hello: 'Good morning, brew-tiful human.',
    pun: 'Careful now — pour decisions are hard.',
    fact: 'Coffee beans are the pits of the coffee cherry, so coffee is technically a fruit drink.',
  },
  {
    hello: 'Hello, bean friend.',
    pun: "You've bean on my mind all day.",
    fact: 'Espresso means "pressed out" in Italian.',
  },
  {
    hello: 'Hey there, caffeine connoisseur.',
    pun: 'Latte love brew into everything you do.',
    fact: 'A single coffee tree yields less than a kilo of beans a year.',
  },
  {
    hello: 'Rise and grind!',
    pun: 'You op-purr-ate best on fresh beans.',
    fact: 'A goat herder is said to have discovered coffee in ancient Ethiopia.',
  },
  {
    hello: 'Hi, hot-drink hero.',
    pun: "You're brewing magic, one cup at a time.",
    fact: 'Finland drinks more coffee per person than any other country.',
  },
  {
    hello: "G'day, java traveller.",
    pun: 'Great days always start with a solid pour.',
    fact: 'Mocha coffee is named after Yemen\u2019s port city of Mocha.',
  },
  {
    hello: 'Welcome back, dial-in detective.',
    pun: 'Every roast is a clue; every cup, a verdict.',
    fact: 'Caffeine perks you up by blocking adenosine, your brain\u2019s "sleepy" signal.',
  },
  {
    hello: 'Bonjour, bean aficionado.',
    pun: "You're crema of the crop this morning.",
    fact: 'Cappuccino takes its name from the hoods Capuchin monks once wore.',
  },
  {
    hello: 'Top o\u2019 the morning!',
    pun: "It's a mug-nificent day for great coffee.",
    fact: 'Hawaii is the only US state that grows coffee commercially.',
  },
  {
    hello: 'Ahoy, sailor of the caffeine seas.',
    pun: "All ashore who's going to a pour-over.",
    fact: 'Cold brew is gentler on a sensitive stomach than hot-brewed coffee.',
  },
  {
    hello: 'Hello, bean of my heart.',
    pun: 'You stir me the right way, every time.',
    fact: 'The very first webcam ever pointed at a coffee pot — so people could watch it brew.',
  },
  {
    hello: 'Hey ho, gentle frother.',
    pun: 'You whisk me right off my feet.',
    fact: 'Latte-art contests are a genuine, fiercely competitive professional sport.',
  },
  {
    hello: 'Hola, brew-ndo.',
    pun: 'Bean there, ground that — brewing it again.',
    fact: 'Coffee plants can live for more than a hundred years.',
  },
  {
    hello: 'Morning, grounds\u2019 keeper.',
    pun: 'Your patience is steeping nicely.',
    fact: 'Cupping is to coffee what tasting is to wine.',
  },
  {
    hello: 'Hey, drip architect.',
    pun: 'Great things percolate from small beans.',
    fact: 'An espresso shot carries less caffeine than a mug of drip coffee.',
  },
  {
    hello: 'Hello, mug in hand.',
    pun: 'Let\u2019s bean here for a while.',
    fact: 'The husks of coffee cherries steep into a tea-like drink called cascara.',
  },
  {
    hello: 'Shalom, brew enthusiast.',
    pun: 'Filter anything that\u2019s holding you back.',
    fact: 'Brazil has been the world\u2019s top coffee grower for well over a century.',
  },
  {
    hello: 'Heyo, percolator.',
    pun: "You're pure grounds for celebration.",
    fact: 'Caffeine reaches your brain within about half an hour of your first sip.',
  },
  {
    hello: 'Hello, smooth operator.',
    pun: 'Like a flat white: steady, calm, and bold.',
    fact: 'Brewing through paper filters strips cafestol, the coffee oil that raises cholesterol.',
  },
  {
    hello: 'Morning, grind visionary.',
    pun: "Today's the day to make the coffee the hero.",
    fact: 'The word "java" comes from the Indonesian island that once supplied much of the world.',
  },
  {
    hello: 'Hallo, pour artist.',
    pun: 'Your ratio of care to caffeine is inspiring.',
    fact: 'Specialty coffee is graded like wine: a score of 80 or above out of 100.',
  },
  {
    hello: 'Hiya, bean chaser.',
    pun: 'You find magic at the bottom of a cup.',
    fact: 'Dialing in: too coarse runs fast and weak, too fine turns bitter.',
  },
  {
    hello: 'Hey, deliberate sipper.',
    pun: 'Steep your thoughts, then speak.',
    fact: 'Coffee cherries are still picked by hand, berry by berry.',
  },
  {
    hello: 'Welcome, frother general.',
    pun: 'The steam wand raises the stakes.',
    fact: 'Good microfoam is tiny, uniform bubbles — glossy, like fresh paint.',
  },
  {
    hello: 'Hello, one-more-cup friend.',
    pun: 'The third cup is the charm — the first two are practice.',
    fact: 'Espresso was invented in Milan to serve busy workers a quick, strong cup.',
  },
  {
    hello: 'Morning, slow drip.',
    pun: 'Patience brews the best cups.',
    fact: 'Pouring in a steady spiral keeps the coffee bed flat — and the brew even.',
  },
  {
    hello: 'Hey, home roaster.',
    pun: 'Light, medium, dark — you like your beans with character.',
    fact: 'Fresh coffee exhales gas for days after roasting; that\u2019s why it needs to rest.',
  },
  {
    hello: 'Howdy, high-bean thinker.',
    pun: 'A little crema goes a long way.',
    fact: 'Water makes up about 98% of your cup — good water is half the battle.',
  },
  {
    hello: 'Ciao, crema admirer.',
    pun: 'You\u2019re having an espresso-ially good day.',
    fact: 'Crema is trapped gas from roasting — a sign of freshness, not strength.',
  },
  {
    hello: 'Hey, bean-counter.',
    pun: 'Counting beans, brewing joy.',
    fact: 'For a cleaner cup, rinse your paper filter before brewing — it removes the papery taste.',
  },
];

export const GREETING_COUNT = GREETINGS.length;

export function greetingForDay(date: string): DailyGreeting {
  const parsed = new Date(`${date}T12:00:00Z`);
  if (Number.isNaN(parsed.getTime())) {
    return GREETINGS[0];
  }
  const dayOfYear = Math.floor(
    (parsed.getTime() - Date.UTC(parsed.getUTCFullYear(), 0, 0)) / 86_400_000
  );
  const seed = parsed.getUTCFullYear() * 366 + dayOfYear;
  return GREETINGS[seed % GREETINGS.length];
}