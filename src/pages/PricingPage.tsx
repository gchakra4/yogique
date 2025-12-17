import React, { useEffect, useState } from 'react';
import PRICING_CONFIG from '../config/pricing.config';
import { useAuth } from '../features/auth/contexts/AuthContext';
import { getRegion, setRegion } from '../utils/getRegion';

const RegionToggle: React.FC<{ region: 'IN' | 'INTL'; onChange: (r: 'IN' | 'INTL') => void }> = ({ region, onChange }) => {
    return (
        <div className="inline-flex bg-slate-100 dark:bg-slate-800 rounded-full p-1" role="tablist" aria-label="Region toggle">
            <button
                aria-pressed={region === 'IN'}
                onClick={() => onChange('IN')}
                className={`px-4 py-1 rounded-full transition-colors duration-200 focus:outline-none ${region === 'IN' ? 'bg-white dark:bg-slate-700 shadow' : 'text-slate-600 dark:text-slate-400'}`}
            >
                India
            </button>
            <button
                aria-pressed={region === 'INTL'}
                onClick={() => onChange('INTL')}
                className={`ml-1 px-4 py-1 rounded-full transition-colors duration-200 focus:outline-none ${region === 'INTL' ? 'bg-white dark:bg-slate-700 shadow' : 'text-slate-600 dark:text-slate-400'}`}
            >
                International
            </button>
        </div>
    );
};

const PriceCard: React.FC<{ title: string; priceLabel: string; ctaHref: string; ctaText?: string }> = ({ title, priceLabel, ctaHref, ctaText = 'Book' }) => (
    <article className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6 flex flex-col justify-between border border-slate-200 dark:border-slate-700">
        <div>
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">{title}</h3>
            <div className="mt-4 text-3xl font-bold text-slate-900 dark:text-white">{priceLabel}</div>
        </div>
        <div className="mt-6">
            <a href={ctaHref} className="inline-block w-full text-center bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-400">
                {ctaText}
            </a>
        </div>
    </article>
);

const PrivateGroupCard: React.FC<{ symbol: string; price2: number | string; price3Plus: number | string; ctaHref: string }> = ({ symbol, price2, price3Plus, ctaHref }) => (
    <article className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6 border border-slate-200 dark:border-slate-700">
        <div>
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Private Group</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Per person • Max 5 people</p>

            <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">2 people</span>
                    <span className="text-xl font-bold text-slate-900 dark:text-white">{symbol}{price2}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
                    <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">3-5 people</span>
                    <span className="text-xl font-bold text-emerald-900 dark:text-emerald-100">{symbol}{price3Plus}</span>
                </div>
            </div>
        </div>
        <div className="mt-6">
            <a href={ctaHref} className="inline-block w-full text-center bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-400">
                Book Private
            </a>
        </div>
    </article>
);

const PricingPage: React.FC = () => {
    const [region, setRegionState] = useState<'IN' | 'INTL'>(() => getRegion());
    const { userRoles } = useAuth();

    // Check if user is admin or super_admin
    const canToggleRegion = userRoles.includes('admin') || userRoles.includes('super_admin');

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
        <main className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 py-8 px-4">
            <div className="max-w-4xl mx-auto">
                <header className="mb-6">
                    <div className="flex items-center justify-between">
                        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">Pricing</h1>
                        {canToggleRegion && <RegionToggle region={region} onChange={handleToggle} />}
                    </div>
                    <p className="mt-3 text-slate-600 dark:text-slate-400">Transparent pricing for classes. All prices shown in {region === 'IN' ? 'INR (₹)' : 'USD ($)'}.</p>
                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 italic">
                        * These are starting prices. Customized packages are available. Reach out to us for personalized pricing.
                    </p>
                </header>

                <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <PriceCard title="Public Group Classes" priceLabel={`${cfg.symbol}${cfg.groupMonthly}`} ctaHref="/book/group" ctaText="Book Group" />
                    <PriceCard title="Individual (1-on-1)" priceLabel={`From ${cfg.symbol}${cfg.individualStarting}`} ctaHref="/book/individual" ctaText="Book 1-on-1" />
                    <PrivateGroupCard symbol={cfg.symbol} price2={cfg.privateGroup2People} price3Plus={cfg.privateGroup3Plus} ctaHref="/book/private-group" />
                </section>

                <section className="mt-8 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-6">
                    <h2 className="text-lg font-semibold text-amber-900 dark:text-amber-200">Important Pricing Information</h2>
                    <ul className="mt-3 space-y-2 text-sm text-amber-800 dark:text-amber-300">
                        <li>• Prices shown are starting prices and may vary based on package selection and booking conditions</li>
                        <li>• All prices are inclusive of taxes and applicable fees</li>
                        <li>• Customized packages and group discounts are available — contact us for tailored pricing</li>
                        <li>• Final pricing is confirmed at checkout based on your specific requirements</li>
                    </ul>
                </section>

                <section className="mt-6 bg-white dark:bg-slate-800 rounded-lg p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                    <h2 className="text-xl font-semibold text-slate-900 dark:text-white">How pricing works</h2>
                    <p className="mt-2 text-slate-600 dark:text-slate-400">Prices shown are for information only. Final pricing is confirmed at booking/checkout based on your selected package and any applicable discounts. All packages, discounts and scheduling options are managed via our dashboard and selected during booking.</p>
                </section>

                <section className="mt-6 bg-white dark:bg-slate-800 rounded-lg p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Refunds & Terms</h3>
                    <p className="mt-2 text-slate-600 dark:text-slate-400">Our refund policy and full terms are available on the Terms page. <a href="/terms" className="text-emerald-600 dark:text-emerald-400 hover:underline">Read terms</a></p>
                </section>
            </div>
        </main>
    );
};

export default PricingPage;
