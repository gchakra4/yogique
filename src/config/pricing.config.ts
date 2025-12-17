export type RegionKey = 'IN' | 'INTL';

export type PricingEntry = {
  currency: string;
  symbol: string;
  groupMonthly: number | string; // display-only
  individualStarting: number | string;
  privateGroupStarting: number | string;
};

export const PRICING_CONFIG: Record<RegionKey, PricingEntry> = {
  IN: {
    currency: 'INR',
    symbol: '₹',
    groupMonthly: 1599, // Public Group
    individualStarting: 5199, // Individual (starting)
    privateGroupStarting: 3699, // Private Group per person (starting)
  },
  INTL: {
    currency: 'USD',
    symbol: '$',
    groupMonthly: 39, // Public Group
    individualStarting: 149, // Individual
    privateGroupStarting: 99, // Private Group per person
  },
};

export default PRICING_CONFIG;
