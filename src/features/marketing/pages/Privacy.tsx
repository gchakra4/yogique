import { useEffect } from 'react';
import { Link as RouterLink } from 'react-router-dom';

export function Privacy(): JSX.Element {
    useEffect(() => {
        document.title = 'Privacy Policy — Yogique';
    }, []);

    return (
        <div className="min-h-screen bg-white dark:bg-slate-900 text-gray-900 dark:text-white">
            {/* Hero */}
            <header className="bg-gradient-to-r from-emerald-50 to-blue-50 dark:from-slate-800 dark:to-slate-900 py-16">
                <div className="max-w-5xl mx-auto px-6">
                    <p className="text-sm text-gray-500 dark:text-slate-400">Last updated: August 27, 2025</p>
                    <h1 className="mt-4 text-4xl sm:text-5xl font-extrabold tracking-tight">Privacy Policy</h1>
                    <p className="mt-3 text-lg text-gray-700 dark:text-slate-300 max-w-3xl">
                        This page explains how Yogique collects, uses, and protects your personal information.
                        We aim to be clear and transparent — read the sections below or use the quick links to jump to a topic.
                    </p>
                    <div className="mt-4 text-sm bg-white/70 dark:bg-slate-900/60 border border-gray-200 dark:border-slate-700 rounded-md p-3 inline-block">
                        <p className="text-gray-700 dark:text-slate-300">
                            Yogique is an initiative by <span className="font-semibold">Sampurnayogam LLP</span> (registered). Company details: LLPIN: ACS-6592, Registered Office: Flat 3C, 3rd Floor, Annapurna Apartment, 15 Garia Station Road, Kolkata 700084.
                        </p>
                    </div>
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-6 -mt-8">
                <div className="bg-white dark:bg-slate-800 shadow-lg rounded-xl border border-gray-100 dark:border-slate-700 overflow-hidden">
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 p-8">
                        {/* TOC / Sidebar */}
                        <nav className="lg:col-span-1">
                            <div className="sticky top-6 space-y-4">
                                <h4 className="text-sm font-semibold text-gray-700 dark:text-slate-300">On this page</h4>
                                <ul className="space-y-2 text-sm">
                                    <li><a href="#definitions" className="text-emerald-600 dark:text-emerald-400 hover:underline">Interpretation & Definitions</a></li>
                                    <li><a href="#data-collected" className="text-emerald-600 dark:text-emerald-400 hover:underline">Types of Data Collected</a></li>
                                    <li><a href="#cookies" className="text-emerald-600 dark:text-emerald-400 hover:underline">Tracking & Cookies</a></li>
                                    <li><a href="#third-party-auth" className="text-emerald-600 dark:text-emerald-400 hover:underline">Third-Party Authentication</a></li>
                                    <li><a href="#use" className="text-emerald-600 dark:text-emerald-400 hover:underline">How We Use Data</a></li>
                                    <li><a href="#sharing" className="text-emerald-600 dark:text-emerald-400 hover:underline">Sharing & Transfers</a></li>
                                    <li><a href="#retention" className="text-emerald-600 dark:text-emerald-400 hover:underline">Retention & Deletion</a></li>
                                    <li><a href="#security" className="text-emerald-600 dark:text-emerald-400 hover:underline">Security</a></li>
                                    <li><a href="#user-rights" className="text-emerald-600 dark:text-emerald-400 hover:underline">Your Rights & Data Control</a></li>
                                    <li><a href="#contact" className="text-emerald-600 dark:text-emerald-400 hover:underline">Contact</a></li>
                                </ul>

                                <div className="pt-4 border-t border-gray-100 dark:border-slate-700">
                                    <RouterLink to="/contact" className="inline-block px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-sm">
                                        Contact Us
                                    </RouterLink>
                                </div>
                            </div>
                        </nav>

                        {/* Content */}
                        <article className="prose dark:prose-invert lg:col-span-3 max-w-none">
                            <section id="definitions">
                                <h2>Interpretation and Definitions</h2>
                                <p className="text-sm text-gray-600 dark:text-slate-400">
                                    Capitalized words used below have precise meanings. These definitions apply whether used in singular or plural.
                                </p>

                                <h3 className="mt-4">Definitions</h3>
                                <ul>
                                    <li><strong>Account</strong> — a unique account created to access the Service.</li>
                                    <li><strong>Affiliate</strong> — an entity controlling or controlled by the Company.</li>
                                    <li><strong>Company</strong> — Yogique (referred to as "We", "Us" or "Our").</li>
                                    <li><strong>Cookies</strong> — small files stored on your device to improve experience.</li>
                                    <li><strong>Country</strong> — West Bengal, India.</li>
                                    <li><strong>Device</strong> — any device used to access the Service.</li>
                                    <li><strong>Personal Data</strong> — information identifying an individual.</li>
                                    <li><strong>Service</strong> — the Yogique website and related services (https://yogique.life/).</li>
                                    <li><strong>Service Provider</strong> — third parties who process data on our behalf.</li>
                                    <li><strong>Usage Data</strong> — data collected automatically (IP, browser, pages visited, etc.).</li>
                                    <li><strong>You</strong> — the person or entity using the Service.</li>
                                </ul>
                            </section>

                            <section id="data-collected" className="mt-8">
                                <h2>Types of Data Collected</h2>

                                <h3>Personal Data</h3>
                                <p>
                                    When you use our Service we may ask for identifiable information such as:
                                </p>
                                <ul>
                                    <li>Email address</li>
                                    <li>First and last name</li>
                                </ul>

                                <h3>Usage Data</h3>
                                <p>
                                    Collected automatically: IP address, browser type/version, pages visited, visit timestamps, device identifiers and other diagnostic data. Mobile access may include device model, OS, and mobile browser type.
                                </p>
                            </section>

                            <section id="cookies" className="mt-8">
                                <h2>Tracking Technologies and Cookies</h2>
                                <p>
                                    We use cookies, beacons, tags and scripts to improve and analyze the Service. Cookies may be persistent or session-based.
                                </p>

                                <div className="mt-4">
                                    <h4>Essential Cookies</h4>
                                    <p className="text-sm text-gray-600 dark:text-slate-400">Session cookies that enable core functionality (authentication, account security).</p>
                                </div>

                                <div className="mt-3">
                                    <h4>Cookie Notice / Acceptance</h4>
                                    <p className="text-sm text-gray-600 dark:text-slate-400">Persistent cookies used to remember cookie consent and preferences.</p>
                                </div>

                                <div className="mt-3">
                                    <h4>Functionality Cookies</h4>
                                    <p className="text-sm text-gray-600 dark:text-slate-400">Used to remember settings and preferences for a better experience.</p>
                                </div>
                            </section>

                            <section id="third-party-auth" className="mt-8">
                                <h2>Third-Party Authentication Services</h2>

                                <h3>Google Sign-In/OAuth</h3>
                                <p>
                                    When you choose to sign in using Google OAuth, we collect certain information from your Google account including:
                                </p>
                                <ul>
                                    <li>Email address</li>
                                    <li>Basic profile information (name, profile picture)</li>
                                    <li>Google account identifier</li>
                                </ul>

                                <p>This information is used solely for:</p>
                                <ul>
                                    <li>Account creation and authentication</li>
                                    <li>Providing personalized service experience</li>
                                    <li>Communication related to your account and our services</li>
                                </ul>

                                <p className="mt-3">
                                    We do not store your Google password or have access to other Google account data beyond what you explicitly authorize during the OAuth consent process.
                                </p>
                            </section>

                            <section id="use" className="mt-8">
                                <h2>Use of Your Personal Data</h2>
                                <p>We may use Personal Data to:</p>
                                <ul>
                                    <li>Provide and maintain the Service and monitor usage.</li>
                                    <li>Manage your Account and registration.</li>
                                    <li>Perform contracts related to purchases or services.</li>
                                    <li>Contact you by email, SMS or push notifications when necessary.</li>
                                    <li>Send news, offers and information unless you opt out.</li>
                                    <li>Manage requests and customer support.</li>
                                    <li>Support business transfers (merger, sale of assets) if applicable.</li>
                                    <li>Analyze usage, trends and improve the Service.</li>
                                </ul>
                            </section>

                            <section id="sharing" className="mt-8">
                                <h2>Sharing Your Personal Information</h2>
                                <p>We may share information in limited circumstances:</p>

                                <h3>Service Providers</h3>
                                <p>We may share your Personal Data with Service Providers to monitor and analyze the use of our Service, including but not limited to:</p>
                                <ul>
                                    <li><strong>Google LLC:</strong> For authentication services (Google OAuth/Sign-In), analytics, and cloud services</li>
                                    <li><strong>Hosting providers:</strong> For website hosting and maintenance</li>
                                    <li><strong>Email service providers:</strong> For communication and marketing emails</li>
                                    <li><strong>Analytics providers:</strong> For usage analysis and service improvement</li>
                                </ul>
                                <p className="mt-3">
                                    These Service Providers have access to your Personal Data only to perform these tasks on our behalf and are obligated not to disclose or use it for any other purpose.
                                </p>

                                <h3>Other Sharing</h3>
                                <ul>
                                    <li><strong>Affiliates:</strong> companies under common control that must follow this policy.</li>
                                    <li><strong>Business transfers:</strong> in connection with mergers or acquisitions.</li>
                                    <li><strong>Other users:</strong> when you post to public areas of the Service.</li>
                                    <li><strong>With your consent:</strong> when you agree to it.</li>
                                </ul>
                                <p className="mt-3">
                                    Transfers may occur internationally; we take reasonable steps to protect your data when transferring across jurisdictions.
                                </p>
                            </section>

                            <section id="retention" className="mt-8">
                                <h2>Retention and Deletion</h2>
                                <p>
                                    We retain Personal Data only as long as necessary for the purposes described, to comply with legal obligations, or to resolve disputes and enforce agreements. Usage Data is generally retained for a shorter period unless required for security or legal reasons.
                                </p>
                                <p className="mt-2">
                                    You have the right to request deletion of your Personal Data. You can update or delete data from your Account settings or contact us for assistance.
                                </p>
                            </section>

                            <section id="security" className="mt-8">
                                <h2>Security</h2>
                                <p>
                                    We use commercially reasonable measures to protect your Personal Data, but no online transmission or storage method is 100% secure. Please contact us if you suspect any security issue.
                                </p>
                            </section>

                            <section id="user-rights" className="mt-8">
                                <h2>Your Rights and Data Control</h2>
                                <p>
                                    Depending on your location, you may have the following rights regarding your Personal Data:
                                </p>
                                <ul>
                                    <li><strong>Access:</strong> Request copies of your personal data</li>
                                    <li><strong>Rectification:</strong> Request correction of inaccurate data</li>
                                    <li><strong>Erasure:</strong> Request deletion of your data</li>
                                    <li><strong>Portability:</strong> Request transfer of your data</li>
                                    <li><strong>Restriction:</strong> Request restriction of data processing</li>
                                    <li><strong>Objection:</strong> Object to our processing of your data</li>
                                    <li><strong>Withdraw Consent:</strong> Withdraw consent for data processing</li>
                                </ul>
                                <p className="mt-3">
                                    To exercise these rights, contact us at namaste@yogique.life
                                </p>
                                <p className="mt-3">
                                    <strong>Google Account Data:</strong> If you signed in using Google OAuth, you can also manage your data through your Google account settings and revoke our app's access at any time through your Google Account permissions.
                                </p>
                            </section>

                            <section id="children" className="mt-8">
                                <h2>Children's Privacy</h2>
                                <p>
                                    Our Service is not intended for children under 13. We do not knowingly collect information from children under 13. If we learn we have collected information from a child under 13 without parental consent, we will take steps to delete it.
                                </p>
                            </section>

                            <section id="links" className="mt-8">
                                <h2>Links to Other Websites</h2>
                                <p>
                                    Our Service may contain links to third-party sites. We are not responsible for their content or privacy practices; please review their policies.
                                </p>
                            </section>

                            <section id="changes" className="mt-8">
                                <h2>Changes to this Privacy Policy</h2>
                                <p>
                                    We may update this policy periodically. We will post changes on this page and update the "Last updated" date. Significant changes may be communicated by email when possible.
                                </p>
                            </section>

                            <section id="contact" className="mt-8">
                                <h2>Contact Us (Enhanced)</h2>
                                <p>If you have any questions about this Privacy Policy, your data, or our privacy practices, you can contact us:</p>

                                <div className="mt-4">
                                    <p><strong>Email:</strong> <a href="mailto:namaste@yogique.life" className="text-emerald-600 dark:text-emerald-400 hover:underline">namaste@yogique.life</a></p>
                                    <p><strong>Address:</strong> Flat 3C, 3rd Floor, Annapurna Apartment, 15 Garia Station Road, Kolkata 700084</p>
                                    <p><strong>Response Time:</strong> We aim to respond to privacy inquiries within 7 business days</p>
                                </div>

                                <p className="mt-3">
                                    For Google OAuth related privacy concerns, you may also contact Google directly through their privacy support channels.
                                </p>
                            </section>

                            <div className="mt-8 flex justify-end items-center">
                                <a href="#top" className="text-sm text-gray-600 dark:text-slate-300 hover:underline">Back to top</a>
                            </div>
                        </article>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default Privacy;

