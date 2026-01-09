import React from 'react'

interface MobileShellProps {
    title?: string
    children: React.ReactNode
}

export const MobileShell: React.FC<MobileShellProps> = ({ title = 'App', children }) => {
    return (
        <div className="min-h-screen bg-white dark:bg-slate-900 flex flex-col">
            <header className="sticky top-0 z-40 flex items-center justify-between px-4 py-3 bg-white dark:bg-slate-800 border-b dark:border-slate-700">
                <div className="flex items-center space-x-3">
                    <button className="w-9 h-9 bg-transparent rounded-lg flex items-center justify-center text-gray-700 dark:text-gray-200">
                        ‹
                    </button>
                    <div className="flex flex-col">
                        <div className="text-base font-semibold text-gray-900 dark:text-gray-100">{title}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Admin</div>
                    </div>
                </div>
                <div className="flex items-center space-x-2">
                    <div className="w-9 h-9 bg-teal-500 rounded-lg flex items-center justify-center text-white font-bold">YQ</div>
                </div>
            </header>

            <main className="flex-1 overflow-auto p-4">{children}</main>

            <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-800 border-t dark:border-slate-700 p-2 md:hidden" style={{paddingBottom: 'env(safe-area-inset-bottom, 12px)'}}>
                <div className="max-w-3xl mx-auto flex items-center justify-between">
                    <button className="flex-1 mx-1 px-4 py-3 bg-white dark:bg-slate-900 border rounded text-sm">Back</button>
                    <button className="flex-1 mx-1 px-4 py-3 bg-blue-600 text-white rounded text-sm">Create</button>
                    <button className="flex-1 mx-1 px-4 py-3 bg-white dark:bg-slate-900 border rounded text-sm">Menu</button>
                </div>
            </nav>
        </div>
    )
}

export default MobileShell
