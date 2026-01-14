import React, { useEffect, useRef, useState } from 'react'

interface Props {
    isOpen: boolean
    onClose: () => void
    children: React.ReactNode
    title?: string
    snapPoints?: number[] // percentages [0.3, 0.6, 0.9]
    initialSnap?: number
    showHandle?: boolean
}

export default function BottomSheet({
    isOpen,
    onClose,
    children,
    title,
    snapPoints = [0.4, 0.8],
    initialSnap = 0,
    showHandle = true,
}: Props) {
    const sheetRef = useRef<HTMLDivElement | null>(null)
    const startY = useRef(0)
    const [dragY, setDragY] = useState(0)
    const [visible, setVisible] = useState(isOpen)

    useEffect(() => {
        setVisible(isOpen)
        setDragY(0)
    }, [isOpen])

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose()
        }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [onClose])

    const handleTouchStart = (e: React.TouchEvent) => {
        startY.current = e.touches[0].clientY
    }

    const handleTouchMove = (e: React.TouchEvent) => {
        const currentY = e.touches[0].clientY
        const diff = currentY - startY.current
        if (diff > 0) setDragY(diff)
    }

    const handleTouchEnd = () => {
        if (dragY > 120) {
            onClose()
        } else {
            setDragY(0)
        }
    }

    if (!visible) return null

    return (
        <div className="fixed inset-0 z-50 flex items-end md:items-center">
            <div
                className="absolute inset-0 bg-black/40"
                onClick={onClose}
                aria-hidden
            />

            <div
                ref={sheetRef}
                className={`w-full md:mx-auto md:max-w-2xl bg-white rounded-t-xl md:rounded-xl shadow-xl transform transition-transform duration-200`}
                style={{
                    touchAction: 'none',
                    transform: `translateY(${dragY}px)`,
                    maxHeight: '92vh',
                }}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                role="dialog"
                aria-modal="true"
            >
                <div className="p-3 border-b flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {showHandle && <div className="w-8 h-1.5 bg-gray-200 rounded-full mr-2" />}
                        {title && <h3 className="text-sm font-semibold">{title}</h3>}
                    </div>
                    <button onClick={onClose} aria-label="Close" className="p-2">
                        ×
                    </button>
                </div>

                <div className="p-4 overflow-auto" style={{ maxHeight: '80vh' }}>
                    {children}
                </div>
            </div>
        </div>
    )
}
