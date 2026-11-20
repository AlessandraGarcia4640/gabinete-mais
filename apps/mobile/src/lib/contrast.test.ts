import { themes, type ColorTokens } from './theme';

function luminance(color: string) {
  function linear(start: number) {
    const channel = Number.parseInt(color.slice(start, start + 2), 16) / 255;
    return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  }
  return 0.2126 * linear(1) + 0.7152 * linear(3) + 0.0722 * linear(5);
}

function contrast(foreground: string, background: string) {
  const a = luminance(foreground);
  const b = luminance(background);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

type ContrastPair = [foreground: keyof ColorTokens, background: keyof ColorTokens];

const textPairs: ContrastPair[] = [
  ['ink', 'bg'], ['ink', 'surface'], ['ink', 'surfaceSunken'], ['ink', 'surfaceRaised'], ['ink', 'brandSoft'],
  ['inkMuted', 'bg'], ['inkMuted', 'surface'], ['inkMuted', 'surfaceSunken'],
  ['inkSubtle', 'bg'], ['inkSubtle', 'surface'],
  ['brandText', 'bg'], ['brandText', 'surface'], ['brandText', 'brandSoft'],
  ['onBrand', 'brand'], ['onBrand', 'brandHover'], ['onAccent', 'accent'],
  ['accentText', 'bg'], ['accentText', 'surface'], ['accentText', 'accentSoft'],
  ['success', 'surface'], ['success', 'successSoft'],
  ['danger', 'bg'], ['danger', 'surface'], ['danger', 'dangerSoft'], ['onDanger', 'danger'],
  ['info', 'surface'], ['info', 'infoSoft'],
  ['statusAberta', 'infoSoft'], ['statusAndamento', 'accentSoft'],
  ['statusConcluida', 'successSoft'], ['statusCancelada', 'surfaceSunken'],
  ['prioridadeUrgente', 'surface'], ['prioridadeAlta', 'surface'],
  ['prioridadeNormal', 'surface'], ['prioridadeBaixa', 'surface'],
];

const controlPairs: ContrastPair[] = [
  ['borderStrong', 'bg'], ['borderStrong', 'surface'],
  ['focus', 'bg'], ['focus', 'surface'],
];

it('calcula contraste pelas luminâncias relativas', () => {
  expect(contrast('#000000', '#FFFFFF')).toBe(21);
  expect(contrast('#FFFFFF', '#FFFFFF')).toBe(1);
});

describe.each(Object.values(themes))('contraste do tema $name', ({ colors }) => {
  it.each(textPairs)('%s sobre %s atinge 4,5:1', (foreground, background) => {
    expect(contrast(colors[foreground], colors[background])).toBeGreaterThanOrEqual(4.5);
  });

  it.each(controlPairs)('%s sobre %s atinge 3:1', (foreground, background) => {
    expect(contrast(colors[foreground], colors[background])).toBeGreaterThanOrEqual(3);
  });
});
