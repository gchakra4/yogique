import Modal from '@/shared/components/ui/Modal';
import React, { useState } from 'react';

interface DeleteConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm?: () => Promise<void> | void;
    title?: string;
    message?: string;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({ isOpen, onClose, onConfirm, title = 'Confirm Delete', message = 'Are you sure you want to delete this item?' }) => {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleConfirm = async () => {
        setIsSubmitting(true);
        try {
            await Promise.resolve(onConfirm?.());
            onClose();
        } catch (err) {
            // handle error
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm" isSubmitting={isSubmitting} closeOnBackdropClick={!isSubmitting}>
            <div className="space-y-4">
                <p className="text-sm text-gray-700 dark:text-slate-300">{message}</p>

                <div className="flex justify-end gap-3">
                    <button type="button" className="px-4 py-2 rounded bg-gray-100 text-sm" onClick={onClose} disabled={isSubmitting}>
                        Cancel
                    </button>
                    <button type="button" className="px-4 py-2 rounded bg-rose-600 text-white text-sm" onClick={handleConfirm} disabled={isSubmitting}>
                        {isSubmitting ? 'Deleting...' : 'Delete'}
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default DeleteConfirmModal;
