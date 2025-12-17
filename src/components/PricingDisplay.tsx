import React from 'react';
import PRICING_CONFIG from '../config/pricing.config';
import { getRegion } from '../utils/getRegion';

const PricingDisplay: React.FC = () => {
    const region = getRegion();
    const p = PRICING_CONFIG[region];

    return (
        <section className="max-w-4xl mx-auto p-6">
            <h1 className="text-3xl font-bold mb-4">Pricing</h1>
            <p className="text-sm text-gray-600 mb-6">Showing prices for: {region === 'IN' ? 'India' : 'International'}</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 border rounded-lg">
                    <h2 className="text-lg font-semibold">Public Group</h2>
                    <div className="mt-2 text-2xl font-bold">{p.symbol}{p.groupMonthly}</div>
                </div>

                <div className="p-4 border rounded-lg">
                    <h2 className="text-lg font-semibold">Individual (starting)</h2>
                    <div className="mt-2 text-2xl font-bold">{p.symbol}{p.individualStarting}</div>
                </div>

                <div className="p-4 border rounded-lg">
                    <h2 className="text-lg font-semibold">Private Group (per person)</h2>
                    <div className="mt-2 text-sm text-gray-600">2 people: {p.symbol}{p.privateGroup2People}</div>
                    <div className="mt-1 text-sm text-gray-600">3-5 people: {p.symbol}{p.privateGroup3Plus}</div>
                </div>
            </div>

            <p className="mt-6 text-sm text-gray-500">Prices shown are for display only. Final price is computed at booking/checkout.</p>
        </section>
    );
};

export default PricingDisplay;
