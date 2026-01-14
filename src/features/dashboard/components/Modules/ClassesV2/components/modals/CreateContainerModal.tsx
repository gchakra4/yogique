import { usePackages } from '@/features/dashboard/components/Modules/ClassesV2/hooks/usePackages';
import { useInstructors } from '@/features/dashboard/hooks/useInstructors';
import { ContainerService } from '@/features/dashboard/services/v2/container.service';
import Modal from '@/shared/components/ui/Modal';
import React, { useMemo, useState } from 'react';

interface CreateContainerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: (data: any) => void;
}

const CreateContainerModal: React.FC<CreateContainerModalProps> = ({ isOpen, onClose, onSuccess }) => {
    const { packages = [] } = usePackages({ isActive: true });
    const { instructors = [] } = useInstructors();

    const [name, setName] = useState('');
    const [packageId, setPackageId] = useState('');
    const [instructorId, setInstructorId] = useState('');
    const [capacity, setCapacity] = useState<number | ''>('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [description, setDescription] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const packageOptions = useMemo(() => packages, [packages]);
    const instructorOptions = useMemo(() => instructors, [instructors]);

    const reset = () => {
        setName('');
        setPackageId('');
        setInstructorId('');
        setCapacity('');
        setStartDate('');
        setEndDate('');
        setDescription('');
        setError(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        if (!name.trim()) {
            setError('Name is required');
            return;
        }
        if (!packageId) {
            setError('Package is required');
            return;
        }

        if (!capacity || Number(capacity) <= 0) {
            setError('Capacity must be greater than zero');
            return;
        }

        const payload = {
            display_name: name.trim(),
            package_id: packageId,
            instructor_id: instructorId || null,
            capacity_total: Number(capacity),
            start_date: startDate || null,
            end_date: endDate || null,
            description: description || null,
        };

        setIsSubmitting(true);
        try {
            const svc = new ContainerService();
            const result = await svc.createContainer(payload);
            if (!result.success) {
                const errMsg = result.error?.message || 'Failed to create program';
                throw new Error(errMsg);
            }
            onSuccess?.(result.data);
            reset();
            onClose();
        } catch (err: any) {
            setError(err?.message || 'An unexpected error occurred');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Create Program" size="lg" isSubmitting={isSubmitting}>
            <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                    {error && <div className="text-sm text-red-600">{error}</div>}

                    <div>
                        <label className="block text-xs text-gray-600">Name</label>
                        <input value={name} onChange={(e) => setName(e.target.value)} className="mt-1 w-full rounded border px-3 py-2" placeholder="Program name" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs text-gray-600">Package</label>
                            <select value={packageId} onChange={(e) => setPackageId(e.target.value)} className="mt-1 w-full rounded border px-3 py-2">
                                <option value="">-- Select package (optional) --</option>
                                {packageOptions.map((p: any) => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs text-gray-600">Instructor</label>
                            <select value={instructorId} onChange={(e) => setInstructorId(e.target.value)} className="mt-1 w-full rounded border px-3 py-2">
                                <option value="">-- Select instructor (optional) --</option>
                                {instructorOptions.map((ins: any) => (
                                    <option key={ins.id} value={ins.id}>{ins.display_name || ins.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs text-gray-600">Capacity</label>
                            <input type="number" value={capacity as any} onChange={(e) => setCapacity(e.target.value === '' ? '' : Number(e.target.value))} className="mt-1 w-full rounded border px-3 py-2" placeholder="Max students" min={1} />
                        </div>

                        <div>
                            <label className="block text-xs text-gray-600">Start Date</label>
                            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="mt-1 w-full rounded border px-3 py-2" />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs text-gray-600">End Date</label>
                            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="mt-1 w-full rounded border px-3 py-2" />
                        </div>
                        <div />
                    </div>

                    <div>
                        <label className="block text-xs text-gray-600">Description</label>
                        <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="mt-1 w-full rounded border px-3 py-2" rows={4} />
                    </div>
                </div>

                <div className="mt-6 flex justify-end gap-3">
                    <button type="button" className="px-4 py-2 rounded bg-gray-100 text-sm" onClick={onClose} disabled={isSubmitting}>
                        Cancel
                    </button>
                    <button type="submit" className="px-4 py-2 rounded bg-emerald-600 text-white text-sm" disabled={isSubmitting}>
                        {isSubmitting ? 'Creating...' : 'Create'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default CreateContainerModal;
