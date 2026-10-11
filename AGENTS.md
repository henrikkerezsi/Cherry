# AGENTS.md — Cherry Coding Conventions

This file is the single source of truth for AI agents working on Cherry.
Read `idea.txt` for the full product and architecture specification.
Read `theme.md` for every design token and component-theming rule.

The user is working **100% via AI agents**. Nothing here is advisory. If a task
seems to require breaking a rule in this file, stop and ask first.

---

## 1. Project Overview

Cherry is a private, local-first Android app for recording coffee brews by
voice, extracting a structured record from the transcript with a cloud LLM,
tracking what the coffee tasted like, and recommending what to brew next with a
deterministic learning engine.

It is the sibling of **Coconut** (`/home/4urelius/Documents/Coding/Coconut`, a
budget app). Same Material Design 3 foundation, same architecture, same
offline-first discipline, same documentation conventions, different colours and a
different domain. Explore Coconut read-only when you need a pattern; **never
modify anything under the Coconut directory.**

Local SQLite is the single source of truth. The app works fully offline. The only
network requests are to an AI provider the user configured, and only when the
user invokes an AI feature.

**There is no local inference. Ever.** No on-device model, no GGUF, no
`llama.rn`, no MediaPipe, no LiteRT, no ExecuTorch, no `whisper.rn`. Every AI
operation is a cloud HTTP call. See `idea.txt` §5.

Tech stack (mandatory, do not deviate without explicit user approval):

- React Native via Expo SDK (same SDK line as Coconut)
- TypeScript (strict mode)
- expo-sqlite for local storage
- Expo Router for navigation
- React Native Paper (Material Design 3) for UI components
- dayjs for date handling
- expo-audio for recording and level metering
- expo-notifications for local notifications
- expo-file-system and expo-sharing for backup and audio files
- @expo/vector-icons for all icons
- Jest + jest-expo + @testing-library/react-native for tests
- react-native-web + react-dom (desktop/web build support)

Forbidden additions:

- Any on-device or embedded inference runtime (see the bold rule above)
- Redux / MobX / Zustand or any state-management framework
- Any backend or cloud service other than the user-configured AI provider
- Ads, analytics, telemetry, or crash-reporting SDKs
- `react-native-vector-icons` (use `@expo/vector-icons`, which ships with Expo)
- Any new dependency at all without checking first whether Expo, React Native
  Paper, dayjs or existing code can already do the job

Never hardcode an API key, base URL or model name for a real provider. The
provider base URL, key and model are entered in the in-app AI settings screen and
stored only in the local `ai_state` singleton.

---

## 2. Report and Plan

When starting work:

1. Read `idea.txt` — it defines the product.
2. Read `theme.md` — it defines the appearance.
3. Read this file — it defines how to build.
4. State the plan of what you will implement **before** writing code.
5. Ask when a decision is ambiguous. Do not guess on anything in `idea.txt` §24.

Do NOT implement things the user has not asked for. `idea.txt` §23 lists the
non-goals explicitly; respect them.

---

## 3. The Development Environment

- OS: Linux. Shell: zsh.
- Node.js 22+.
- JDK 21 (`~/.sdkman/candidates/java/current`, `/usr/lib/jvm/java-21-openjdk`).
- `ANDROID_HOME=/home/4urelius/Android/Sdk`.
- Installed SDK: `platforms/android-36` and `android-37.0`,
  `build-tools/35.0.0` and `36.0.0`, `cmake/3.22.1`,
  `ndk/27.1.12297006`. The NDK is required by `expo-sqlite`'s native build.
- Target device: the **`Pixel_6a` AVD** in Android Studio. The emulator is the
  primary verification target. The app's `minSdkVersion` is 29.

Preferred commands:

| Command | Purpose |
| --- | --- |
| `npm install` | install dependencies |
| `npm run start` | start the Expo dev server |
| `npm run android` | run on the Pixel 6a emulator |
| `npm run web` | run the desktop/web build |
| `npm test` | run Jest |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | `expo lint` |
| `npx expo export --platform web` | verify the web build compiles |

---

## 4. The Android Emulator Is Off Limits — NEVER Wipe It

**NEVER, EVER, UNDER ANY CIRCUMSTANCES wipe, reset, erase, or recreate the
Android emulator or any of its data. This is absolute and non-negotiable.**

The user's emulator holds real, hand-entered data that exists nowhere else. Treat
every emulator wipe as permanent data loss for the user.

Never run, suggest, recommend, or fall back to any of the following:

- `adb emu kill` (kills the emulator process)
- `adb emu avd name` / any AVD deletion
- `emulator -avd <name> -wipe-data` (the `-wipe-data` flag)
- `adb shell pm clear com.cherry.app` (clears app data)
- `adb uninstall com.cherry.app`
- Deleting or re-creating the AVD via Android Studio / Device Manager
- Any "reset emulator", "cold boot", or "wipe app data" button in an IDE or GUI
- Deleting the emulator's userdata directory from disk
- Any other command or action whose effect is to erase emulator or app data

Allowed, and preferred, for verification: read-only inspection
(`adb shell dumpsys`, `adb logcat`, `adb shell run-as ... ls`), rebuilding and
reinstalling the APK (`npx expo run:android`), and `adb shell am force-stop` to
restart the app process. None of these erase data.

If a task seems to require a fresh emulator, STOP and ask the user first. Never
assume permission, and never treat a wipe as an acceptable debugging step.

**Real device required for AI features.** The user develops on the emulator, but
the AI pipeline (transcription and LLM extraction) must be verified on a real
device. Do not claim an AI feature works because it was exercised on the
emulator — Android's cloud speech recogniser needs real Play Services and a
network, and the user has explicitly stated that the emulator is not a valid
target for AI verification. UI, database, services and rendering are verified on
the emulator.

---

## 5. Project Structure

```
src/
├── app/           # Expo Router screens and layouts (file-based routing)
│   ├── (tabs)/    # overview, log, equipment, learn, settings
│   └── _layout.tsx
├── components/    # Reusable UI components (React Native Paper based)
├── database/      # SQLite schema, migrations, and data-access layer
├── models/        # TypeScript types and interfaces (domain model)
├── services/      # Business logic / calculations (pure TS)
├── ai/            # Cloud provider transport, prompts, schemas, extraction
├── theme/         # Material 3 theming (see theme.md)
├── config/        # App metadata, What's New, tutorial, repository
├── data/          # DataProvider (React context that owns app state)
└── utils/         # Generic helpers (date/formatting, units, etc.)
tests/             # Jest tests, mirroring src/
assets/            # App icons, logo, splash
```

Platform-specific modules are written as `name.android.tsx` / `name.web.tsx`
pairs (or `.native.ts` / `.web.ts`), so the same import resolves correctly on
Android and desktop/web. Do not branch on `Platform.OS` inside a shared file
where a `.web` variant is the cleaner solution.

`tests/` mirrors the structure of `src/` and `src/app/`.

---

## 6. Naming Conventions

- Files: `kebab-case.ts` / `kebab-case.tsx` (e.g. `brew-form.tsx`).
- React components: `PascalCase`.
- Non-component functions and variables: `camelCase`.
- Types: `PascalCase`. Module constants: `UPPER_SNAKE_CASE`.
- SQLite tables: `snake_case`, plural, e.g. `voice_sessions`, `brews`.
- SQLite columns: `snake_case`, no type prefix (e.g. `dose_g`, not `float_dose`).
- Physical units always carry their unit in the column name: `dose_g`,
  `water_total_g`, `water_temp_c`, `expected_total_time_s`, `pour_duration_s`,
  `bag_weight_g`. There is no bare `amount` or `weight` column anywhere.
- Timestamps end in `_at`; dates end in `_date`; durations end in `_s` (seconds)
  or `_ms` (milliseconds) and never leave the unit ambiguous.
- Test ids for interactive controls follow the pattern `<thing>-<value>`, e.g.
  `rating-3`, `phase-brew`, `mode-safe`.

---

## 7. Database Layer

- All database access lives in `src/database/`. Never call SQL directly from UI.
- Use a single database file via `expo-sqlite`. One `getDatabase()` singleton in
  `src/database/database.ts`, opening the file, setting
  `PRAGMA journal_mode = WAL`, running pending migrations, then resolving.
- Schema changes require a migration: a numbered migration appended to
  `src/database/migrations.ts`. **Never mutate an existing migration.**
- Migrations are `{ id: number; description: string; sql: string }`, tracked by
  SQLite's own `PRAGMA user_version` inside the same transaction as the SQL.
  There is no migration bookkeeping table. Copy Coconut's `migrate()` exactly.
- Every `CREATE TABLE`, `CREATE INDEX` and `CREATE TRIGGER` uses
  `IF NOT EXISTS`, so each migration is re-runnable against a restored backup.
- Every domain table carries `uuid TEXT` with a `UNIQUE` index and
  `updated_at TEXT` **from migration 1**, because `idea.txt` §13.1 reserves the
  door for future sync and because AI payloads reference entities by `uuid`, not
  by a device-local integer.
- Money is stored as integer cents (`price_cents`). Never floats.
- **Physical measurements are stored as REAL** — grams, millilitres, degrees
  Celsius, seconds. Coffee measurements are genuinely continuous. This is a
  deliberate deviation from Coconut's integer-everything rule, which applies to
  money only. Never store a physical measurement as an integer.
- Booleans are `INTEGER NOT NULL DEFAULT 0` / `DEFAULT 1`; decode with
  `row.active === 1`, encode with `input.active ? 1 : 0`.
- Enums are `TEXT` with `CHECK (col IS NULL OR col IN (...))`. Add the CHECK in
  the `CREATE TABLE` for new tables and via `ALTER TABLE ADD COLUMN` for existing
  ones, exactly as Coconut's migration 14 does.
- Nullable is the bare absence of `NOT NULL`. Non-nullable is reserved for
  identity, timestamps and foreign keys. `idea.txt` §3.5 makes nullability a
  product requirement, not a modelling convenience.
- Foreign keys: `ON DELETE CASCADE` for true children, `ON DELETE SET NULL` for
  references that must survive. SQLite foreign-key enforcement is not globally
  enabled; delete-ordering is explicit in repository code, as in Coconut.
- Timestamps `TEXT` in ISO-8601 with milliseconds and `Z`. Dates `TEXT` as
  `YYYY-MM-DD`. Audio offsets `INTEGER` milliseconds.
- One repository module per aggregate: `beans.ts`, `roasters.ts`, `brewers.ts`,
  `grinders.ts`, `recipes.ts`, `plans.ts`, `recommendations.ts`, `brews.ts`,
  `tastings.ts`, `voiceSessions.ts`, `extractionRuns.ts`, `insights.ts`,
  `reminders.ts`, `methods.ts`, `flavourTags.ts`, `aiState.ts`, `settings.ts`.
- Every repository function starts with
  `const database = db ?? (await getDatabase());` and takes a trailing
  `db?: SQLiteDatabase`, so callers inside a transaction reuse one handle.
- Repository API naming, following Coconut exactly:
  `get<Thing>(id, db?)`, `getAll<Things>(db?)`, `get<Things>By<Dimension>(...)`,
  `create<Thing>(input, db?) => Promise<number>`, `update<Thing>(id, input, db?)`,
  `set<Thing><Field>(id, value, db?)`, `delete<Thing>(id, db?)`,
  `upsert<Thing>(...)`, `reorder<Things>(orderedIds, db?)`.
- Write functions accept a `...Input` DTO, never a full model.
- Row interfaces and `rowTo<Thing>` mappers are module-private and never exported.
- Read functions return `T | null`; nullable model fields are `T | null`, never
  optional `?:`, except for genuinely derived or computed properties.
- Derived values (`ratio`, `brew_duration`, `extraction_verdict`, preference
  groupings) are **never stored** (`idea.txt` §13.3). If you find yourself adding
  such a column, stop.

---

## 8. Business Logic

- All calculations live in `src/services/` as pure TypeScript functions. No React,
  no Expo imports, no database imports — a service takes data in and returns data
  out.
- UI components must NOT contain recommendation math, taste modelling, rating
  aggregation, unit conversion, or freshness calculation. Call a service.
- Key services (`idea.txt` §18):
  - `recommendation-service.ts` — the engine and its three modes.
  - `taste-model-service.ts` — the per-knob Bayesian regression and sensitivities.
  - `insight-service.ts` — the four findings of `idea.txt` §12.
  - `tasting-service.ts` — aggregation across multiple tastings of one brew.
  - `brew-service.ts` — plan-versus-brew diffing, derived ratio and duration.
  - `bean-service.ts` — freshness, rotation, remaining weight.
  - `voice-session-service.ts` — session state machine, moments, phases.
- The recommendation engine is deterministic and pure. Given the same history and
  the same mode it must return the same result. `safe` mode is fully
  deterministic; `curious` and `adventurous` may sample from a **seeded** PRNG
  whose seed is an explicit parameter, so tests are reproducible. Never call
  `Math.random()` in a service.
- Every function in `src/services/` has a corresponding unit test in `tests/`.

---

## 9. The AI Layer

`src/ai/` is the only place network calls happen. It is kept strictly separate
from `src/services/`, which stays pure.

- `provider.ts` defines the transport interface. `openai-compatible.ts`
  implements it over `fetch`. Anything that needs the network depends on the
  interface, never on `fetch` directly.
- `schemas.ts` derives the JSON schemas from the domain models. Adding a nullable
  field to a model **requires** adding it to the schema in the same change, and
  adding a test fixture that exercises it.
- `prompts.ts` holds versioned prompt templates. Every prompt has an id and a
  version; the version is recorded on the `extraction_run`.
- `extraction.ts` parses, validates, repairs and diffs. It never writes to the
  domain tables.
- `assistance.ts` answers a technique question from brewing context. It returns
  advisory text plus, optionally, a structured `flaw` block and candidate values.
  Exchanges are ephemeral and never persisted; it never writes to the database.

**Non-negotiable AI rules:**

1. No local inference, ever. No on-device model, no bundled weights.
2. Credentials are never hardcoded, never logged, never committed, never included
   in a backup, and never sent anywhere except the configured base URL.
3. Network failures never destroy data. Audio, transcripts and records survive
   any provider failure. Every AI operation is additive.
4. The LLM never writes to the database. It returns candidates; the user and the
   service layer dispose.
5. The LLM never decides a recommendation. `recommendation-service.ts` does, and
   the LLM only writes the narrative. If the LLM is unavailable, a deterministic
   template produces the narrative and the recommendation is still valid.
6. Manual entry is always a complete equal of the AI path. Every field the
   extraction schema can fill must also be fillable by hand.
7. No test ever makes a real network call. Tests use a fake transport with fixed
   fixtures.

---

## 10. UI Components

- Use React Native Paper components (Card, List, Button, TextInput, Chip, etc.).
- Read `theme.md` before writing any style. Colors come from `useAppTheme()` —
  never a raw hex, never a hardcoded radius, never a hardcoded spacing number.
- Reuse the shared component vocabulary rather than re-rolling it: `StatCard`,
  `AppDialog`, `EmptyState`, `ScreenFade`, `FadeIn`, `AnimatedNumber`,
  `LoadingScreen`, `KeyboardAwareScrollView`, `RatingSelector`, `CustomTabBar`,
  `ScreenToast`. These have the same APIs as Coconut's; copy the Coconut
  implementation and adapt only what the domain requires.
- Use TypeScript types for all props. Never `any`.
- Keep components presentational where possible; screens own state.
- Every interactive control gets an `accessibilityRole`, an
  `accessibilityLabel` and, where it is part of a group, an `accessibilityState`.
  This is part of the component's interface, not an afterthought.
- Every screen renders inside `ScreenFade` and scrolls inside
  `KeyboardAwareScrollView`.
- New semantic colours must be added to `theme.md` and `tokens/colors.ts` in the
  same change. Never use a literal colour to express a new state.

---

## 11. TypeScript

- `strict: true` is always on. Never disable it.
- Prefer interfaces for object shapes; types for unions.
- Derive types from the domain models in `src/models/`.
- No `@ts-ignore`, `@ts-nocheck`, or `any` without explicit justification in a
  comment naming the reason.
- Enum-like unions that are also validated at runtime use the `as const` array
  pattern from Coconut:
  ```ts
  export const BREW_METHOD_IDS = ['v60', 'chemex', ...] as const;
  export type BrewMethodId = (typeof BREW_METHOD_IDS)[number];
  ```
  There is no TypeScript `enum` anywhere in this project.

---

## 12. Testing

- Unit tests are mandatory for every function in `src/services/`.
- The recommendation engine and the taste model must be tested against fixture
  data with **known** expected answers, not snapshots of whatever the code
  happens to output. A snapshot of a statistical model asserts nothing useful.
- Every fixture uses exact, readable physical values (`dose_g: 15`,
  `water_total_g: 250`, `water_temp_c: 93`). No random values.
- Determinism: services take an explicit seed where they sample. Tests pass a
  fixed seed. `Math.random()` is forbidden in `src/`.
- Component tests are encouraged for non-trivial behaviour, especially the
  record screen's session state machine and the extraction review's diff.
- AI tests use the fake transport. No network in tests, ever.
- Run with `npm test`.

---

## 13. Style / Quality

- No comments unless they explain a non-obvious business rule. Do not narrate
  what the code plainly says.
- No dead code, unused imports, or debug logging left behind.
- Keep functions small and focused; split when they grow.
- Prefer a small dependency footprint. Before adding a dependency, ask whether
  Expo, React Native Paper, dayjs, or existing code can already do this. If a new
  dependency is genuinely needed, say so and get approval first.
- Never commit secrets, credentials, personal data, or recorded audio.
- Follow existing patterns in the codebase and in Coconut rather than introducing
  new ones.

---

## 14. Git

- Keep commits small and focused; one logical change per commit.
- Only commit when the user explicitly asks. Never commit unprompted.
- Do not amend, force-push, or rewrite history unless explicitly told to.
- Never commit a real API key. Check `git diff` before every commit.

---

## 15. Definition of Done

A task is done only when ALL of the following hold:

1. The feature matches the specification in `idea.txt` and, if it affects
   appearance, `theme.md`.
2. Unit tests for all new or changed business logic pass (`npm test`).
3. TypeScript compiles with no errors (`npm run typecheck`).
4. The app runs in the Pixel 6a emulator without warnings caused by your code,
   AND the web build compiles with no errors caused by your code
   (`npx expo export --platform web`).
5. No lint errors (`npm run lint`).
6. No new dependency was added without explicit approval.
7. No API key, credential, or recorded audio is present in the diff.
8. If the change affects the appearance, the contrast verification in
   `theme.md` §8 still reports zero failures.
9. If the change affects the AI pipeline, it was exercised on a **real device**,
   not only the emulator.
10. If the change affects the schema, a **new** numbered migration was added and
    no existing migration was edited.
