export interface SurfaceColors {
  readonly background: string;
  readonly surface: string;
  readonly surfaceSecondary: string;
  readonly surfaceTertiary: string;
  readonly surfaceHover: string;
  readonly surfacePressed: string;
  readonly elevation1: string;
  readonly elevation2: string;
  readonly elevation3: string;
  readonly elevation4: string;
  readonly elevation5: string;
}

export interface BorderColors {
  readonly border: string;
  readonly borderStrong: string;
  readonly borderSubtle: string;
}

export interface TextColors {
  readonly primary: string;
  readonly secondary: string;
  readonly tertiary: string;
  readonly disabled: string;
  readonly onAccent: string;
}

export interface BrandScale {
  readonly base: string;
  readonly hover: string;
  readonly pressed: string;
  readonly light: string;
  readonly muted: string;
}

export interface SemanticTokens {
  readonly success: string;
  readonly successLight: string;
  readonly successBorder: string;
  readonly warning: string;
  readonly warningLight: string;
  readonly warningBorder: string;
  readonly error: string;
  readonly errorLight: string;
  readonly errorBorder: string;
  readonly onErrorContainer: string;
  readonly info: string;
  readonly infoLight: string;
  readonly infoBorder: string;
}

export interface ColorTokens {
  readonly surfaces: SurfaceColors;
  readonly borders: BorderColors;
  readonly text: TextColors;
  readonly primary: BrandScale;
  readonly secondary: BrandScale;
  readonly water: BrandScale;
  readonly warm: BrandScale;
  readonly semantic: SemanticTokens;
}

export const lightColors: ColorTokens = {
  surfaces: {
    background: '#F6F0E6',
    surface: '#FCF9F3',
    surfaceSecondary: '#EFE7DA',
    surfaceTertiary: '#E6DAC8',
    surfaceHover: '#F3ECE1',
    surfacePressed: '#E1D3BF',
    elevation1: '#FAF5EC',
    elevation2: '#F6F0E6',
    elevation3: '#F2EBDE',
    elevation4: '#EEE5D5',
    elevation5: '#EADFCC',
  },
  borders: {
    border: '#E2D3BE',
    borderStrong: '#CBB79C',
    borderSubtle: '#EDE3D5',
  },
  text: {
    primary: '#2A211A',
    secondary: '#5C4E42',
    tertiary: '#7A6A5B',
    disabled: '#A99B8C',
    onAccent: '#FFFDF9',
  },
  primary: {
    base: '#6B4A33',
    hover: '#5C3F2B',
    pressed: '#4D3423',
    light: '#EDE1D3',
    muted: '#CEB69E',
  },
  secondary: {
    base: '#9C2B34',
    hover: '#8A252D',
    pressed: '#781F26',
    light: '#F3DEDE',
    muted: '#DCB0B2',
  },
  water: {
    base: '#2F6A60',
    hover: '#295D54',
    pressed: '#234F48',
    light: '#DFE9E6',
    muted: '#B2CBC6',
  },
  warm: {
    base: '#8A5A16',
    hover: '#794E13',
    pressed: '#694210',
    light: '#EFE4D4',
    muted: '#D9C3A0',
  },
  semantic: {
    success: '#4C7A52',
    successLight: '#E9ECE2',
    successBorder: '#C4D0BF',
    warning: '#8A5A16',
    warningLight: '#F1E8D9',
    warningBorder: '#DECBA6',
    error: '#A8323A',
    errorLight: '#F5E3E3',
    errorBorder: '#E5BEBD',
    onErrorContainer: '#6E1B22',
    info: '#3F6E86',
    infoLight: '#E6EBEC',
    infoBorder: '#C0CFD5',
  },
};

export const darkColors: ColorTokens = {
  surfaces: {
    background: '#171310',
    surface: '#201A15',
    surfaceSecondary: '#28211B',
    surfaceTertiary: '#322921',
    surfaceHover: '#2C251E',
    surfacePressed: '#372E25',
    elevation1: '#221C16',
    elevation2: '#251F18',
    elevation3: '#29221B',
    elevation4: '#2D261E',
    elevation5: '#312A21',
  },
  borders: {
    border: '#3E332A',
    borderStrong: '#504336',
    borderSubtle: '#342B23',
  },
  text: {
    primary: '#F7EFE6',
    secondary: '#C8B9AB',
    tertiary: '#9C8A7B',
    disabled: '#6C6055',
    onAccent: '#171310',
  },
  primary: {
    base: '#D9A57C',
    hover: '#DEB08B',
    pressed: '#DAA67E',
    light: '#3D2C20',
    muted: '#664934',
  },
  secondary: {
    base: '#DF8A8E',
    hover: '#E39699',
    pressed: '#E08C90',
    light: '#3C2627',
    muted: '#643E40',
  },
  water: {
    base: '#79C3B6',
    hover: '#88CABE',
    pressed: '#7CC4B8',
    light: '#29322E',
    muted: '#3D5550',
  },
  warm: {
    base: '#DEB061',
    hover: '#E2B974',
    pressed: '#DFB264',
    light: '#3D2F1C',
    muted: '#644D2A',
  },
  semantic: {
    success: '#7DBE86',
    successLight: '#272D22',
    successBorder: '#3F523E',
    warning: '#DFAE5E',
    warningLight: '#362A1C',
    warningBorder: '#65502E',
    error: '#E2817D',
    errorLight: '#362420',
    errorBorder: '#6A3D38',
    onErrorContainer: '#F6BDB8',
    info: '#8BBEDA',
    infoLight: '#2A2D2E',
    infoBorder: '#3F5866',
  },
};
