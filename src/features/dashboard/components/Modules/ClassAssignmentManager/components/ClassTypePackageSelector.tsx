import { ClassType, FormData, Package } from '../types'

interface ClassTypePackageSelectorProps {
    formData: FormData
    classTypes: ClassType[]
    packages: Package[]
    onInputChange: (field: string, value: any) => void
    errors: Record<string, string>
}

export const ClassTypePackageSelector = ({
    formData,
    classTypes,
    packages,
    onInputChange,
    errors
}: ClassTypePackageSelectorProps) => {
    // Don't show for template assignments
    if (formData.assignment_type === 'weekly' && formData.selected_template_id) {
        return null
    }

    const showPackageSelector = ['crash_course', 'monthly', 'package'].includes(formData.assignment_type)
    const showClassTypeSelector = !showPackageSelector

    const getLabel = () => {
        switch (formData.assignment_type) {
            case 'crash_course':
                return 'Crash Course Package'
            case 'monthly':
                return 'Regular Package'
            case 'package':
                return 'Package'
            default:
                return 'Class Type'
        }
    }

    const getFilteredPackages = () => {
        switch (formData.assignment_type) {
            case 'crash_course':
                return packages.filter(p => p.course_type === 'crash')
            case 'monthly':
            case 'package':
                return packages.filter(p => p.course_type === 'regular')
            default:
                return packages
        }
    }

    return (
        <div>
            <label className="block text-sm font-medium text-gray-700">
                {getLabel()}
                <span className="text-red-500"> *</span>
            </label>

            {showClassTypeSelector && (
                <select
                    value={formData.class_type_id}
                    onChange={(e) => {
                        onInputChange('class_type_id', e.target.value)
                        onInputChange('package_id', '') // Clear package_id when using class type
                    }}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                    <option value="">Select Class Type</option>
                    {classTypes.map(classType => (
                        <option key={classType.id} value={classType.id}>
                            {classType.name} ({classType.difficulty_level})
                        </option>
                    ))}
                </select>
            )}

            {showPackageSelector && (
                <select
                    value={formData.package_id}
                    onChange={(e) => {
                        onInputChange('package_id', e.target.value)
                        onInputChange('class_type_id', '') // Clear class_type_id when using package
                    }}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                    <option value="">Select Package</option>
                    {getFilteredPackages().map(pkg => (
                        <option key={pkg.id} value={pkg.id}>
                            {pkg.name} - {pkg.class_count} classes
                        </option>
                    ))}
                </select>
            )}

            {errors.class_type_id && (
                <p className="text-red-500 text-sm mt-1">{errors.class_type_id}</p>
            )}
            {errors.package_id && (
                <p className="text-red-500 text-sm mt-1">{errors.package_id}</p>
            )}

            {/* Show selected package details */}
            {formData.package_id && showPackageSelector && (
                <div className="mt-2 p-2 bg-blue-50 rounded border">
                    {(() => {
                        const selectedPackage = packages.find(p => p.id === formData.package_id)
                        if (!selectedPackage) return null
                        return (
                            <div className="text-sm text-blue-800">
                                <p><strong>{selectedPackage.name}</strong></p>
                                <p>{selectedPackage.description}</p>
                                <p>Duration: {selectedPackage.duration}</p>
                                <p>Classes: {selectedPackage.class_count}</p>
                                <p>Price: —</p>
                                {selectedPackage.validity_days && (
                                    <p>Valid for: {selectedPackage.validity_days} days</p>
                                )}
                            </div>
                        )
                    })()}
                </div>
            )}
        </div>
    )
}