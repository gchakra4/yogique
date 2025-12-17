import React from 'react';
import PRICING from '../config/pricing';
import { computePrivatePerPerson } from '../utils/pricing';

type Props = {
    region?: 'IN' | 'ROW';
};

export const PricingPage: React.FC<Props> = ({ region = 'IN' }) => {
    const cfg = PRICING[region];

    return (
        <main style={{ padding: 24, fontFamily: 'system-ui, sans-serif' }}>
            <header>
                <h1>Pricing</h1>
                <p>Showing prices for: {region === 'IN' ? 'India' : 'International'}</p>
            </header>

            <section style={{ marginTop: 24 }}>
                <h2>Public Group Classes</h2>
                <div style={{ border: '1px solid #e5e7eb', padding: 16, borderRadius: 8 }}>
                    <div style={{ fontSize: 28, fontWeight: 700 }}>
                        {cfg.currency === 'INR' ? '₹' : '$'}{cfg.publicGroupPrice}
                    </div>
                    <ul>
                        <li>Covers gateway fees</li>
                        <li>Covers refund leakage</li>
                        <li>Psychological pricing</li>
                    </ul>
                </div>
            </section>

            <section style={{ marginTop: 24 }}>
                <h2>Individual (1-on-1) Classes</h2>
                <div style={{ display: 'flex', gap: 12 }}>
                    {cfg.individualPackages.map((p) => (
                        <div key={p.id} style={{ border: '1px solid #e5e7eb', padding: 12, borderRadius: 8, minWidth: 180 }}>
                            <div style={{ fontSize: 18, fontWeight: 600 }}>{p.label}</div>
                            <div style={{ fontSize: 22, fontWeight: 700, marginTop: 8 }}>
                                {cfg.currency === 'INR' ? '₹' : '$'}{p.price}
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            <section style={{ marginTop: 24 }}>
                <h2>Private Group (per person)</h2>
                <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 8 }}>
                    <thead>
                        <tr style={{ textAlign: 'left' }}>
                            <th style={{ padding: 8 }}>People</th>
                            {cfg.individualPackages.map((p) => (
                                <th key={p.id} style={{ padding: 8 }}>{p.label}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {cfg.privateGroupDiscounts.map((d) => (
                            <tr key={d.people}>
                                <td style={{ padding: 8 }}>{d.people === 3 ? '3+ people' : `${d.people} people`}</td>
                                {cfg.individualPackages.map((p) => (
                                    <td key={p.id} style={{ padding: 8 }}>
                                        {cfg.currency === 'INR' ? '₹' : '$'}{computePrivatePerPerson(p.price, d.discountPercent)}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </section>

            <section style={{ marginTop: 24 }}>
                <h3>Discounts & Notes</h3>
                <p>Early-bird and referral discounts may apply; final price computed at checkout.</p>
            </section>
        </main>
    );
};

export default PricingPage;
