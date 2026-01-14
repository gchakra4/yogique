import React, { useCallback, useMemo, useState } from 'react';

// Hooks
import { useContainers } from './hooks/useContainers';
import { useMobileDetect } from './hooks/useMobileDetect';
import { usePackages } from './hooks/usePackages';

// Types
import { Container } from './types/container.types';

// TODO: Import real child components when implemented:
// import ContainerCard from './components/ContainerCard';
// import ContainerDrawer from './components/ContainerDrawer';
// import CreateContainerModal from './components/modals/CreateContainerModal';
// import EditContainerModal from './components/modals/EditContainerModal';
// import DeleteConfirmModal from './components/modals/DeleteConfirmModal';

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
            if (q && !c.display_name.toLowerCase().includes(q) && !c.container_code?.toLowerCase().includes(q)) return false;
            if (filters.instructorId && c.instructor_id !== filters.instructorId) return false;
            if (filters.packageId && c.package_id !== filters.packageId) return false;
            if (filters.containerType && c.container_type !== filters.containerType) return false;
            return true;
        });
    }, [containers, searchQuery, filters]);

    // Event handlers (stubs)
    const handleCardClick = useCallback((id: string) => {
        setDrawerContainerId(id);
    }, []);

    const handleEditClick = useCallback((container: Container) => {
        setSelectedContainer(container);
        setIsEditModalOpen(true);
        setDrawerContainerId(null);
    }, []);

    const handleDeleteClick = useCallback((container: Container) => {
        setSelectedContainer(container);
        setIsDeleteModalOpen(true);
        setDrawerContainerId(null);
    }, []);

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
        <div className="classes-dashboard">
            {/* Header */}
            <header className="dashboard-header">
                <h1>Programs</h1>
                {/* TODO: Add Breadcrumb, Search input, Action buttons */}
            </header>

            {/* Loading / Error / Empty states */}
            {isLoading && containers.length === 0 && (
                <div className="loading-skeleton">{/* TODO: Replace with ContainerGridSkeleton */}Loading...</div>
            )}

            {isError && (
                <div className="error-state">
                    <p>Failed to load programs.</p>
                    <button onClick={() => refetch()}>Retry</button>
                </div>
            )}

            {!isLoading && filteredContainers.length === 0 && (
                <div className="empty-state">
                    <p>No programs found.</p>
                    <button onClick={() => setIsCreateModalOpen(true)}>Create Program</button>
                </div>
            )}

            {/* Container Grid / List */}
            {!isLoading && filteredContainers.length > 0 && (
                <main>
                    {/* TODO: Replace placeholders with ContainerCard/ContainerListItem components */}
                    <div className="container-list-placeholder">
                        {filteredContainers.map((c: Container) => (
                            <div key={c.id} className="container-item" onClick={() => handleCardClick(c.id)}>
                                <h3>{c.display_name}</h3>
                                <p>{c.container_code}</p>
                            </div>
                        ))}
                    </div>
                </main>
            )}

            {/* Drawer placeholder */}
            {drawerContainerId && (
                <aside className="drawer-placeholder">
                    <div>Drawer for {drawerContainerId}</div>
                    <button onClick={handleCloseDrawer}>Close</button>
                    {/* TODO: useContainerDetail, useAssignments, useCapacity inside Drawer */}
                </aside>
            )}

            {/* Modals placeholders */}
            {isCreateModalOpen && (
                <div className="modal-placeholder">CreateContainerModal (TODO)
                    <button onClick={closeAllModals}>Close</button>
                </div>
            )}

            {isEditModalOpen && (
                <div className="modal-placeholder">EditContainerModal (TODO)
                    <button onClick={closeAllModals}>Close</button>
                </div>
            )}

            {isDeleteModalOpen && (
                <div className="modal-placeholder">DeleteConfirmModal (TODO)
                    <button onClick={closeAllModals}>Close</button>
                </div>
            )}

            {/* TODOs: 
        - Wire up useContainerMutations
        - Replace placeholders with real components
        - Add filter bar, debounced search, accessibility features
      */}
        </div>
    );
};

export default ClassesDashboard;
