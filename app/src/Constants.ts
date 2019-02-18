import normalizeText from './normalizeText';

export enum Margin {
  EXTRA_SMALL = normalizeText(5),
  SMALL = normalizeText(10),
  MEDIUM = normalizeText(15),
  LARGE = normalizeText(20)
}

export enum FontSize {
  SMALL = normalizeText(15),
  MEDIUM = normalizeText(18),
  LARGE = normalizeText(20),
  EXTRA_LARGE = normalizeText(30)
}

export enum Color {
  TYNDALE_BLUE = '#38748C',
  WHITE = 'white'
}

export enum FontFamily {
  OPEN_SANS_BOLD = 'open-sans-bold',
  OPEN_SANS_SEMIBOLD = 'open-sans-semibold',
  OPEN_SANS = 'open-sans',
  OPEN_SANS_LIGHT = 'open-sans-light',
  CARDO_BOLD = 'cardo-bold',
  CARDO_ITALIC = 'cardo-italic',
  CARDO = 'cardo'
}
