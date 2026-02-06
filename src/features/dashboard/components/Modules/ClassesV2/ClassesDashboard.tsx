import { usePermissions } from '@/shared/hooks/usePermissions';
import React, { useCallback, useMemo, useState } from 'react';

// Hooks
import { useContainers } from '@/features/dashboard/components/Modules/ClassesV2/hooks/useContainers';
import { usePackages } from '@/features/dashboard/components/Modules/ClassesV2/hooks/usePackages';
import useMobileDetect from '@/features/dashboard/hooks/v2/useMobileDetect';
import { containerService } from '@/features/dashboard/services/v2';

// Types
import { useToast } from '@/shared/contexts/ToastContext';
import ContainerDrawer from './components/ContainerDrawer';
import CreateAssignmentModal from './components/modals/CreateAssignmentModal';
import EditContainerModal from './components/modals/EditContainerModal';
import { Container } from './types/container.types';

// Components
import { ContainerCard } from './components/ContainerCard';
import CreateContainerModal from './components/modals/CreateContainerModal';

interface Filters {
    instructorId: string | null;
    packageId: string | null;
    containerType: string | null;
    isActive?: boolean;
}

const ClassesDashboard: React.FC = () => {
    // UI State (local) - must be defined before using in hooks
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [showArchived, setShowArchived] = useState<boolean>(false);
    const [filters, setFilters] = useState<Filters>({ instructorId: null, packageId: null, containerType: null, isActive: true });

    const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
    const [isArchiveModalOpen, setIsArchiveModalOpen] = useState<boolean>(false);

    const [selectedContainer, setSelectedContainer] = useState<Container | null>(null);
    const [drawerContainerId, setDrawerContainerId] = useState<string | null>(null);
    const [isCreateAssignmentModalOpen, setIsCreateAssignmentModalOpen] = useState<boolean>(false);

    // Server state (React Query hooks)
    const { containers = [], total = 0, isLoading, isError, error, refetch } = useContainers({ isActive: !showArchived });
    const { packages = [] } = usePackages({ isActive: true });

    // Responsive
    const { isMobile, isTablet, isDesktop } = useMobileDetect();

    // Permissions - MUST be called at top level
    const { canCreate, getDenialReason, role } = usePermissions('containers');

    // Development mode: Log permission info and bypass for ANY role in dev
    const isDev = import.meta.env.DEV;
    const canCreateOverride = isDev ? true : canCreate; // In dev mode, always allow

    const { success: toastSuccess } = useToast();

    React.useEffect(() => {
        console.log('[ClassesDashboard] Permission Check:', {
            role,
            canCreate,
            canCreateOverride,
            denialReason: !canCreate ? getDenialReason('create') : null,
            isDev,
            message: isDev ? '🔓 DEV MODE: All permissions granted' : ''
        });
    }, [role, canCreate, canCreateOverride, getDenialReason, isDev]);

    // Derived state (placeholder filtering logic)
    const filteredContainers = useMemo(() => {
        if (!searchQuery && !filters.instructorId && !filters.packageId && !filters.containerType) return containers;
        const q = searchQuery.trim().toLowerCase();
        return containers.filter((c: Container) => {
            const anyC = c as any;
            if (q && !anyC.display_name?.toLowerCase().includes(q) && !anyC.container_code?.toLowerCase().includes(q)) return false;
            if (filters.instructorId && anyC.instructor_id !== filters.instructorId) return false;
            if (filters.packageId && anyC.package_id !== filters.packageId) return false;
            if (filters.containerType && anyC.container_type !== filters.containerType) return false;
            return true;
        });
    }, [containers, searchQuery, filters]);

    // Event handlers (stubs)
    const handleCardClick = useCallback((id: string) => {
        setDrawerContainerId(id);
    }, []);

    const handleEditClick = useCallback((id: string) => {
        const container = containers.find(c => (c as any).id === id);
        if (container) {
            setSelectedContainer(container);
            setIsEditModalOpen(true);
            setDrawerContainerId(null);
        }
    }, [containers]);

    const handleDeleteClick = useCallback((id: string) => {
        const container = containers.find(c => (c as any).id === id);
        if (container) {
            setSelectedContainer(container);
            setIsDeleteModalOpen(true);
            setDrawerContainerId(null);
        }
    }, [containers]);

    const handleArchiveClick = useCallback((id: string) => {
        const container = containers.find(c => (c as any).id === id);
        if (container) {
            setSelectedContainer(container);
            setIsArchiveModalOpen(true);
            setDrawerContainerId(null);
        }
    }, [containers]);

    const closeAllModals = useCallback(() => {
        setIsCreateModalOpen(false);
        setIsEditModalOpen(false);
        setIsDeleteModalOpen(false);
        setIsArchiveModalOpen(false);
        setSelectedContainer(null);
    }, []);

    const handleCloseDrawer = useCallback(() => {
        setDrawerContainerId(null);
    }, []);

    // Render skeleton/placeholder UI per Task 1.11
    return (
        <div className="classes-dashboard h-full flex flex-col bg-gray-50 dark:bg-slate-900">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 px-6 py-4 dark:bg-slate-900 dark:border-slate-700">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Programs</h1>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            Manage your yoga programs and classes
                        </p>
                    </div>
                    <button
                        onClick={() => {
                            if (!canCreateOverride) {
                                const reason = getDenialReason('create');
                                const helpText = `\\n\\n🔧 To fix this:\\n` +
                                    `1. Open Supabase SQL Editor\\n` +
                                    `2. Run: UPDATE users SET role = 'super_admin' WHERE email = 'your-email@example.com'\\n` +
                                    `3. Refresh the page\\n\\n` +
                                    `Current role: ${role || 'none'}`;
                                alert(reason + helpText);
                                return;
                            }
                            setIsCreateModalOpen(true);
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title={!canCreateOverride ? getDenialReason('create') : 'Create a new program'}
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Create Program
                    </button>
                </div>

                {/* Search and Filters */}
                <div className="flex items-center gap-4">
                    <div className="flex-1 relative">
                        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                            type="text"
                            placeholder="Search programs..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                        />
                    </div>
                    {packages.length > 0 && (
                        <select
                            value={filters.packageId || ''}
                            onChange={(e) => setFilters(prev => ({ ...prev, packageId: e.target.value || null }))}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                        >
                            <option value="">All Packages</option>
                            {packages.map((pkg: any) => (
                                <option key={pkg.id} value={pkg.id}>{pkg.name}</option>
                            ))}
                        </select>
                    )}
                    <button
                        onClick={() => setShowArchived(!showArchived)}
                        className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors ${showArchived
                            ? 'bg-amber-50 border-amber-300 text-amber-700 hover:bg-amber-100 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-200'
                            : 'border-gray-300 text-gray-700 hover:bg-gray-50 dark:hover:bg-slate-800'
                            }`}
                        title={showArchived ? 'Show active programs' : 'Show archived programs'}
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                        </svg>
                        {showArchived ? 'Archived' : 'Active'}
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 overflow-auto px-6 py-6">
                {/* Loading State */}
                {isLoading && containers.length === 0 && (
                    <div className="flex items-center justify-center h-64">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
                            <p className="text-gray-600 dark:text-gray-400">Loading programs...</p>
                        </div>
                    </div>
                )}

                {/* Error State */}
                {isError && (
                    <div className="flex items-center justify-center h-64">
                        <div className="text-center">
                            <svg className="w-16 h-16 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p className="text-gray-900 dark:text-white font-semibold mb-2">Failed to load programs</p>
                            <p className="text-gray-600 dark:text-gray-400 mb-4">There was an error loading your programs</p>
                            <button
                                onClick={() => refetch()}
                                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                            >
                                Try Again
                            </button>
                        </div>
                    </div>
                )}

                {/* Empty State */}
                {!isLoading && !isError && filteredContainers.length === 0 && (
                    <div className="flex items-center justify-center h-64">
                        <div className="text-center">
                            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                            </svg>
                            <p className="text-gray-900 dark:text-white font-semibold mb-2">No programs found</p>
                            <p className="text-gray-600 dark:text-gray-400 mb-4">
                                {searchQuery || filters.packageId
                                    ? 'Try adjusting your filters'
                                    : 'Get started by creating your first program'}
                            </p>
                            {!searchQuery && !filters.packageId && (
                                <button
                                    onClick={() => {
                                        if (!canCreateOverride) {
                                            const reason = getDenialReason('create');
                                            const helpText = `\\n\\n🔧 To fix this:\\n` +
                                                `1. Open Supabase SQL Editor\\n` +
                                                `2. Run: UPDATE users SET role = 'super_admin' WHERE email = 'your-email@example.com'\\n` +
                                                `3. Refresh the page\\n\\n` +
                                                `Current role: ${role || 'none'}`;
                                            alert(reason + helpText);
                                            return;
                                        }
                                        setIsCreateModalOpen(true);
                                    }}
                                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                                    title={!canCreateOverride ? getDenialReason('create') : 'Create your first program'}
                                >
                                    Create Program
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {/* Container Grid */}
                {!isLoading && !isError && filteredContainers.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredContainers.map((container: Container) => {
                            // Map Container type to ContainerCard's expected format
                            const cardData = {
                                id: (container as any).id,
                                name: (container as any).display_name || (container as any).name || 'Untitled',
                                instructor_name: (container as any).instructor_name,
                                // Resolve package name from packages list if available
                                package_name: packages.find((p: any) => p.id === (container as any).package_id)?.name || null,
                                // Class type may be stored on container as container_type or course_type
                                class_type: (container as any).container_type || (container as any).course_type || null,
                                capacity_total: (container as any).capacity_total,
                                capacity_enrolled: (container as any).capacity_enrolled || (container as any).capacity_booked,
                                assignment_count: (container as any).assignment_count,
                                next_session_date: (container as any).next_session_date,
                                next_session_time: (container as any).next_session_time
                            };
                            return (
                                <ContainerCard
                                    key={cardData.id}
                                    container={cardData}
                                    onClick={handleCardClick}
                                    onEdit={handleEditClick}
                                    onDelete={handleDeleteClick}
                                    onArchive={showArchived ? undefined : handleArchiveClick}
                                    onRestore={showArchived ? async (id: string) => {
                                        const result = await containerService.unarchiveContainer(id);
                                        if (result.success) {
                                            toastSuccess('Program restored successfully');
                                            refetch();
                                        } else {
                                            alert(`Failed to restore program: ${result.error?.message || 'Unknown error'}`);
                                        }
                                    } : undefined}
                                />
                            );
                        })}
                    </div>
                )}
            </main>

            {/* Real ContainerDrawer */}
            <ContainerDrawer
                isOpen={!!drawerContainerId}
                onClose={handleCloseDrawer}
                container={containers.find(c => (c as any).id === drawerContainerId) ?? null}
                onEdit={() => drawerContainerId && handleEditClick(drawerContainerId)}
                onDelete={() => drawerContainerId && handleDeleteClick(drawerContainerId)}
                onArchive={() => drawerContainerId && handleArchiveClick(drawerContainerId)}
                onCreateAssignment={() => setIsCreateAssignmentModalOpen(true)}
                onAssignStudents={() => { /* refresh or no-op */ }}
                width={isDesktop ? 'wide' : 'default'}
            />

            {/* Create Assignment Modal (pre-filled from selected drawer container) */}
            {drawerContainerId && (
                <CreateAssignmentModal
                    isOpen={isCreateAssignmentModalOpen}
                    onClose={() => setIsCreateAssignmentModalOpen(false)}
                    containerId={drawerContainerId}
                    containerInstructor={containers.find(c => (c as any).id === drawerContainerId) ? { id: (containers.find(c => (c as any).id === drawerContainerId) as any).instructor_id, name: (containers.find(c => (c as any).id === drawerContainerId) as any).instructor_name } : null}
                    containerTimezone={containers.find(c => (c as any).id === drawerContainerId) ? (containers.find(c => (c as any).id === drawerContainerId) as any).timezone : null}
                    onCreated={(assignment) => {
                        // Refresh containers/assignments and notify
                        refetch();
                        toastSuccess('Assignment created');
                        setIsCreateAssignmentModalOpen(false);
                    }}
                />
            )}
            {/* Toast is handled by global ToastProvider */}

            {/* Create Program Modal */}
            <CreateContainerModal
                isOpen={isCreateModalOpen}
                onClose={closeAllModals}
                onSuccess={(created) => {
                    console.log('Created container', created);
                    // Refresh list
                    refetch();
                    // Auto-open drawer for newly created container
                    const id = (created && (created.id || created)) as string | undefined;
                    if (id) setDrawerContainerId(id);
                    // Use centralized toast
                    toastSuccess('Program created');
                }}
            />

            {isEditModalOpen && selectedContainer && (
                <EditContainerModal
                    isOpen={isEditModalOpen}
                    onClose={closeAllModals}
                    container={selectedContainer}
                    onSuccess={(updated) => {
                        // Refresh list and show toast
                        refetch();
                        toastSuccess('Program updated');
                        closeAllModals();
                    }}
                />
            )}

            {isDeleteModalOpen && selectedContainer && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center" onClick={closeAllModals}>
                    <div className="bg-white dark:bg-slate-900 rounded-lg p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-3 bg-red-100 dark:bg-red-900/20 rounded-full">
                                <svg className="w-6 h-6 text-red-600 dark:text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            </div>
                            <div className="flex-1">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Delete Program</h2>
                            </div>
                            <button
                                onClick={closeAllModals}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                            >
                                <svg className="w-6 h-6 text-gray-500 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="mb-6">
                            <p className="text-gray-700 dark:text-slate-300 mb-3">
                                Are you sure you want to permanently delete <strong>"{(selectedContainer as any).display_name}"</strong>?
                            </p>
                            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                                <p className="text-sm text-amber-800 dark:text-amber-200">
                                    <strong>Warning:</strong> This will:
                                </p>
                                <ul className="text-sm text-amber-700 dark:text-amber-300 mt-2 ml-4 space-y-1 list-disc">
                                    <li>Permanently delete this program</li>
                                    <li>Delete all assignments in this program</li>
                                    <li>Free all instructors assigned to these classes</li>
                                </ul>
                                <p className="text-sm text-amber-800 dark:text-amber-200 mt-2 font-medium">
                                    This action cannot be undone.
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={closeAllModals}
                                className="px-4 py-2 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-300 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={async () => {
                                    const id = (selectedContainer as any).id;
                                    const result = await containerService.deleteContainer(id);
                                    if (result.success) {
                                        toastSuccess('Program and all assignments deleted successfully');
                                        refetch();
                                        closeAllModals();
                                    } else {
                                        alert(`Failed to delete program: ${result.error?.message || 'Unknown error'}`);
                                    }
                                }}
                                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                Delete Program
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {isArchiveModalOpen && selectedContainer && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center" onClick={closeAllModals}>
                    <div className="bg-white dark:bg-slate-900 rounded-lg p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-3 bg-amber-100 dark:bg-amber-900/20 rounded-full">
                                <svg className="w-6 h-6 text-amber-600 dark:text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                                </svg>
                            </div>
                            <div className="flex-1">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Archive Program</h2>
                            </div>
                            <button
                                onClick={closeAllModals}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                            >
                                <svg className="w-6 h-6 text-gray-500 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="mb-6">
                            <p className="text-gray-700 dark:text-slate-300 mb-3">
                                Are you sure you want to archive <strong>"{(selectedContainer as any).display_name}"</strong>?
                            </p>
                            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                                <p className="text-sm text-blue-800 dark:text-blue-200">
                                    <strong>This will:</strong>
                                </p>
                                <ul className="text-sm text-blue-700 dark:text-blue-300 mt-2 ml-4 space-y-1 list-disc">
                                    <li>Archive this program (can be restored later)</li>
                                    <li>Archive all assignments in this program</li>
                                    <li>Free all instructors assigned to these classes</li>
                                </ul>
                                <p className="text-sm text-blue-800 dark:text-blue-200 mt-2">
                                    Archived programs won't appear in the active list.
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={closeAllModals}
                                className="px-4 py-2 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-300 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={async () => {
                                    const id = (selectedContainer as any).id;
                                    const result = await containerService.archiveContainer(id);
                                    if (result.success) {
                                        toastSuccess('Program and all assignments archived successfully');
                                        refetch();
                                        closeAllModals();
                                    } else {
                                        alert(`Failed to archive program: ${result.error?.message || 'Unknown error'}`);
                                    }
                                }}
                                className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                                </svg>
                                Archive Program
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ClassesDashboard;
