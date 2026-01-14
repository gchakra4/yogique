import useMobileDetect from '@/features/dashboard/hooks/v2/useMobileDetect'
import { Plus } from 'lucide-react'
import React, { useCallback, useRef, useState } from 'react'
import BottomSheet from './BottomSheet'
import MobileContainerCard from './MobileContainerCard'

interface Props {
    containers: any[]
    onCreate?: () => void
    onRefresh?: () => Promise<void>
}

export default function MobileContainerList({ containers = [], onCreate, onRefresh }: Props) {
    const { isMobile } = useMobileDetect()
    const [selected, setSelected] = useState<any | null>(null)
    const [isSheetOpen, setIsSheetOpen] = useState(false)
    const [isRefreshing, setIsRefreshing] = useState(false)
    const startY = useRef<number | null>(null)
    const pullDistance = useRef(0)

    const handleOpen = useCallback((c: any) => {
        setSelected(c)
        setIsSheetOpen(true)
    }, [])

    const handleClose = useCallback(() => {
        setIsSheetOpen(false)
        setSelected(null)
    }, [])

    const handleTouchStart = (e: React.TouchEvent) => {
        if (window.scrollY === 0) startY.current = e.touches[0].clientY
    }

    const handleTouchMove = (e: React.TouchEvent) => {
        if (startY.current == null) return
        const diff = e.touches[0].clientY - startY.current
        pullDistance.current = Math.max(0, Math.min(diff, 120))
    }

    const handleTouchEnd = async () => {
        if (pullDistance.current > 80 && onRefresh) {
            setIsRefreshing(true)
            try {
                await onRefresh()
            } finally {
                setIsRefreshing(false)
            }
        }
        startY.current = null
        pullDistance.current = 0
    }

    return (
        <div className="mobile-container-list">
            <div
                className="p-4 space-y-3"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            >
                {isRefreshing && <div className="text-center text-sm text-gray-500 mb-2">Refreshing...</div>}

                {containers.length === 0 ? (
                    <div className="text-center text-gray-500 py-8">No programs found.</div>
                ) : (
                    <div className="grid grid-cols-1 gap-3">
                        {containers.map(c => (
                            <MobileContainerCard key={c.id} container={c} onOpen={handleOpen} />
                        ))}
                    </div>
                )}
            </div>

            {/* FAB for mobile */}
            {isMobile && onCreate && (
                <button
                    onClick={onCreate}
                    className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-lg"
                    aria-label="Create"
                >
                    <Plus className="w-6 h-6" />
                </button>
            )}

            {/* Details Bottom Sheet */}
            <BottomSheet isOpen={isSheetOpen} onClose={handleClose} title={selected?.name || 'Details'}>
                {selected ? (
                    <div>
                        <h4 className="text-lg font-semibold">{selected.name}</h4>
                        <p className="mt-2 text-sm text-gray-700">{selected.description}</p>
                    </div>
                ) : null}
            </BottomSheet>
        </div>
    )
}
