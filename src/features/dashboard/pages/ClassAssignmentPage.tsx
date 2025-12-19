import React from 'react'
import { Footer } from '../../../shared/components/layout/Footer'
import { Header } from '../../../shared/components/layout/Header'
const ClassAssignmentManager = React.lazy(() => import('../components/Modules/ClassAssignmentManager'))

const ClassAssignmentPage: React.FC = () => {
    return (
        <div className="min-h-screen bg-white dark:bg-slate-900">
            <Header />
            <main className="max-w-7xl mx-auto p-6">
                <div className="mb-6">
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-blue-800">Class Assignments</h1>
                    <p className="text-gray-600 mt-2">Create and manage class assignments. Link existing bookings optionally and configure recurrence for billing.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    <aside className="lg:col-span-1 bg-white p-4 rounded shadow-sm">
                        <h2 className="font-semibold mb-2">Quick Actions</h2>
                        <ul className="text-sm text-gray-700 space-y-2">
                            <li>Create a new assignment</li>
                            <li>Link booking (optional)</li>
                            <li>Set recurrence and billing anchor</li>
                        </ul>
                    </aside>

                    <section className="lg:col-span-3 bg-white p-4 rounded shadow-sm">
                        <React.Suspense fallback={<div>Loading class assignments...</div>}>
                            <ClassAssignmentManager />
                        </React.Suspense>
                    </section>
                </div>
            </main>
            <Footer />
        </div>
    )
}

export default ClassAssignmentPage
