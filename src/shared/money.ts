// Integer paisa only (1 rupee = 100 paisa). All money arithmetic in the app goes through this file.
import { localizeDigits, type Lang, type NumeralSystem } from './numerals';

export type Paisa = number;
export const PAISA_PER_RUPEE = 100;

/** halfUp/up round away from zero; down rounds toward zero; halfEven is banker's rounding. */
export type RoundingMode = 'halfUp' | 'halfEven' | 'down' | 'up';

export class RoundingNotConfiguredError extends Error {
  constructor(what: string) {
    super(`${what} needs rounding but no rounding mode is configured`);
    this.name = 'RoundingNotConfiguredError';
  }
}

export function assertPaisa(value: number, label = 'amount'): Paisa {
  if (!Number.isSafeInteger(value)) throw new TypeError(`${label} must be a whole number of paisa, got ${value}`);
  return value;
}

const fromBig = (value: bigint, label: string): Paisa => assertPaisa(Number(value), label);

export function sum(amounts: readonly Paisa[]): Paisa {
  return assertPaisa(
    amounts.reduce((acc, a) => acc + assertPaisa(a), 0),
    'sum',
  );
}

export function multiply(unitPrice: Paisa, qty: number): Paisa {
  assertPaisa(unitPrice, 'unit price');
  if (!Number.isSafeInteger(qty)) throw new TypeError(`quantity must be a whole number, got ${qty}`);
  return fromBig(BigInt(unitPrice) * BigInt(qty), 'line total');
}

/**
 * numerator / denominator with explicit rounding. BigInt keeps large intermediates exact.
 * `mode` null is allowed only when the division is exact; otherwise the caller must configure one.
 */
export function divideRounded(
  numerator: bigint,
  denominator: bigint,
  mode: RoundingMode | null,
  what = 'division',
): bigint {
  if (denominator <= 0n) throw new RangeError('denominator must be positive');
  const negative = numerator < 0n;
  const n = negative ? -numerator : numerator;
  const q = n / denominator;
  const r = n % denominator;
  if (r === 0n) return negative ? -q : q;
  if (mode === null) throw new RoundingNotConfiguredError(what);
  const twice = 2n * r;
  const roundUp =
    mode === 'up' ||
    (mode === 'halfUp' && twice >= denominator) ||
    (mode === 'halfEven' && (twice > denominator || (twice === denominator && q % 2n === 1n)));
  const result = roundUp ? q + 1n : q;
  return negative ? -result : result;
}

function assertBasisPoints(bp: number): void {
  if (!Number.isSafeInteger(bp) || bp < 0)
    throw new RangeError(`basis points must be a non-negative integer, got ${bp}`);
}

/** amount × bp / 10 000. 1 bp = 0.01%. */
export function applyBasisPoints(amount: Paisa, bp: number, mode: RoundingMode | null, what = 'percentage'): Paisa {
  assertPaisa(amount);
  assertBasisPoints(bp);
  return fromBig(divideRounded(BigInt(amount) * BigInt(bp), 10_000n, mode, what), what);
}

/** The part of `amount` that is tax, when `amount` already includes tax at `bp`. */
export function includedPortion(amount: Paisa, bp: number, mode: RoundingMode | null, what = 'included tax'): Paisa {
  assertPaisa(amount);
  assertBasisPoints(bp);
  return fromBig(divideRounded(BigInt(amount) * BigInt(bp), 10_000n + BigInt(bp), mode, what), what);
}

/** Rounds to a multiple of `unit` paisa (e.g. 100 for whole rupees). */
export function roundToUnit(amount: Paisa, unit: Paisa, mode: RoundingMode): Paisa {
  assertPaisa(amount);
  if (!Number.isSafeInteger(unit) || unit <= 0)
    throw new RangeError(`unit must be a positive whole number of paisa, got ${unit}`);
  return fromBig(divideRounded(BigInt(amount), BigInt(unit), mode) * BigInt(unit), 'rounded amount');
}

/**
 * Splits `total` across `weights` by largest remainder so the parts always add up to `total` exactly.
 * Ties go to the earlier index.
 */
export function allocate(total: Paisa, weights: readonly number[]): Paisa[] {
  assertPaisa(total, 'total');
  if (weights.length === 0) throw new RangeError('allocate needs at least one weight');
  for (const w of weights)
    if (!Number.isSafeInteger(w) || w < 0) throw new RangeError(`weights must be non-negative integers, got ${w}`);
  const weightSum = weights.reduce((a, w) => a + BigInt(w), 0n);
  if (weightSum === 0n) {
    if (total !== 0) throw new RangeError('cannot allocate a non-zero total over zero weights');
    return weights.map(() => 0);
  }
  const sign = total < 0 ? -1n : 1n;
  const abs = BigInt(Math.abs(total));
  const parts = weights.map((w, i) => ({ i, base: (abs * BigInt(w)) / weightSum, rem: (abs * BigInt(w)) % weightSum }));
  let left = abs - parts.reduce((a, p) => a + p.base, 0n);
  const byRemainder = [...parts].sort((a, b) => (b.rem > a.rem ? 1 : b.rem < a.rem ? -1 : a.i - b.i));
  for (const p of byRemainder) {
    if (left === 0n) break;
    p.base += 1n;
    left -= 1n;
  }
  return parts.map((p) => fromBig(p.base * sign, 'allocated part'));
}

export function splitEqually(total: Paisa, people: number): Paisa[] {
  if (!Number.isSafeInteger(people) || people < 1)
    throw new RangeError(`people must be a positive integer, got ${people}`);
  return allocate(
    total,
    Array.from({ length: people }, () => 1),
  );
}

/** Parses typed rupees ("1,250.5", "१२५०") into paisa. Returns null for anything that is not a non-negative amount. */
export function parseRupees(input: string): Paisa | null {
  const text = localizeDigits(input.trim(), 'latn').replace(/,/g, '');
  const match = /^(\d+)(?:\.(\d{1,2}))?$/.exec(text);
  if (!match) return null;
  const rupees = BigInt(match[1] as string);
  const paisa = BigInt(((match[2] ?? '') + '00').slice(0, 2));
  const value = Number(rupees * 100n + paisa);
  return Number.isSafeInteger(value) ? value : null;
}

/** Average of `count` amounts for reports (half up: a display figure, never billed). 0 when there are none. */
export function averagePaisa(total: Paisa, count: number): Paisa {
  assertPaisa(total);
  if (!Number.isSafeInteger(count) || count < 0) throw new RangeError(`count must be a whole number, got ${count}`);
  return count === 0 ? 0 : Number(divideRounded(BigInt(total), BigInt(count), 'halfUp', 'average'));
}

/** Paisa back into what a person would type: 18000 → "180", 1250 → "12.50". The inverse of parseRupees. */
export function toRupeeInput(amount: Paisa): string {
  assertPaisa(amount);
  const paisa = amount % PAISA_PER_RUPEE;
  return String((amount - paisa) / PAISA_PER_RUPEE) + (paisa ? '.' + String(paisa).padStart(2, '0') : '');
}

// [D-6] Prefixes follow the design system pending confirmation.
export const RUPEE_PREFIX: Readonly<Record<Lang, string>> = { en: 'Rs.', ne: 'रु.' };

/** Lakh grouping: 1,00,000. */
function groupLakh(digits: string): string {
  if (digits.length <= 3) return digits;
  return digits.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + digits.slice(-3);
}

export type MoneyFormat = { lang: Lang; numerals: NumeralSystem };

/** "1,250" / "१,२५०.५०": the number alone, for table columns under a heading. Render boundary only. */
export function formatAmount(amount: Paisa, { numerals }: Pick<MoneyFormat, 'numerals'>): string {
  assertPaisa(amount);
  const abs = Math.abs(amount);
  const paisa = abs % PAISA_PER_RUPEE;
  const body =
    groupLakh(String(Math.floor(abs / PAISA_PER_RUPEE))) + (paisa ? '.' + String(paisa).padStart(2, '0') : '');
  return (amount < 0 ? '−' : '') + localizeDigits(body, numerals);
}

/** "Rs.1,250" / "रु.१,२५०.५०". Paisa are shown only when non-zero. Render boundary only. */
export function formatMoney(amount: Paisa, { lang, numerals }: MoneyFormat): string {
  assertPaisa(amount);
  const abs = Math.abs(amount);
  const rupees = Math.floor(abs / PAISA_PER_RUPEE);
  const paisa = abs % PAISA_PER_RUPEE;
  const body = groupLakh(String(rupees)) + (paisa ? '.' + String(paisa).padStart(2, '0') : '');
  return (amount < 0 ? '−' : '') + RUPEE_PREFIX[lang] + localizeDigits(body, numerals);
}
