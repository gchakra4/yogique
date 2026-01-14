import { Clock, Users } from 'lucide-react'
import { useCallback, useState } from 'react'

interface Props {
    container: any
    onOpen?: (container: any) => void
}

export default function MobileContainerCard({ container, onOpen }: Props) {
    const [expanded, setExpanded] = useState(false)

    const handleToggle = useCallback(() => {
        setExpanded(v => !v)
    }, [])

    const handleOpen = useCallback(() => {
        if (onOpen) onOpen(container)
    }, [onOpen, container])

    return (
        <article
            className="border rounded-lg bg-white p-4 shadow-sm cursor-pointer"
            onClick={handleToggle}
            role="button"
            tabIndex={0}
        >
            <div className="flex items-start justify-between">
                <div>
                    <h4 className="text-base font-semibold">{container?.name || 'Untitled'}</h4>
                    <p className="text-sm text-gray-600 mt-1">{container?.package_name || '—'}</p>
                </div>

                <div className="text-sm text-gray-500 flex flex-col items-end">
                    <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span>{container?.start_time || '-'}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                        <Users className="w-4 h-4" />
                        <span>{container?.enrolled_count ?? 0}</span>
                    </div>
                </div>
            </div>

            {expanded && (
                <div className="mt-3 text-sm text-gray-700 space-y-2">
                    <div>{container?.description || 'No description available.'}</div>
                    <div className="flex gap-2 mt-2">
                        <button onClick={handleOpen} className="px-3 py-2 bg-emerald-600 text-white rounded">View</button>
                        <button className="px-3 py-2 border rounded" onClick={(e) => { e.stopPropagation(); /* placeholder */ }}>Share</button>
                    </div>
                </div>
            )}
        </article>
    )
}
