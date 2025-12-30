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
                    <p className="text-gray-600 mt-2">Create monthly, crash course, or single-class assignments. All assignments require a booking.</p>
                </div>

                <div className="bg-white p-4 rounded shadow-sm">
                    <React.Suspense fallback={<div>Loading class assignments...</div>}>
                        <ClassAssignmentManager />
                    </React.Suspense>
                </div>
            </main>
            <Footer />
        </div>
    )
}

export default ClassAssignmentPage
