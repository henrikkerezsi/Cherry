export interface TutorialPage {
  icon: string;
  title: string;
  body: string;
}

export const tutorialPages: TutorialPage[] = [
  {
    icon: 'coffee-outline',
    title: 'Welcome to Cherry',
    body: 'A private coffee journal that tells you what to brew next. Everything you record stays ' +
      'on this device — no account, no ads, no tracking, no analytics. The app works fully ' +
      'offline, and the only network request it ever makes is to an AI provider you configure ' +
      'yourself, and only when you ask for an AI feature.',
  },
  {
    icon: 'sprout-outline',
    title: 'Beans, gear and methods',
    body: 'Start in the catalogue: add your roasters and bags with roast date, process and origin, ' +
      'your brewers and grinders, and your grind settings. The nine methods ship with their ' +
      'canonical recipes, so a method guide is there before you have recorded anything.',
  },
  {
    icon: 'clipboard-text-outline',
    title: 'Plan, brew, taste',
    body: 'A brew is a plan, a brew, and a tasting. Plan the parameters you intend to use, record ' +
      'what you actually did, then tell it how it tasted. Every field is writable by hand — the ' +
      'manual path is complete, and AI is an assistant rather than a requirement.',
  },
  {
    icon: 'microphone-outline',
    title: 'Talking through a brew',
    body: 'Tap the mic while you brew and narrate it. Moments are stamped with a phase — prep, ' +
      'brew, finish, taste, note — and the transcript becomes a structured record you review and ' +
      'correct. If transcription fails, the audio and transcript both survive and you type the rest.',
  },
  {
    icon: 'chart-line',
    title: 'Learning what you like',
    body: 'Once you have rated a few brews, Cherry fits what you rated highly against what you ' +
      'changed: grind, time, temperature, dose and ratio. That becomes the engine behind the next ' +
      'recommendation. The maths is deterministic and runs on your device, so the same history ' +
      'always gives the same advice.',
  },
  {
    icon: 'shield-check-outline',
    title: 'Your data stays yours',
    body: 'Backups are a single SQLite file you share to wherever you like, and your AI key is ' +
      'stripped from it. Restoring replaces everything currently in the app, so the app always asks ' +
      'first. There is no server, so there is nothing to leak.',
  },
];