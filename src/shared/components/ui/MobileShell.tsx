import React from 'react'

interface MobileShellProps {
    title?: string
    children: React.ReactNode
}

export const MobileShell: React.FC<MobileShellProps> = ({ title = 'App', children }) => {
    return (
        <div className="min-h-screen bg-white dark:bg-slate-900 flex flex-col">
            <header className="flex items-center justify-between px-4 py-3 bg-white dark:bg-slate-800 border-b dark:border-slate-700">
                <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 bg-teal-500 rounded-lg flex items-center justify-center text-white font-bold">YQ</div>
                    <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</div>
                </div>
                <div className="text-sm text-gray-500">Admin</div>
            </header>

            <main className="flex-1 overflow-auto p-4">{children}</main>

            <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-800 border-t dark:border-slate-700 p-2">
                <div className="max-w-3xl mx-auto flex items-center justify-between">
                    <button className="flex-1 mx-1 px-3 py-2 bg-white dark:bg-slate-900 border rounded text-sm">Back</button>
                    <button className="flex-1 mx-1 px-3 py-2 bg-blue-600 text-white rounded text-sm">Create</button>
                    <button className="flex-1 mx-1 px-3 py-2 bg-white dark:bg-slate-900 border rounded text-sm">Menu</button>
                </div>
            </nav>
        </div>
    )
}

export default MobileShell
