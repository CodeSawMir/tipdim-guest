export type Lang = 'ne' | 'en';
export type NumeralSystem = 'deva' | 'latn';

const DEVA = '०१२३४५६७८९';

/** Numerals follow the language until the user picks otherwise. */
export const defaultNumerals = (lang: Lang): NumeralSystem => (lang === 'ne' ? 'deva' : 'latn');

/** Rewrites every digit in `text` into the target system; other characters pass through. */
export function localizeDigits(text: string, numerals: NumeralSystem): string {
  return numerals === 'deva'
    ? text.replace(/[0-9]/g, (d) => DEVA.charAt(Number(d)))
    : text.replace(/[०-९]/g, (d) => String(DEVA.indexOf(d)));
}
