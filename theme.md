# Cherry — Theme Specification

This document defines every design token and every themed surface in Cherry.
It is the single source of truth for the app's appearance. Implement it in
`src/theme/` exactly as specified; do not invent colours, sizes or radii.

Theme tokens are consumed through `useAppTheme()`. Raw hex values must never be
written inline in a component — see `AGENTS.md` §10.

---

## 1. Design Lineage

Cherry is a sibling of **Coconut** (`../Coconut`). The two are one family.

What is borrowed **unchanged** from Coconut:

- Material Design 3 via React Native Paper, `version: 3`, `isV3: true`
- The exact same token *shapes* and token *file layout*
- The same spacing scale, radii scale, elevation model and type scale
- The same `buildTheme` / `buildSemanticColors` / `buildElevation` /
  `buildFontScale` / `buildNavigationTheme` construction
- The same `ThemeMode` / `ThemePreference` (`light` | `dark` | `system`) mechanism
- System font only. No custom font files. `fonts.regular === 'System'`
- The same chart palette **role** (a fixed 8-entry categorical series palette)

What is deliberately **different**:

- The colour values. Coconut is coconut-shell brown, sage green and dusty blue
  on a warm cream. Cherry is a coffee-cherry theme: a deep roasted coffee-brown
  primary and a ripe coffee-cherry red secondary, on an oat-beige paper, with a
  muted green-tea teal and a caramel amber as the third and fourth brand scales.
- Every colour in this document is contrast-verified to WCAG 2.1 AA. Coconut is
  not; see §8.

---

## 2. Token File Layout

```
src/theme/
├── index.tsx        # CherryThemeProvider, useAppTheme()
├── types.ts         # CherryTheme, ThemeMode, ThemePreference, BrandTokens
├── theme.ts         # buildCherryTheme(raw, scheme)
├── light.ts         # lightTheme = buildCherryTheme(lightColors, 'light')
├── dark.ts          # darkTheme  = buildCherryTheme(darkColors,  'dark')
├── fonts.ts         # buildFontScale()
├── semantic.ts      # buildSemanticColors(tokens, onAccent)
├── navigation.ts    # buildNavigationTheme(theme)
└── tokens/
    ├── colors.ts    # ColorTokens, lightColors, darkColors
    ├── spacing.ts   # spacing
    ├── radii.ts     # radii
    ├── elevation.ts # buildElevation(shadowColor)
    ├── typography.ts# typography, fonts
    ├── chart.ts     # chartPaletteLight, chartPaletteDark, ChartColor
    └── index.ts     # barrel
```

This is byte-for-byte the same structure as Coconut's `src/theme/`. Only the
values and the two palette names differ.

---

## 3. Colour Token Shape

Identical to Coconut. Four brand scales, three semantic scales plus `onErrorContainer`.

```
ColorTokens
├── surfaces  : background, surface, surfaceSecondary, surfaceTertiary,
│               surfaceHover, surfacePressed, elevation1..elevation5
├── borders   : border, borderStrong, borderSubtle
├── text      : primary, secondary, tertiary, disabled, onAccent
├── primary   : BrandScale   # roasted coffee brown
├── secondary : BrandScale   # coffee-cherry red
├── water     : BrandScale   # green-tea teal
├── warm      : BrandScale   # caramel amber
└── semantic  : success/successLight/successBorder,
                warning/warningLight/warningBorder,
                error/errorLight/errorBorder/onErrorContainer,
                info/infoLight/infoBorder

BrandScale = { base, hover, pressed, light, muted }
```

The names `water` and `warm` are kept from Coconut on purpose so that a reader
with Coconut open in another window is never confused. In Cherry, `water`
is the cool counterweight to the brown and `warm` is the caramel highlight.

### Brand scale semantics

| Role | Meaning | Use for |
| --- | --- | --- |
| `base` | The colour itself | Primary actions, active states, selected tab |
| `hover` | Lighter (dark mode) / darker (light mode) | Press-and-hold feedback |
| `pressed` | Clearly pressed | Momentary press |
| `light` | Tinted container | Chips, banners, soft badges, FAB container |
| `muted` | Desaturated border-weight version | Chips borders, inactive series, dividers on tinted surfaces |

---

## 4. Light Scheme

### 4.1 Surfaces

An oat-beige paper. Deliberately close in temperature to Coconut's `#F7F4EC` so
the two apps read as the same product, but with a visible warm-brown, kiln-dried
cast.

| Token | Value |
| --- | --- |
| `background` | `#F6F0E6` |
| `surface` | `#FCF9F3` |
| `surfaceSecondary` | `#EFE7DA` |
| `surfaceTertiary` | `#E6DAC8` |
| `surfaceHover` | `#F3ECE1` |
| `surfacePressed` | `#E1D3BF` |
| `elevation1` | `#FAF5EC` |
| `elevation2` | `#F6F0E6` |
| `elevation3` | `#F2EBDE` |
| `elevation4` | `#EEE5D5` |
| `elevation5` | `#EADFCC` |

`elevation1..5` must each be a hair darker than the one before it. Verify this
before committing any change to a single elevation value.

### 4.2 Borders

| Token | Value |
| --- | --- |
| `border` | `#E2D3BE` |
| `borderStrong` | `#CBB79C` |
| `borderSubtle` | `#EDE3D5` |

### 4.3 Text

| Token | Value | Contrast on `surface` |
| --- | --- | --- |
| `primary` | `#2A211A` | 15.02 |
| `secondary` | `#5C4E42` | 7.62 |
| `tertiary` | `#7A6A5B` | 4.95 |
| `disabled` | `#A99B8C` | 2.58 |
| `onAccent` | `#FFFDF9` | — |

`disabled` is below 4.5 by design and is used only for genuinely disabled
controls, which WCAG 1.4.3 explicitly exempts.

### 4.4 Brand scales

| Scale | `base` | `hover` | `pressed` | `light` | `muted` |
| --- | --- | --- | --- | --- | --- |
| `primary` (coffee) | `#6B4A33` | `#5C3F2B` | `#4D3423` | `#EDE1D3` | `#CEB69E` |
| `secondary` (cherry) | `#9C2B34` | `#8A252D` | `#781F26` | `#F3DEDE` | `#DCB0B2` |
| `water` (teal) | `#2F6A60` | `#295D54` | `#234F48` | `#DFE9E6` | `#B2CBC6` |
| `warm` (caramel) | `#8A5A16` | `#794E13` | `#694210` | `#EFE4D4` | `#D9C3A0` |

Contrast of each `base` against `surface` / `background` / `surfaceSecondary`:

| Scale | on `surface` | on `background` | on `surfaceSecondary` |
| --- | --- | --- | --- |
| `primary` | 7.53 | 6.98 | 6.45 |
| `secondary` | 7.11 | 6.60 | 6.09 |
| `water` | 5.96 | 5.53 | 5.11 |
| `warm` | 5.62 | 5.21 | 4.81 |

All four clear 4.5:1 on all three surface tiers.

### 4.5 Semantic

| Token | Value | on `surface` |
| --- | --- | --- |
| `success` | `#4C7A52` | 4.74 |
| `successLight` | `#E9ECE2` | — |
| `successBorder` | `#C4D0BF` | — |
| `warning` | `#8A5A16` | 5.62 |
| `warningLight` | `#F1E8D9` | — |
| `warningBorder` | `#DECBA6` | — |
| `error` | `#A8323A` | 6.28 |
| `errorLight` | `#F5E3E3` | — |
| `errorBorder` | `#E5BEBD` | — |
| `onErrorContainer` | `#6E1B22` | — |
| `info` | `#3F6E86` | 5.28 |
| `infoLight` | `#E6EBEC` | — |
| `infoBorder` | `#C0CFD5` | — |

---

## 5. Dark Scheme

### 5.1 Surfaces

A warm espresso-grounds charcoal with a faint cocoa-red cast. Structure mirrors
Coconut's (`#181612` → `#211D18` → `#29241E` → `#332D25`), shifted one step
warmer.

| Token | Value |
| --- | --- |
| `background` | `#171310` |
| `surface` | `#201A15` |
| `surfaceSecondary` | `#28211B` |
| `surfaceTertiary` | `#322921` |
| `surfaceHover` | `#2C251E` |
| `surfacePressed` | `#372E25` |
| `elevation1` | `#221C16` |
| `elevation2` | `#251F18` |
| `elevation3` | `#29221B` |
| `elevation4` | `#2D261E` |
| `elevation5` | `#312A21` |

### 5.2 Borders

| Token | Value |
| --- | --- |
| `border` | `#3E332A` |
| `borderStrong` | `#504336` |
| `borderSubtle` | `#342B23` |

### 5.3 Text

| Token | Value | Contrast on `surface` |
| --- | --- | --- |
| `primary` | `#F7EFE6` | 15.12 |
| `secondary` | `#C8B9AB` | 9.00 |
| `tertiary` | `#9C8A7B` | 5.19 |
| `disabled` | `#6C6055` | 2.82 |
| `onAccent` | `#171310` | — |

> **Note.** `onAccent` is the *dark background colour* in dark mode, not a
> near-white. Coconut sets `onAccent` to `#FFFDF8` in both schemes, which gives
> `onPrimary`-on-`primary` a contrast of only 2.59 in its dark scheme. Because
> Cherry's brand `base` values are light in dark mode, the on-colour must be
> dark. Do not "fix" this back to a near-white.

### 5.4 Brand scales

In dark mode the brand `base` becomes the light tint, `hover` goes lighter,
`pressed` returns to near-`base`, and `light`/`muted` become deep desaturated
shells. Identical transformation to Coconut, different values.

| Scale | `base` | `hover` | `pressed` | `light` | `muted` |
| --- | --- | --- | --- | --- | --- |
| `primary` (coffee) | `#D9A57C` | `#DEB08B` | `#DAA67E` | `#3D2C20` | `#664934` |
| `secondary` (cherry) | `#DF8A8E` | `#E39699` | `#E08C90` | `#3C2627` | `#643E40` |
| `water` (teal) | `#79C3B6` | `#88CABE` | `#7CC4B8` | `#29322E` | `#3D5550` |
| `warm` (caramel) | `#DEB061` | `#E2B974` | `#DFB264` | `#3D2F1C` | `#644D2A` |

Contrast of each `base` against `surface`: 7.89 / 6.69 / 8.44 / 8.60.
Contrast of `onAccent` (`#171310`) against each `base`: 8.46 / 7.18 / 9.05 / 9.22.

### 5.5 Semantic

| Token | Value | on `surface` |
| --- | --- | --- |
| `success` | `#7DBE86` | 7.85 |
| `successLight` | `#272D22` | — |
| `successBorder` | `#3F523E` | — |
| `warning` | `#DFAE5E` | 8.49 |
| `warningLight` | `#362A1C` | — |
| `warningBorder` | `#65502E` | — |
| `error` | `#E2817D` | 6.29 |
| `errorLight` | `#362420` | — |
| `errorBorder` | `#6A3D38` | — |
| `onErrorContainer` | `#F6BDB8` | — |
| `info` | `#8BBEDA` | 8.59 |
| `infoLight` | `#2A2D2E` | — |
| `infoBorder` | `#3F5866` | — |

---

## 6. MD3 Mapping

`buildCherryTheme` maps the raw tokens onto `MD3Colors` exactly as Coconut
does, with one change:

```
primary          = raw.primary.base          onPrimary        = text.onAccent
secondary        = raw.secondary.base        onSecondary      = text.onAccent
tertiary         = raw.water.base            onTertiary       = text.onAccent
background       = surfaces.background       onBackground     = text.primary
surface          = surfaces.surface          onSurface        = text.primary
surfaceVariant   = surfaces.surfaceSecondary onSurfaceVariant = text.secondary
surfaceDisabled  = borders.borderSubtle      onSurfaceDisabled = text.disabled
error            = semantic.error            onError          = text.onAccent
errorContainer   = semantic.errorLight       onErrorContainer = semantic.onErrorContainer
outline          = borders.border            outlineVariant   = borders.borderSubtle
inverseSurface   = light ? primary.pressed : surfaces.background
inverseOnSurface = light ? text.onAccent : text.primary
inversePrimary   = light ? primary.muted : primary.pressed
shadow/scrim     = #000000
backdrop         = light ? 'rgba(42,33,26,0.5)' : 'rgba(0,0,0,0.7)'
elevation.level0..5 = 'transparent' + surfaces.elevation1..5
```

`onPrimaryContainer` = `raw.primary.pressed` in light, `text.primary` in dark.
Same pattern for `onSecondaryContainer` (from `secondary`) and
`onTertiaryContainer` (from `water`).

Return object additionally carries: `scheme`, `brand`, `surfaces`, `borders`,
`text`, `semantic`, `spacing`, `radii`, `elevation`, `typography`, `chart`.
`chart` holds the **active** scheme's palette (§7).

`roundness: radii.medium`, `animation: { scale: 1 }`, `fonts: buildFontScale()`.

`buildNavigationTheme` maps `primary → brand.primary.base`,
`background → surfaces.background`, `card → surfaces.surface`,
`text → text.primary`, `border → borders.border`,
`notification → semantic.info`, `dark → scheme === 'dark'`.

---

## 7. Chart Palette

Coconut has one `chartPalette`. Cherry has two, because a single bright
set cannot clear 3:1 against a near-white surface without collapsing the
perceptual gaps between series.

```
tokens/chart.ts
├── chartPaletteLight  # marks on oat-beige surfaces
├── chartPaletteDark   # marks on espresso surfaces
└── type ChartColor
```

`buildTheme` picks by scheme; `theme.chart` is always a `readonly string[]` of 8.

**Light series** (all ≥ 5.62:1 on `#FCF9F3`):

| # | Hex | Reads as |
| --- | --- | --- |
| 1 | `#8C4A2F` | Coffee |
| 2 | `#A8323A` | Coffee cherry |
| 3 | `#8A5A16` | Caramel |
| 4 | `#4C6B2E` | Matcha |
| 5 | `#2F6A60` | Teal |
| 6 | `#3A5A8C` | Slate |
| 7 | `#6B3A7A` | Plum |
| 8 | `#9C3B5A` | Rose |

**Dark series** (all ≥ 7.26:1 on `#201A15`):

| # | Hex |
| --- | --- |
| 1 | `#E39A6B` |
| 2 | `#EE8E8E` |
| 3 | `#E0B25C` |
| 4 | `#9CCB6B` |
| 5 | `#6FD0BE` |
| 6 | `#85A8F0` |
| 7 | `#C79AE8` |
| 8 | `#F08CB4` |

**Rules for charts.** A chart that distinguishes series by colour alone is not
acceptable (WCAG 1.4.1). Every multi-series chart must additionally encode series
by at least one of: a direct label on each series, a distinct marker or dash
pattern, or fixed legend order that never changes between renders. Charts default
to at most 5 series; the 6th–8th entries exist for stacked compositions and
method-coloured scatter points, which are position-separated anyway.

---

## 8. Contrast Verification (mandatory before any colour change)

Every colour pair in this document was verified with the WCAG 2.1 relative
luminance formula. Current state: **0 failures**.

Thresholds applied: 4.5:1 for text and text-adjacent glyphs; 3.0:1 for UI
component boundaries, focus indicators, chart marks and brand-on-container
combinations.

Coconut's palette, for comparison, currently fails AA on five light-mode pairs —
`water` 2.88, `warm` 3.07, `text.tertiary` 4.12, `warning` 3.93, `info` 4.32 —
and on `onAccent`-on-`primary` in dark mode at 2.59. Cherry does not
inherit these. Do not copy a colour across from Coconut without re-checking it.

Re-verify with a throwaway script before committing any change:

```js
const lin = c => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
const lum = h => { const [r, g, b] = [1, 3, 5].map(i => lin(parseInt(h.substr(i, 2), 16) / 255));
                   return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)];
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
```

---

## 9. Spacing, Radii, Elevation, Typography

Copied from Coconut unchanged. This is what makes the two apps feel identical.

### 9.1 Spacing

`spacing[1]=4, [2]=8, [3]=12, [4]=16, [5]=20, [6]=24, [7]=32, [8]=40, [9]=48, [10]=64`

Screen horizontal padding is always `spacing[4]` (16). Card inner padding is
`spacing[4]`. Gap between stacked cards is `spacing[3]` (12) or `spacing[4]` (16).
Gap between sections is `spacing[6]` (24).

### 9.2 Radii

`small: 6, medium: 10, large: 14, xl: 18, dialog: 12, pill: 999`

- Chips and badges: `pill`
- Cards: `large`
- Sheets and dialogs: `dialog`
- Nested thumbnails and avatars: `medium`
- Small inline elements: `small`

**Never use a percentage border radius.** `theme.radii.dialog` must be used for
every dialog via the `AppDialog` wrapper — Coconut had a release note precisely
because hand-rolled dialogs were "too rounded" (see Coconut `release-plan.md`
0.2.0).

### 9.3 Elevation

`buildElevation(shadowColor)` returns `level0..level5`; shadow colour is
`brand.primary.base` in light mode and `#000000` in dark mode.

| Level | Offset Y | Opacity | Radius | Android elevation |
| --- | --- | --- | --- | --- |
| 0 | 0 | 0 | 0 | 0 |
| 1 | 1 | 0.08 | 2 | 1 |
| 2 | 1 | 0.10 | 3 | 2 |
| 3 | 2 | 0.12 | 6 | 4 |
| 4 | 2 | 0.14 | 8 | 6 |
| 5 | 3 | 0.16 | 10 | 8 |

Usage: screen background `level0`; flat cards `level1`; the FAB and sticky
bottom bars `level3`; dialogs and menus `level5`. Never nest a level-3 card
inside a level-3 card.

### 9.4 Typography

Two scales exist and both must be present.

**`theme.fonts` (MD3Typescale)** — drives every `<Text variant=...>`:

| Variant | Size / Weight / Line | Tracking |
| --- | --- | --- |
| `displayLarge` | 32 / 700 / 38 | 0.2 |
| `displayMedium` | 28 / 700 / 34 | 0.2 |
| `displaySmall` | 24 / 600 / 30 | 0.2 |
| `headlineLarge` | 22 / 600 / 28 | 0.15 |
| `headlineMedium` | 20 / 600 / 26 | 0.15 |
| `headlineSmall` | 18 / 600 / 24 | 0.15 |
| `titleLarge` | 20 / 600 / 26 | 0.15 |
| `titleMedium` | 19 / 600 / 24 | 0.15 |
| `titleSmall` | 16 / 600 / 22 | 0.15 |
| `labelLarge` | 14 / 600 / 20 | 0.15 |
| `labelMedium` | 12 / 600 / 16 | 0.15 |
| `labelSmall` | 11 / 500 / 14 | 0.15 |
| `bodyLarge` | 16 / 400 / 23 | 0.15 |
| `bodyMedium` | 14 / 400 / 20 | 0.15 |
| `bodySmall` | 12 / 500 / 16 | 0.4 |

**`theme.typography` (semantic roles)** — use these for the named slots below:

| Role | Size / Weight / Line | Where |
| --- | --- | --- |
| `screenTitle` | 28 / 700 / 34 | Top of a root tab screen, month/date headline |
| `sectionHeading` | 19 / 650 / 24 | Card titles, group headers inside a screen |
| `body` | 16 / 400 / 23 | Default reading text |
| `secondaryBody` | 14 / 400 / 20 | Supporting text, descriptions |
| `caption` | 12 / 500 / 16 | Units, timestamps, axis labels, helper text |
| `metricValue` | 32 / 700 / 38 | The single hero number on a tab or a hero card |

> `metricValue` is Coconut's `financialValue` under a different name, because the
> numbers here are grams, seconds and ratings, not money. Same numbers.

Weights `650` and `500` are not MD3 legal weights; the `TypeStyle` type allows
`'650'` because these roles are applied with explicit styles rather than through
Paper's `variant` prop. Never feed them to a Paper `variant`.

---

## 10. Semantic Colour Layer

`buildSemanticColors(semanticTokens, onAccent)` returns the names the app actually
uses in components:

```
success, successContainer, onSuccess, successBorder
warning, warningContainer, onWarning, warningBorder
error,   errorContainer,   onError,   errorBorder
info,    infoContainer,    onInfo,    infoBorder
overBudget, goodBudget, delete, deleteContainer
```

Cherry renames the last four to match its domain while keeping the fields:

```
sour,       sourContainer,   onSour,   sourBorder     // a negative extraction verdict
sweet,      sweetContainer,  onSweet,  sweetBorder    // a positive extraction verdict
overBudget -> replaced by   sour
goodBudget -> replaced by   sweet
delete, deleteContainer      unchanged
```

**Rule.** `sour` and `sweet` are the only two colours allowed to express a
judgement about extraction or taste. A brew is `sour` when extraction read as
under-extracted and `sweet` when it read as over-extracted. Every other
positive/negative judgement uses `success` / `error`. Do not invent new semantic
names to express a one-off state — extend `tokens/colors.ts` and this document in
the same commit.

---

## 11. Component Theming Rules

1. **Never hardcode a hex in a component.** Use `theme.colors`, `theme.brand.*`,
   `theme.semantic.*`, `theme.surfaces`, `theme.text`, `theme.borders`.
2. **Every dialog goes through `AppDialog`**, which applies `theme.radii.dialog`.
3. **Every screen uses `ScreenFade`** (Coconut's entrance fade) and scrolls inside
   `KeyboardAwareScrollView`. There are no screens that render a bare `View`.
4. **Stat tiles use `StatCard`** with `Tone = 'neutral' | 'good' | 'bad' | 'attention'`.
   This is Coconut's `StatCard` unchanged in API. `good → semantic.success`,
   `bad → semantic.sour`, `attention → semantic.warning`.
5. **The microphone FAB** is the app's one persistent primary action. It uses
   `brand.primary.base` at rest, `semantic.error` while actively recording, and
   `brand.warm` while a recording is paused. It is the only FAB in the app.
6. **All icons** come from `@expo/vector-icons/MaterialCommunityIcons`.
   `react-native-vector-icons` is forbidden.
7. **Tone must reach icons as well as text.** A value shown in `semantic.sour`
   gets its leading icon in `semantic.sour` too.
8. **No hardcoded `borderRadius: 0`.** Coconut used that once to square off a
   menu-bottom button; it is not a house style. Use the scale.

---

## 12. Iconography

MaterialCommunityIcons outlines throughout, matching Coconut. Reserved glyphs —
reusing one of these for a different meaning is a bug:

| Meaning | Icon |
| --- | --- |
| Overview tab | `home-outline` |
| Log tab | `notebook-outline` |
| Equipment tab | `coffee-maker-outline` |
| Learn tab | `chart-line` |
| Settings tab | `cog-outline` |
| Microphone, idle | `microphone-outline` |
| Microphone, recording | `microphone` |
| Microphone, paused | `microphone-pause` |
| Record new phase | `plus` |
| Stop and review | `check` |
| Discard session | `trash-can-outline` |
| Play brew timer | `play` |
| Pause timer | `pause` |
| Bean | `coffee-bean-outline` |
| Grinder | `grinder-outline` (fallback `cog-8-tooth-outline`) |
| Kettle | `kettle-outline` (fallback `coffee-maker-outline`) |
| Scale | `weight-gram` |
| Temperature | `thermometer` |
| Grind | `tune-variant` |
| Timer | `timer-outline` |
| Water | `water-outline` |
| Ratio | `scale-balance` |
| Rating, 1–5 | `star` / `star-outline` / `star-half-full` |
| Safe mode | `shield-check-outline` |
| Curious mode | `compass-rose` |
| Adventurous mode | `rocket-launch-outline` |
| Insight | `lightbulb-on-outline` |
| Recommendation | `sparkles` |
| Blind spot | `eye-outline` |
| Habit warning | `alert-circle-outline` |
| Cloud AI | `cloud-outline` |
| AI provider key | `key-outline` |
| Backup | `archive-arrow-down-outline` |
| What's new | `star-four-points-outline` |
| About | `information-outline` |
| Tour | `book-open-page-variant-outline` |

---

## 13. Theme Change Checklist

Before proposing any change to this document:

1. Re-run the contrast verification for both schemes; zero failures required.
2. Update §4/§5 tables, `tokens/colors.ts`, and the MD3 mapping if the shape changes.
3. Check the change against both light and dark, never one in isolation.
4. Check the splash screen, adaptive icon background and monochrome icon
   colours — they are static values in `app.json` and must be updated to match
   `background`.
5. Note the change in `release-plan.md`.
