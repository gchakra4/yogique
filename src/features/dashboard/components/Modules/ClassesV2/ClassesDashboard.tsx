import { usePermissions } from '@/shared/hooks/usePermissions';
import React, { useCallback, useMemo, useState } from 'react';

// Hooks
import { useContainers } from '@/features/dashboard/components/Modules/ClassesV2/hooks/useContainers';
import { usePackages } from '@/features/dashboard/components/Modules/ClassesV2/hooks/usePackages';
import useMobileDetect from '@/features/dashboard/hooks/v2/useMobileDetect';

// Types
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
    // Server state (React Query hooks)
    const { containers = [], total = 0, isLoading, isError, error, refetch } = useContainers({ isActive: true });
    const { packages = [] } = usePackages({ isActive: true });

    // Responsive
    const { isMobile, isTablet, isDesktop } = useMobileDetect();

    // Permissions - MUST be called at top level
    const { canCreate, getDenialReason, role } = usePermissions('containers');

    // Development mode: Log permission info and bypass for ANY role in dev
    const isDev = import.meta.env.DEV;
    const canCreateOverride = isDev ? true : canCreate; // In dev mode, always allow

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

    // UI State (local)
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [filters, setFilters] = useState<Filters>({ instructorId: null, packageId: null, containerType: null, isActive: true });

    const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);

    const [selectedContainer, setSelectedContainer] = useState<Container | null>(null);
    const [drawerContainerId, setDrawerContainerId] = useState<string | null>(null);

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

    const closeAllModals = useCallback(() => {
        setIsCreateModalOpen(false);
        setIsEditModalOpen(false);
        setIsDeleteModalOpen(false);
        setSelectedContainer(null);
    }, []);

    const handleCloseDrawer = useCallback(() => {
        setDrawerContainerId(null);
    }, []);

    // Render skeleton/placeholder UI per Task 1.11
    return (
        <div className="classes-dashboard h-full flex flex-col bg-gray-50">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 px-6 py-4">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Programs</h1>
                        <p className="text-sm text-gray-600 mt-1">
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
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        />
                    </div>
                    {packages.length > 0 && (
                        <select
                            value={filters.packageId || ''}
                            onChange={(e) => setFilters(prev => ({ ...prev, packageId: e.target.value || null }))}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        >
                            <option value="">All Packages</option>
                            {packages.map((pkg: any) => (
                                <option key={pkg.id} value={pkg.id}>{pkg.name}</option>
                            ))}
                        </select>
                    )}
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 overflow-auto px-6 py-6">
                {/* Loading State */}
                {isLoading && containers.length === 0 && (
                    <div className="flex items-center justify-center h-64">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
                            <p className="text-gray-600">Loading programs...</p>
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
                            <p className="text-gray-900 font-semibold mb-2">Failed to load programs</p>
                            <p className="text-gray-600 mb-4">There was an error loading your programs</p>
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
                            <p className="text-gray-900 font-semibold mb-2">No programs found</p>
                            <p className="text-gray-600 mb-4">
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
                                />
                            );
                        })}
                    </div>
                )}
            </main>

            {/* Drawer placeholder */}
            {drawerContainerId && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50" onClick={handleCloseDrawer}>
                    <div className="absolute right-0 top-0 h-full w-full max-w-2xl bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between p-6 border-b">
                            <h2 className="text-xl font-bold">Program Details</h2>
                            <button
                                onClick={handleCloseDrawer}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="p-6">
                            <p className="text-gray-600">Drawer content for program: {drawerContainerId}</p>
                            <p className="text-sm text-gray-500 mt-2">TODO: Implement ContainerDrawer component</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Create Program Modal */}
            <CreateContainerModal
                isOpen={isCreateModalOpen}
                onClose={closeAllModals}
                onSuccess={(created) => {
                    console.log('Created container', created);
                    // Refresh list and close modal
                    refetch();
                }}
            />

            {isEditModalOpen && selectedContainer && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center" onClick={closeAllModals}>
                    <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold">Edit Program</h2>
                            <button
                                onClick={closeAllModals}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <p className="text-gray-600">Edit program form for: {(selectedContainer as any).display_name}</p>
                        <p className="text-sm text-gray-500 mt-2">TODO: Implement EditContainerModal component</p>
                    </div>
                </div>
            )}

            {isDeleteModalOpen && selectedContainer && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center" onClick={closeAllModals}>
                    <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-red-600">Delete Program</h2>
                            <button
                                onClick={closeAllModals}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <p className="text-gray-600 mb-4">
                            Are you sure you want to delete "{(selectedContainer as any).display_name}"? This action cannot be undone.
                        </p>
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={closeAllModals}
                                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    // TODO: Implement delete functionality
                                    console.log('Delete:', selectedContainer);
                                    closeAllModals();
                                }}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ClassesDashboard;
