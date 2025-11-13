import { useEffect } from 'react';
import { Link as RouterLink } from 'react-router-dom';

export function Terms(): JSX.Element {
    useEffect(() => {
        document.title = 'Terms of Service — Yogique';
    }, []);

    return (
        <div className="min-h-screen bg-white dark:bg-slate-900 text-gray-900 dark:text-white">
            <header className="bg-gradient-to-r from-indigo-50 to-emerald-50 dark:from-slate-800 dark:to-slate-900 py-16">
                <div className="max-w-5xl mx-auto px-6">
                    <h1 className="mt-4 text-4xl sm:text-5xl font-extrabold tracking-tight">Terms of Service</h1>
                    <p className="mt-3 text-lg text-gray-700 dark:text-slate-300 max-w-3xl">
                        These Terms govern your use of the Yogique website and services. By using the Service you agree to these terms.
                    </p>
                    <div className="mt-4 text-sm bg-white/70 dark:bg-slate-900/60 border border-gray-200 dark:border-slate-700 rounded-md p-3 inline-block">
                        <p className="text-gray-700 dark:text-slate-300">
                            Yogique is a brand/initiative by <span className="font-semibold">Sampurnayogam LLP</span> (registered). Company details: LLPIN: ACS-6592, Registered Office: Flat 3C, 3rd Floor, Annapurna Apartment, 15 Garia Station Road, Kolkata 700084.
                        </p>
                    </div>
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-6 -mt-8">
                <div className="bg-white dark:bg-slate-800 shadow-lg rounded-xl border border-gray-100 dark:border-slate-700 overflow-hidden p-8">
                    <section>
                        <h2>1. Acceptance of Terms</h2>
                        <p className="mt-2 text-sm text-gray-700 dark:text-slate-300">
                            By accessing or using Yogique (the “Service”), you agree to be bound by these Terms of Service and any additional terms posted on the Service.
                        </p>
                    </section>

                    <section className="mt-6">
                        <h2>2. Use of Service</h2>
                        <p className="mt-2 text-sm text-gray-700 dark:text-slate-300">
                            You agree to use the Service in compliance with all applicable laws and these Terms. You may not misuse the Service or attempt to access it using a method other than the interface and instructions we provide.
                        </p>
                    </section>

                    <section className="mt-6">
                        <h2>3. Accounts</h2>
                        <p className="mt-2 text-sm text-gray-700 dark:text-slate-300">
                            Where registration is required, you are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.
                        </p>
                    </section>

                    <section className="mt-6">
                        <h2>4. Purchases and Payments</h2>
                        <p className="mt-2 text-sm text-gray-700 dark:text-slate-300">
                            If you purchase any services or products through the Service, additional terms may apply. All payments are subject to our payment provider terms.
                        </p>
                    </section>

                    <section className="mt-6">
                        <h2>5. Intellectual Property</h2>
                        <p className="mt-2 text-sm text-gray-700 dark:text-slate-300">
                            The Service and its original content are the exclusive property of Yogique and its licensors and are protected by intellectual property laws.
                        </p>
                    </section>

                    <section className="mt-6">
                        <h2>6. Limitation of Liability</h2>
                        <p className="mt-2 text-sm text-gray-700 dark:text-slate-300">
                            To the maximum extent permitted by law, Yogique will not be liable for indirect, incidental, special, consequential or punitive damages arising out of your use of the Service.
                        </p>
                    </section>

                    <section className="mt-6">
                        <h2>7. Changes to Terms</h2>
                        <p className="mt-2 text-sm text-gray-700 dark:text-slate-300">
                            We may modify these Terms from time to time. We will notify users of material changes by posting the updated Terms on this page and updating the "Last updated" date.
                        </p>
                    </section>

                    <section className="mt-6">
                        <h2>8. Contact</h2>
                        <p className="mt-2 text-sm text-gray-700 dark:text-slate-300">
                            For questions about these Terms, contact us at <a href="mailto:namaste@yogique.life" className="text-emerald-600 dark:text-emerald-400 hover:underline">namaste@yogique.life</a>.
                        </p>
                    </section>

                    <div className="mt-8 flex justify-end">
                        <RouterLink to="/privacy" className="text-sm text-gray-600 dark:text-slate-300 hover:underline">View Privacy Policy</RouterLink>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default Terms;

