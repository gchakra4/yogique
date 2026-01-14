import React, { useEffect, useMemo, useState } from 'react';

type PackageType = any;
type InstructorType = any;

type ContainerFormProps = {
    container?: any;
    onSubmit: (data: any) => Promise<void> | void;
    onCancel: () => void;
    isSubmitting?: boolean;
    packages?: PackageType[]; // optional override
    instructors?: InstructorType[]; // optional override
};

export const ContainerForm: React.FC<ContainerFormProps> = ({
    container,
    onSubmit,
    onCancel,
    isSubmitting = false,
    packages = [],
    instructors = [],
}) => {
    const isEditMode = Boolean(container);

    const [formData, setFormData] = useState(() => ({
        package_id: container?.package_id || '',
        instructor_id: container?.instructor_id ?? null,
        capacity_total: container?.capacity_total ?? null,
        display_name: container?.display_name || '',
        start_date: container?.start_date || '',
        end_date: container?.end_date || '',
        timezone: container?.timezone || 'Asia/Kolkata',
        status: container?.status || 'draft',
        isAutoGeneratingName: !container?.display_name,
        packageDetails: null as PackageType | null,
        instructorDetails: null as InstructorType | null,
    }));

    const [errors, setErrors] = useState<Record<string, string | undefined>>({});

    useEffect(() => {
        // populate packageDetails / instructorDetails if container provided
        if (container) {
            const pkg = packages.find((p: any) => p.id === container.package_id);
            const instr = instructors.find((i: any) => i.id === container.instructor_id);
            setFormData((s) => ({ ...s, packageDetails: pkg || null, instructorDetails: instr || null }));
        }
    }, []);

    const groupedPackages = useMemo(() => {
        const grouped = { individual: [] as PackageType[], group: [] as PackageType[], crash: [] as PackageType[] };
        packages.forEach((p: any) => {
            if (p.type === 'individual') grouped.individual.push(p);
            else if (p.type === 'crash_course') grouped.crash.push(p);
            else grouped.group.push(p);
        });
        return grouped;
    }, [packages]);

    const updateField = <K extends keyof typeof formData>(field: K, value: typeof formData[K]) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        if (errors[field as string]) setErrors((e) => ({ ...e, [field as string]: undefined }));
    };

    const generateDisplayName = (pkg: PackageType | null, instr: InstructorType | null) => {
        if (!pkg) return '';
        const instructorPart = instr?.name || 'Unassigned';
        return `${pkg.name} - ${instructorPart}`;
    };

    const validateForm = () => {
        const e: Record<string, string> = {};
        if (!formData.package_id) e.package_id = 'Package is required';
        if (!formData.display_name || !formData.display_name.trim()) e.display_name = 'Display name is required';

        if (formData.packageDetails?.type !== 'individual') {
            if (!formData.capacity_total || formData.capacity_total < 1) e.capacity_total = 'Capacity is required for group programs';
            if (formData.capacity_total && formData.capacity_total > 100) e.capacity_total = 'Capacity cannot exceed 100';
        }

        if (formData.start_date && formData.end_date && new Date(formData.start_date) > new Date(formData.end_date)) {
            e.end_date = 'End date must be after start date';
        }

        setErrors(e);
        return e;
    };

    const handlePackageChange = (packageId: string) => {
        updateField('package_id', packageId);
        if (!packageId) {
            updateField('packageDetails', null);
            updateField('capacity_total', null);
            return;
        }

        const pkg = packages.find((p: any) => p.id === packageId) || null;
        updateField('packageDetails', pkg);

        if (pkg) {
            if (pkg.type === 'group' || pkg.type === 'crash_course') {
                updateField('capacity_total', pkg.capacity_default ?? null);
            } else {
                updateField('capacity_total', null);
            }

            if (formData.isAutoGeneratingName) {
                updateField('display_name', generateDisplayName(pkg, formData.instructorDetails));
            }

            if (pkg.type === 'crash_course' && pkg.duration) {
                const startDate = formData.start_date || new Date().toISOString().split('T')[0];
                // simple duration parsing: assume days
                const end = new Date(startDate);
                end.setDate(end.getDate() + (pkg.duration_days || 0));
                updateField('start_date', startDate);
                updateField('end_date', end.toISOString().split('T')[0]);
            }
        }
    };

    const handleInstructorChange = (instructorId: string | null) => {
        updateField('instructor_id', instructorId);
        if (!instructorId) {
            updateField('instructorDetails', null);
            updateField('timezone', 'Asia/Kolkata');
            if (formData.isAutoGeneratingName) updateField('display_name', generateDisplayName(formData.packageDetails, null));
            return;
        }

        const instr = instructors.find((i: any) => i.id === instructorId) || null;
        updateField('instructorDetails', instr);
        // If instructor has timezone on profile, update (caller can override)
        if (instr?.timezone) updateField('timezone', instr.timezone);
        if (formData.isAutoGeneratingName) updateField('display_name', generateDisplayName(formData.packageDetails, instr));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const syncErrors = validateForm();
        if (Object.keys(syncErrors).length > 0) return;

        try {
            await Promise.resolve(onSubmit({ ...formData }));
        } catch (err: any) {
            setErrors((prev) => ({ ...prev, _form: err?.message || 'Submission failed' }));
        }
    };

    const isCapacityDisabled = formData.packageDetails?.type === 'individual';

    return (
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {errors._form && (
                <div className="mb-2 p-2 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded" role="alert">
                    <p className="text-sm text-rose-700">{errors._form}</p>
                </div>
            )}

            <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">Package <span className="text-rose-500">*</span></label>
                <select
                    value={formData.package_id}
                    onChange={(s) => handlePackageChange((s.target as HTMLSelectElement).value)}
                    className={`w-full rounded-md border px-3 py-2 text-sm ${errors.package_id ? 'border-rose-500' : 'border-gray-300'}`}
                    disabled={isEditMode}
                >
                    <option value="">Select a package...</option>
                    {groupedPackages.individual.length > 0 && (
                        <optgroup label="Individual">
                            {groupedPackages.individual.map((p) => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </optgroup>
                    )}
                    {groupedPackages.group.length > 0 && (
                        <optgroup label="Group">
                            {groupedPackages.group.map((p) => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </optgroup>
                    )}
                    {groupedPackages.crash.length > 0 && (
                        <optgroup label="Crash Course">
                            {groupedPackages.crash.map((p) => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </optgroup>
                    )}
                </select>
                {errors.package_id && <p className="mt-1 text-xs text-rose-600" role="alert">{errors.package_id}</p>}
            </div>

            <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">Instructor <span className="text-gray-400 text-xs">(optional)</span></label>
                <select
                    value={formData.instructor_id ?? ''}
                    onChange={(s) => handleInstructorChange((s.target as HTMLSelectElement).value || null)}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                >
                    <option value="">Unassigned</option>
                    {instructors.map((i: any) => (
                        <option key={i.id} value={i.id}>{i.name}</option>
                    ))}
                </select>
            </div>

            <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">Capacity{!isCapacityDisabled && <span className="text-rose-500">*</span>}</label>
                {isCapacityDisabled ? (
                    <div className="w-full rounded-md border border-gray-200 bg-gray-50 dark:bg-slate-800 px-3 py-2 text-sm text-gray-500">N/A (Individual Program)</div>
                ) : (
                    <>
                        <input
                            type="number"
                            min={1}
                            value={formData.capacity_total ?? ''}
                            onChange={(s) => updateField('capacity_total', s.target.value ? Number(s.target.value) : null)}
                            className={`w-full rounded-md border px-3 py-2 text-sm ${errors.capacity_total ? 'border-rose-500' : 'border-gray-300'}`}
                        />
                        {errors.capacity_total && <p className="mt-1 text-xs text-rose-600" role="alert">{errors.capacity_total}</p>}
                    </>
                )}
            </div>

            <div>
                <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-medium text-gray-700 dark:text-slate-300">Display Name <span className="text-rose-500">*</span></label>
                    <button type="button" className="text-xs text-emerald-600" onClick={() => { const v = !formData.isAutoGeneratingName; updateField('isAutoGeneratingName', v); if (v) updateField('display_name', generateDisplayName(formData.packageDetails, formData.instructorDetails)); }}>
                        {formData.isAutoGeneratingName ? '✓ Auto' : 'Enable Auto'}
                    </button>
                </div>
                <input
                    type="text"
                    value={formData.display_name}
                    onChange={(s) => { updateField('display_name', s.target.value); if (formData.isAutoGeneratingName) updateField('isAutoGeneratingName', false); }}
                    className={`w-full rounded-md border px-3 py-2 text-sm ${errors.display_name ? 'border-rose-500' : 'border-gray-300'}`}
                    maxLength={100}
                />
                {formData.isAutoGeneratingName && <p className="mt-1 text-xs text-blue-600">Auto-generated from package and instructor.</p>}
                {errors.display_name && <p className="mt-1 text-xs text-rose-600" role="alert">{errors.display_name}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">Start Date</label>
                    <input type="date" value={formData.start_date} onChange={(s) => updateField('start_date', (s.target as HTMLInputElement).value)} className={`w-full rounded-md border px-3 py-2 text-sm ${errors.start_date ? 'border-rose-500' : 'border-gray-300'}`} />
                    {errors.start_date && <p className="mt-1 text-xs text-rose-600">{errors.start_date}</p>}
                </div>
                <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">End Date</label>
                    <input type="date" value={formData.end_date} onChange={(s) => updateField('end_date', (s.target as HTMLInputElement).value)} className={`w-full rounded-md border px-3 py-2 text-sm ${errors.end_date ? 'border-rose-500' : 'border-gray-300'}`} />
                    {errors.end_date && <p className="mt-1 text-xs text-rose-600">{errors.end_date}</p>}
                </div>
            </div>

            <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">Timezone</label>
                <select value={formData.timezone} onChange={(s) => updateField('timezone', (s.target as HTMLSelectElement).value)} className={`w-full rounded-md border px-3 py-2 text-sm ${errors.timezone ? 'border-rose-500' : 'border-gray-300'}`}>
                    <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                    <option value="America/New_York">America/New_York (EST)</option>
                    <option value="UTC">UTC</option>
                </select>
            </div>

            {isEditMode && (
                <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">Status</label>
                    <select value={formData.status} onChange={(s) => updateField('status', (s.target as HTMLSelectElement).value)} className="w-full rounded-md border px-3 py-2 text-sm">
                        <option value="draft">Draft</option>
                        <option value="active">Active</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                    </select>
                </div>
            )}

            <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={onCancel} disabled={isSubmitting} className="px-4 py-2 rounded-md border border-gray-300 text-sm">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="px-4 py-2 rounded-md bg-emerald-600 text-white text-sm">{isSubmitting ? 'Saving...' : isEditMode ? 'Save Changes' : 'Create Container'}</button>
            </div>
        </form>
    );
};

export default ContainerForm;
