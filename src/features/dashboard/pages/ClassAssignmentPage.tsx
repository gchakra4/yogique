import React, { useEffect, useState } from 'react'
import { Footer } from '../../../shared/components/layout/Footer'
import { Header } from '../../../shared/components/layout/Header'
import MobileShell from '../../../shared/components/ui/MobileShell'
const ClassAssignmentManager = React.lazy(() => import('../components/Modules/ClassAssignmentManager'))

const ClassAssignmentPage: React.FC = () => {
    // Register service worker when this page mounts so the PWA behaviour is scoped to the module
    useEffect(() => {
        // Dynamically import to avoid registering for other pages
        import('../../../serviceWorkerRegistration').then(mod => {
            try {
                mod.registerServiceWorker()
            } catch (e) {
                console.warn('SW registration failed on ClassAssignmentPage', e)
            }
        })
    }, [])

    const [useMobileShell, setUseMobileShell] = useState(false)
    useEffect(() => {
        const detect = () => {
            const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone
            setUseMobileShell(isStandalone || window.innerWidth <= 768)
        }
        detect()
        window.addEventListener('resize', detect)
        return () => window.removeEventListener('resize', detect)
    }, [])

    return (
        <div className="min-h-screen bg-white dark:bg-slate-900">
            <Header />
            <main className="max-w-7xl mx-auto p-6">
                <div className="mb-6">
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-blue-800">Class Assignments</h1>
                    <p className="text-gray-600 mt-2">Create monthly, crash course, or single-class assignments. All assignments require a booking.</p>
                </div>

                {useMobileShell ? (
                    <MobileShell title="Class Assignments">
                        <React.Suspense fallback={<div>Loading class assignments...</div>}>
                            <ClassAssignmentManager />
                        </React.Suspense>
                    </MobileShell>
                ) : (
                    <div className="bg-white p-4 rounded shadow-sm">
                        <React.Suspense fallback={<div>Loading class assignments...</div>}>
                            <ClassAssignmentManager />
                        </React.Suspense>
                    </div>
                )}
            </main>
            <Footer />
        </div>
    )
}

export default ClassAssignmentPage
