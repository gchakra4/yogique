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
                        <h2>8. Cancellation &amp; Refund Policy</h2>
                        <div className="mt-2 text-sm text-gray-700 dark:text-slate-300">
                            <h3 className="font-semibold">8.1 Monthly Class Packages</h3>
                            <p className="mt-2 font-semibold">8.1.1 Full Refund Before Start</p>
                            <p className="mt-1">You may cancel your booking at any time before the first scheduled class of the monthly package. In this case, you are eligible for a 100% refund. The monthly class schedule is published 2 days prior to the first class of the package.</p>

                            <p className="mt-3 font-semibold">8.1.2 Partial Refund After Start</p>
                            <p className="mt-1">Once the first class of the monthly package has taken place, the following refund rules apply:</p>
                            <ul className="list-disc ml-5 mt-2">
                                <li>If you cancel within 7 days from the date of the first class, you will receive a 75% refund.</li>
                                <li>If you cancel within 15 days from the date of the first class, you will receive a 50% refund.</li>
                                <li>If you cancel after 15 days from the date of the first class, no refund will be provided.</li>
                            </ul>

                            <h3 className="font-semibold mt-4">8.2 Crash Courses (Short-Term / Intensive Programs)</h3>
                            <p className="mt-2">8.2.1 Full Refund Before Start — You may cancel and receive a 100% refund if the cancellation is made before the crash course begins.</p>
                            <p className="mt-2">8.2.2 No Refund After Start — Due to the short and intensive nature of crash courses, no refunds are offered once the course has started, regardless of attendance or the number of sessions completed or remaining.</p>

                            <h3 className="font-semibold mt-4">8.3 Cancellation Procedure and Refund Timelines</h3>
                            <div className="mt-2">
                                <p>To cancel a booking, you must contact Yogique through the official booking channels (website, email, or the method used during booking).</p>
                                <p className="mt-2">Cancellations must be submitted before the relevant deadlines mentioned above for eligibility.</p>
                                <p className="mt-2">Approved refunds will be processed within 7–10 business days to the original method of payment.</p>
                                <p className="mt-2">By booking any package or course, you acknowledge and agree to this Cancellation &amp; Refund Policy.</p>
                            </div>
                        </div>
                    </section>

                    <section className="mt-6">
                        <h2>9. Shipping</h2>
                        <p className="mt-2 text-sm text-gray-700 dark:text-slate-300">
                            For physical products or materials ordered through Yogique, we ship via third-party carriers. Shipping times, costs, and available destinations depend on the product and your selected shipping method at checkout. Estimated delivery times are provided during purchase and are subject to carrier delays beyond our control.
                        </p>
                        <div className="mt-2 text-sm text-gray-700 dark:text-slate-300">
                            <p>We may collect your shipping address and contact number to deliver orders and provide tracking information. By placing an order you authorize Yogique to share necessary order and contact details with delivery partners to fulfill the shipment.</p>
                            <p className="mt-2">If a shipment is returned or undeliverable due to incorrect address information provided by you, additional shipping or handling fees may apply before reshipment. For shipping-specific questions, contact us at <a href="mailto:namaste@yogique.life" className="text-emerald-600 dark:text-emerald-400 hover:underline">namaste@yogique.life</a>.</p>
                        </div>
                    </section>

                    <section className="mt-6">
                        <h2>10. Contact</h2>
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

