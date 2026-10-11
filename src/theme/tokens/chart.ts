export const chartPaletteLight: readonly string[] = [
  '#8C4A2F',
  '#A8323A',
  '#8A5A16',
  '#4C6B2E',
  '#2F6A60',
  '#3A5A8C',
  '#6B3A7A',
  '#9C3B5A',
];

export const chartPaletteDark: readonly string[] = [
  '#E39A6B',
  '#EE8E8E',
  '#E0B25C',
  '#9CCB6B',
  '#6FD0BE',
  '#85A8F0',
  '#C79AE8',
  '#F08CB4',
];

export type ChartColor =
  | (typeof chartPaletteLight)[number]
  | (typeof chartPaletteDark)[number];
