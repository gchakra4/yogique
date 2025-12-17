export type RegionKey = 'IN' | 'INTL';

export type PricingEntry = {
  currency: string;
  symbol: string;
  groupMonthly: number | string; // display-only
  individualStarting: number | string;
  privateGroup2People: number | string; // Private Group for 2 people (per person)
  privateGroup3Plus: number | string; // Private Group for 3-5 people (per person)
};

export const PRICING_CONFIG: Record<RegionKey, PricingEntry> = {
  IN: {
    currency: 'INR',
    symbol: '₹',
    groupMonthly: 1599, // Public Group
    individualStarting: 5199, // Individual (starting)
    privateGroup2People: 4199, // Private Group for 2 people (per person)
    privateGroup3Plus: 3699, // Private Group for 3-5 people (per person)
  },
  INTL: {
    currency: 'USD',
    symbol: '$',
    groupMonthly: 39, // Public Group
    individualStarting: 149, // Individual
    privateGroup2People: 119, // Private Group for 2 people (per person)
    privateGroup3Plus: 99, // Private Group for 3-5 people (per person)
  },
};

export default PRICING_CONFIG;
