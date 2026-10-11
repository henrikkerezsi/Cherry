export interface WhatsNewEntry {
  version: string;
  releasedAt: string;
  intro?: string;
  features: string[];
}

export const whatsNew: WhatsNewEntry[] = [
  {
    version: '0.1.0',
    releasedAt: '2026-10-05T00:00:00.000Z',
    intro:
      'The foundation of a coffee journal that learns what you like. Cherry records how you ' +
      'brew, what it tastes like, and works out what to change next — all on your own device, with ' +
      'no account and no tracking.',
    features: [
      'A private, local-first app: everything lives in one SQLite database on this device, and the ' +
        'app works fully offline',
      'A catalogue of roasters, beans, brewers, grinders and grind settings, plus the nine brew ' +
        'methods with their canonical recipes and full step-by-step technique guides',
      'Plan a brew, record what you actually did, and let the app diff the two — with derived ratio ' +
        'and brew duration calculated rather than stored',
      'Taste it from "I did not like it" through a 1–5 rating, with an optional full SCA cupping ' +
        'form and a flavour vocabulary',
      'Record a brew by voice: narrate it while you brew, stamp moments with a phase, and review ' +
        'the transcript before anything is saved',
      'A deterministic recommendation engine that explains every change it proposes, in safe, ' +
        'curious and adventurous modes',
      'A Learn tab that reports what you are actually sensitive to, your taste profile, the habits ' +
        'you repeat, and the things you rarely change',
      'AI is entirely optional and entirely yours: bring your own provider, key and model, and the ' +
        'app never contacts an AI provider unless you ask it to',
      'Manual entry is a complete equal of the AI path — every field the extraction can fill is ' +
        'fillable by hand',
      'One-tap backups as a single SQLite file, with your API key stripped before it leaves the app',
    ],
  },
];