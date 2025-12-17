export type IndividualPackage = {
  id: string;
  label: string;
  price: number; // price as display number (e.g., 5199 means ₹5,199 or 69.99 USD)
};

export type PrivateGroupDiscount = {
  people: number; // 2 => 2 people, 3 => 3+ people
  discountPercent: number;
};

export type PricingConfig = {
  region: 'IN' | 'ROW';
  currency: string; // display currency code or symbol
  publicGroupPrice: number;
  individualPackages: IndividualPackage[];
  privateGroupDiscounts: PrivateGroupDiscount[];
  notes?: string[];
};

export const PRICING: Record<'IN' | 'ROW', PricingConfig> = {
  IN: {
    region: 'IN',
    currency: 'INR',
    publicGroupPrice: 1599,
    individualPackages: [
      { id: 'ind-10', label: '10 classes', price: 5199 },
      { id: 'ind-12', label: '12 classes', price: 6299 },
    ],
    privateGroupDiscounts: [
      { people: 2, discountPercent: 20 },
      { people: 3, discountPercent: 30 },
    ],
    notes: ['Covers gateway fees and refund leakage; psychological pricing.'],
  },
  ROW: {
    region: 'ROW',
    currency: 'USD',
    publicGroupPrice: 19.99,
    individualPackages: [
      { id: 'ind-10', label: '10 classes', price: 69.99 },
      { id: 'ind-12', label: '12 classes', price: 84.99 },
    ],
    privateGroupDiscounts: [
      { people: 2, discountPercent: 20 },
      { people: 3, discountPercent: 30 },
    ],
  },
};

export default PRICING;
