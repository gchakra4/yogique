import React, { useEffect, useState } from 'react';
import PRICING_CONFIG from '../config/pricing.config';
import { getRegion, setRegion } from '../utils/getRegion';

const RegionToggle: React.FC<{ region: 'IN' | 'INTL'; onChange: (r: 'IN' | 'INTL') => void }> = ({ region, onChange }) => {
  return (
    <div className="inline-flex bg-slate-100 rounded-full p-1" role="tablist" aria-label="Region toggle">
      <button
        aria-pressed={region === 'IN'}
        onClick={() => onChange('IN')}
        className={`px-4 py-1 rounded-full transition-colors duration-200 focus:outline-none ${region === 'IN' ? 'bg-white shadow' : 'text-slate-600'}`}
      >
        India
      </button>
      <button
        aria-pressed={region === 'INTL'}
        onClick={() => onChange('INTL')}
        className={`ml-1 px-4 py-1 rounded-full transition-colors duration-200 focus:outline-none ${region === 'INTL' ? 'bg-white shadow' : 'text-slate-600'}`}
      >
        International
      </button>
    </div>
  );
};

const PriceCard: React.FC<{ title: string; priceLabel: string; ctaHref: string; ctaText?: string }> = ({ title, priceLabel, ctaHref, ctaText = 'Book' }) => (
  <article className="bg-white rounded-xl shadow-md p-6 flex flex-col justify-between">
    <div>
      <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
      <div className="mt-4 text-3xl font-bold text-slate-900">{priceLabel}</div>
    </div>
    <div className="mt-6">
      <a href={ctaHref} className="inline-block w-full text-center bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-400">
        {ctaText}
      </a>
    </div>
  </article>
);

const PricingPage: React.FC = () => {
  const [region, setRegionState] = useState<'IN' | 'INTL'>(() => getRegion());

  useEffect(() => {
    // keep local state in sync with cookie (Edge function may set cookie on first load)
    const r = getRegion();
    setRegionState(r);
  }, []);

  const handleToggle = (r: 'IN' | 'INTL') => {
    setRegion(r); // set cookie
    setRegionState(r);
  };

  const cfg = PRICING_CONFIG[region];

  return (
    <main className="min-h-screen bg-slate-50 text-slate-800 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <header className="mb-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-extrabold">Pricing</h1>
            <RegionToggle region={region} onChange={handleToggle} />
          </div>
          <p className="mt-3 text-slate-600">Transparent pricing for classes — displayed for {region === 'IN' ? 'India' : 'International'} visitors.</p>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <PriceCard title="Public Group Classes" priceLabel={`${cfg.symbol}${cfg.groupMonthly}`} ctaHref="/book/group" ctaText="Book Group" />
          <PriceCard title="Individual (1-on-1)" priceLabel={`From ${cfg.symbol}${cfg.individualStarting}`} ctaHref="/book/individual" ctaText="Book 1-on-1" />
          <PriceCard title="Private Group (per person)" priceLabel={`From ${cfg.symbol}${cfg.privateGroupStarting}`} ctaHref="/book/private-group" ctaText="Book Private" />
        </section>

        <section className="mt-8 bg-white rounded-lg p-6 shadow-sm">
          <h2 className="text-xl font-semibold">How pricing works</h2>
          <p className="mt-2 text-slate-600">Prices shown are for information only. Final pricing, taxes and any applicable fees are calculated at booking/checkout. Packages, discounts and scheduling options are managed via our dashboard and selected during booking.</p>
        </section>

        <section className="mt-6 bg-white rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-semibold">Refunds & Terms</h3>
          <p className="mt-2 text-slate-600">Our refund policy and full terms are available on the Terms page. <a href="/terms" className="text-emerald-600 hover:underline">Read terms</a></p>
        </section>
      </div>
    </main>
  );
};

export default PricingPage;
