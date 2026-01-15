import { usePackages } from '@/features/dashboard/components/Modules/ClassesV2/hooks/usePackages';
import Modal from '@/shared/components/ui/Modal';
import React, { useEffect, useMemo, useState } from 'react';

interface EditContainerModalProps {
    isOpen: boolean;
    onClose: () => void;
    container?: any;
    onSuccess?: (data: any) => void;
}

export const EditContainerModal: React.FC<EditContainerModalProps> = ({ isOpen, onClose, container, onSuccess }) => {
    const { packages = [] } = usePackages({ isActive: true });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [capacity, setCapacity] = useState<number | ''>(container?.capacity_total ?? '');

    const selectedPackage = useMemo(() => packages.find((p: any) => p.id === container?.package_id), [packages, container?.package_id]);

    useEffect(() => {
        setCapacity(container?.capacity_total ?? '');
    }, [container]);

    // Force capacity to 1 when package is Individual
    useEffect(() => {
        if (selectedPackage && (selectedPackage as any).type === 'Individual') {
            setCapacity(1);
        }
    }, [selectedPackage]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            // Placeholder: call ContainerService.updateContainer
            await new Promise((r) => setTimeout(r, 400));
            onSuccess?.(container);
            onClose();
        } catch (err) {
            // handle error
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Edit Container`} size="lg" isSubmitting={isSubmitting}>
            <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs text-gray-600 dark:text-slate-400">Display Name</label>
                        <input defaultValue={container?.display_name || ''} className="mt-1 w-full rounded border px-3 py-2" />
                    </div>

                    <div>
                        <label className="block text-xs text-gray-600 dark:text-slate-400">Capacity</label>
                        <input
                            type="number"
                            value={selectedPackage && (selectedPackage as any).type === 'Individual' ? 1 : (capacity as any)}
                            onChange={(e) => setCapacity(e.target.value === '' ? '' : Number(e.target.value))}
                            className={`mt-1 w-full rounded border px-3 py-2 ${selectedPackage && (selectedPackage as any).type === 'Individual' ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                            min={1}
                            disabled={selectedPackage && (selectedPackage as any).type === 'Individual'}
                        />
                        {selectedPackage && (selectedPackage as any).type === 'Individual' && (
                            <div className="text-sm text-red-600 mt-2">Individual programs cannot have capacity</div>
                        )}
                    </div>
                </div>

                <div className="mt-6 flex justify-end gap-3">
                    <button type="button" className="px-4 py-2 rounded bg-gray-100 text-sm" onClick={onClose} disabled={isSubmitting}>
                        Cancel
                    </button>
                    <button type="submit" className="px-4 py-2 rounded bg-emerald-600 text-white text-sm" disabled={isSubmitting}>
                        {isSubmitting ? 'Saving...' : 'Save'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default EditContainerModal;
