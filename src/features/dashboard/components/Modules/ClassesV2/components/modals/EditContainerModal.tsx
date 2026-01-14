import Modal from '@/shared/components/ui/Modal';
import React, { useState } from 'react';

interface EditContainerModalProps {
    isOpen: boolean;
    onClose: () => void;
    container?: any;
    onSuccess?: (data: any) => void;
}

export const EditContainerModal: React.FC<EditContainerModalProps> = ({ isOpen, onClose, container, onSuccess }) => {
    const [isSubmitting, setIsSubmitting] = useState(false);

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
                        <input type="number" defaultValue={container?.capacity_total ?? ''} className="mt-1 w-full rounded border px-3 py-2" />
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
