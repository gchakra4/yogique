import PRICING, { PricingConfig } from '../config/pricing';

export function getPricingConfig(region?: 'IN' | 'ROW'): PricingConfig {
  if (region === 'IN') return PRICING.IN;
  return PRICING.ROW;
}

/**
 * Apply discount percent to base and round to nearest integer
 */
export function applyDiscount(base: number, discountPercent: number): number {
  return Math.round(base * (1 - discountPercent / 100));
}

/**
 * Psychological rounding used in examples: round up to the next 100 and subtract 1
 * e.g., 4159 -> 4199, 3639 -> 3699
 */
export function psychologicalRound(price: number): number {
  // If price is a decimal (USD case), preserve two decimals and apply similar logic on integer part
  if (!Number.isInteger(price)) {
    const cents = Math.round(price * 100);
    const rounded = Math.ceil(cents / 10000) * 10000 - 1; // nearest 100 dollars in cents then -1 cent
    return Math.round(rounded / 100);
  }
  return Math.ceil(price / 100) * 100 - 1;
}

export function computePrivatePerPerson(base: number, discountPercent: number): number {
  const discounted = applyDiscount(base, discountPercent);
  return psychologicalRound(discounted);
}

export default {
  getPricingConfig,
  applyDiscount,
  psychologicalRound,
  computePrivatePerPerson,
};
