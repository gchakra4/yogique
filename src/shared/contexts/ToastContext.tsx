import React, { createContext, useCallback, useContext, useMemo, useState } from 'react'

type ToastType = 'success' | 'info' | 'error'

export interface ToastItem {
    id: string
    message: string
    type?: ToastType
    duration?: number
}

interface ToastContextValue {
    toasts: ToastItem[]
    addToast: (toast: Omit<ToastItem, 'id'>) => string
    removeToast: (id: string) => void
    success: (message: string, opts?: { duration?: number }) => string
    info: (message: string, opts?: { duration?: number }) => string
    error: (message: string, opts?: { duration?: number }) => string
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined)

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<ToastItem[]>([])

    const removeToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id))
    }, [])

    const addToast = useCallback((t: Omit<ToastItem, 'id'>) => {
        const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
        const item: ToastItem = { id, ...t }
        setToasts(prev => [item, ...prev])
        if (item.duration !== 0) {
            const dur = item.duration ?? 3500
            setTimeout(() => removeToast(id), dur)
        }
        return id
    }, [removeToast])

    const success = useCallback((message: string, opts?: { duration?: number }) => addToast({ message, type: 'success', duration: opts?.duration }), [addToast])
    const info = useCallback((message: string, opts?: { duration?: number }) => addToast({ message, type: 'info', duration: opts?.duration }), [addToast])
    const error = useCallback((message: string, opts?: { duration?: number }) => addToast({ message, type: 'error', duration: opts?.duration }), [addToast])

    const value = useMemo(() => ({ toasts, addToast, removeToast, success, info, error }), [toasts, addToast, removeToast, success, info, error])

    return (
        <ToastContext.Provider value={value}>
            {children}
            <div aria-live="polite" className="fixed top-6 right-6 z-[9999] flex flex-col items-end gap-3">
                {toasts.map(t => (
                    <div key={t.id} className={`max-w-sm w-full px-4 py-2 rounded shadow-lg text-white ${t.type === 'success' ? 'bg-emerald-600' : t.type === 'error' ? 'bg-rose-600' : 'bg-slate-700'}`}>
                        {t.message}
                        <button aria-label="Dismiss" onClick={() => removeToast(t.id)} className="ml-3 text-sm opacity-80">✕</button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    )
}

export function useToast() {
    const ctx = useContext(ToastContext)
    if (!ctx) throw new Error('useToast must be used within ToastProvider')
    return ctx
}

export default ToastProvider
