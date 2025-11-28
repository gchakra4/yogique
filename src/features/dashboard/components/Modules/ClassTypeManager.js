import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { Archive, Award, Edit, Eye, Package, Plus, RotateCcw, Save, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '../../../../shared/components/ui/Button';
import { LoadingSpinner } from '../../../../shared/components/ui/LoadingSpinner';
import { ResponsiveActionButton } from '../../../../shared/components/ui/ResponsiveActionButton';
import { supabase } from '../../../../shared/lib/supabase';
import { useAuth } from '../../../auth/contexts/AuthContext'; // Add this import
export function ClassTypeManager() {
    const { user } = useAuth(); // Add this
    const [classTypes, setClassTypes] = useState([]);
    const [archivedClassTypes, setArchivedClassTypes] = useState([]);
    const [packages, setPackages] = useState([]);
    const [archivedPackages, setArchivedPackages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [editingClassType, setEditingClassType] = useState(null);
    const [editingPackage, setEditingPackage] = useState(null);
    const [errors, setErrors] = useState({});
    const [mainTab, setMainTab] = useState('classtypes');
    const [activeTab, setActiveTab] = useState('active');
    const [userProfile, setUserProfile] = useState(null); // Update type
    const [durationNumber, setDurationNumber] = useState(1);
    const [durationUnit, setDurationUnit] = useState('weeks');
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        difficulty_level: 'beginner',
        price: 800,
        duration_minutes: 60,
        max_participants: 20,
        is_active: true,
        is_archived: false
    });
    const [packageFormData, setPackageFormData] = useState({
        name: '',
        description: '',
        class_count: 1,
        price: 800,
        validity_days: 90,
        class_type_restrictions: [],
        is_active: true,
        is_archived: false,
        type: 'Individual',
        course_type: 'regular',
        duration: ''
    });
    const difficultyLevels = [
        { value: 'beginner', label: 'Beginner' },
        { value: 'intermediate', label: 'Intermediate' },
        { value: 'advanced', label: 'Advanced' }
    ];
    const packageTypes = [
        { value: 'Individual', label: 'Individual' },
        { value: 'Corporate', label: 'Corporate' },
        { value: 'Private group', label: 'Private group' }
    ];
    const courseTypes = [
        { value: 'regular', label: 'Regular' },
        { value: 'crash', label: 'Crash' }
    ];
    const durationUnits = [
        { value: 'day', label: 'Day' },
        { value: 'days', label: 'Days' },
        { value: 'week', label: 'Week' },
        { value: 'weeks', label: 'Weeks' },
        { value: 'month', label: 'Month' },
        { value: 'months', label: 'Months' }
    ];
    // Add this useEffect to fetch user profile and check permissions from user_roles table
    useEffect(() => {
        const fetchUserProfile = async () => {
            if (user?.id) {
                try {
                    // First get the user's basic profile
                    const { data: profile, error: profileError } = await supabase
                        .from('profiles')
                        .select('*')
                        .eq('user_id', user.id)
                        .single();
                    if (profileError) {
                        console.error('Error fetching user profile:', profileError);
                        return;
                    }
                    // Then get the user's roles from user_roles table
                    const { data: userRoles, error: rolesError } = await supabase
                        .from('user_roles')
                        .select(`
              role_id,
              roles!inner(name)
            `)
                        .eq('user_id', user.id);
                    if (rolesError) {
                        console.error('Error fetching user roles:', rolesError);
                        setUserProfile({ ...profile, roles: [] });
                        return;
                    }
                    // Extract role names from the joined query - handle the actual structure safely
                    let roleNames = [];
                    if (userRoles && Array.isArray(userRoles)) {
                        roleNames = userRoles
                            .map((ur) => {
                            // Handle both possible structures
                            if (ur.roles && typeof ur.roles === 'object') {
                                return ur.roles.name;
                            }
                            return null;
                        })
                            .filter(Boolean); // Remove null values
                    }
                    console.log('Raw userRoles data:', userRoles); // Debug log to see actual structure
                    console.log('Extracted role names:', roleNames);
                    const profileWithRoles = {
                        ...profile,
                        roles: roleNames,
                        hasRole: (roleName) => roleNames.includes(roleName)
                    };
                    setUserProfile(profileWithRoles);
                    console.log('User profile:', profileWithRoles);
                    console.log('User roles:', roleNames);
                    // Check if user has required permissions
                    const allowedRoles = ['yoga_acharya', 'admin', 'super_admin'];
                    const hasRequiredRole = roleNames.some(role => allowedRoles.includes(role));
                    if (!hasRequiredRole) {
                        console.warn('User does not have required role for class management. Current roles:', roleNames);
                    }
                }
                catch (error) {
                    console.error('Error checking user permissions:', error);
                }
            }
        };
        fetchUserProfile();
    }, [user]);
    useEffect(() => {
        fetchClassTypes();
        fetchPackages();
    }, []);
    const fetchClassTypes = async () => {
        try {
            setLoading(true);
            // Fetch active classes (not archived)
            const { data: activeData, error: activeError } = await supabase
                .from('class_types')
                .select('*')
                .eq('is_archived', false)
                .order('name');
            if (activeError)
                throw activeError;
            // Fetch archived classes
            const { data: archivedData, error: archivedError } = await supabase
                .from('class_types')
                .select('*')
                .eq('is_archived', true)
                .order('archived_at', { ascending: false });
            if (archivedError)
                throw archivedError;
            setClassTypes(activeData || []);
            setArchivedClassTypes(archivedData || []);
        }
        catch (error) {
            console.error('Error fetching class types:', error);
        }
        finally {
            setLoading(false);
        }
    };
    const fetchPackages = async () => {
        try {
            setLoading(true);
            const { data: activeData, error: activeError } = await supabase
                .from('class_packages')
                .select('*')
                .eq('is_archived', false)
                .order('name');
            if (activeError)
                throw activeError;
            const { data: archivedData, error: archivedError } = await supabase
                .from('class_packages')
                .select('*')
                .eq('is_archived', true)
                .order('archived_at', { ascending: false });
            if (archivedError)
                throw archivedError;
            setPackages(activeData || []);
            setArchivedPackages(archivedData || []);
        }
        catch (error) {
            console.error('Error fetching packages:', error);
        }
        finally {
            setLoading(false);
        }
    };
    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors((prev) => ({ ...prev, [field]: '' }));
        }
    };
    const handlePackageInputChange = (field, value) => {
        setPackageFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors((prev) => ({ ...prev, [field]: '' }));
        }
    };
    const validateForm = () => {
        const newErrors = {};
        if (!formData.name.trim())
            newErrors.name = 'Name is required';
        if (!formData.description.trim())
            newErrors.description = 'Description is required';
        if (formData.price < 0)
            newErrors.price = 'Price cannot be negative';
        if (formData.duration_minutes < 15)
            newErrors.duration_minutes = 'Duration must be at least 15 minutes';
        if (formData.max_participants < 1)
            newErrors.max_participants = 'Max participants must be at least 1';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };
    const parseDuration = (duration) => {
        if (!duration)
            return { number: 1, unit: 'weeks' };
        const match = duration.match(/^(\d+)\s+(week|weeks|month|months|day|days)$/i);
        if (match) {
            return { number: parseInt(match[1]), unit: match[2].toLowerCase() };
        }
        return { number: 1, unit: 'weeks' };
    };
    const formatDuration = (number, unit) => {
        return `${number} ${unit}`;
    };
    const validatePackageForm = () => {
        const newErrors = {};
        if (!packageFormData.name.trim())
            newErrors.name = 'Name is required';
        if (packageFormData.class_count < 1)
            newErrors.class_count = 'Class count must be at least 1';
        if (packageFormData.price < 0)
            newErrors.price = 'Price cannot be negative';
        // Validation based on course type
        if (packageFormData.course_type === 'crash') {
            if (durationNumber < 1) {
                newErrors.duration = 'Duration number must be at least 1';
            }
            if (!durationUnit) {
                newErrors.duration = 'Duration unit is required for crash courses';
            }
        }
        else if (packageFormData.course_type === 'regular') {
            if (!packageFormData.validity_days || packageFormData.validity_days < 1) {
                newErrors.validity_days = 'Validity days must be at least 1 for regular courses';
            }
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };
    // Add permission check function
    const checkUserPermissions = () => {
        if (!user) {
            setErrors({ general: 'You must be logged in to perform this action' });
            return false;
        }
        if (!userProfile) {
            setErrors({ general: 'User profile not loaded. Please try again.' });
            return false;
        }
        const allowedRoles = ['yoga_acharya', 'admin', 'super_admin'];
        const userRoles = userProfile.roles || [];
        const hasRequiredRole = userRoles.some((role) => allowedRoles.includes(role));
        if (!hasRequiredRole) {
            setErrors({
                general: `Access denied. Required roles: ${allowedRoles.join(', ')}. Your roles: ${userRoles.join(', ') || 'none'}`
            });
            return false;
        }
        return true;
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm())
            return;
        // Check permissions before proceeding
        if (!checkUserPermissions())
            return;
        try {
            setSaving(true);
            if (editingClassType) {
                const { error } = await supabase
                    .from('class_types')
                    .update({
                    ...formData,
                    updated_by: user?.id,
                    updated_at: new Date().toISOString()
                })
                    .eq('id', editingClassType.id);
                if (error)
                    throw error;
            }
            else {
                // For new class types, include user tracking fields
                const classTypeData = {
                    ...formData,
                    is_archived: false,
                    created_by: user?.id,
                    updated_by: user?.id,
                };
                console.log('Inserting class type with data:', classTypeData);
                console.log('Current user:', user);
                console.log('User profile role:', userProfile?.role);
                const { error } = await supabase
                    .from('class_types')
                    .insert([classTypeData]);
                if (error) {
                    console.error('Insert error:', error);
                    throw error;
                }
            }
            await fetchClassTypes();
            resetForm();
            alert(editingClassType ? 'Class type updated successfully!' : 'Class type created successfully!');
        }
        catch (error) {
            console.error('Error saving class type:', error);
            // More specific error handling for RLS
            if (error.message.includes('row-level security') || error.message.includes('policy')) {
                setErrors({
                    general: `Permission denied. Please ensure you have the required role (yoga_acharya, admin, or super_admin). Current roles: ${userProfile?.roles?.join(', ') || 'none'}`
                });
            }
            else {
                setErrors({ general: error.message });
            }
        }
        finally {
            setSaving(false);
        }
    };
    const handlePackageSubmit = async (e) => {
        e.preventDefault();
        if (!validatePackageForm())
            return;
        if (!checkUserPermissions())
            return;
        try {
            setSaving(true);
            // Prepare data based on course type
            const packageData = {
                ...packageFormData,
                // For crash courses, set validity_days to null and ensure duration is set
                validity_days: packageFormData.course_type === 'crash' ? null : packageFormData.validity_days,
                // For regular courses, set duration to null
                duration: packageFormData.course_type === 'regular' ? null : formatDuration(durationNumber, durationUnit)
            };
            if (editingPackage) {
                const { error } = await supabase
                    .from('class_packages')
                    .update(packageData)
                    .eq('id', editingPackage.id);
                if (error)
                    throw error;
            }
            else {
                const newPackageData = {
                    ...packageData
                    // is_archived has a default value of false in the database
                };
                const { error } = await supabase
                    .from('class_packages')
                    .insert([newPackageData]);
                if (error)
                    throw error;
            }
            await fetchPackages();
            resetForm();
            alert(editingPackage ? 'Package updated successfully!' : 'Package created successfully!');
        }
        catch (error) {
            console.error('Error saving package:', error);
            if (error.message.includes('row-level security') || error.message.includes('policy')) {
                setErrors({
                    general: `Permission denied. Please ensure you have the required role (yoga_acharya, admin, or super_admin). Current roles: ${userProfile?.roles?.join(', ') || 'none'}`
                });
            }
            else {
                setErrors({ general: error.message });
            }
        }
        finally {
            setSaving(false);
        }
    };
    const handleEdit = (classType) => {
        if (!checkUserPermissions())
            return;
        setEditingClassType(classType);
        setFormData({ ...classType });
        setShowForm(true);
    };
    const handleArchive = async (id) => {
        if (!checkUserPermissions())
            return;
        if (!confirm('Are you sure you want to archive this class type? It will be moved to the archived section and all related schedules will be deactivated.'))
            return;
        try {
            setLoading(true);
            // Archive the class type
            const { error: classTypeError } = await supabase
                .from('class_types')
                .update({
                is_archived: true,
                is_active: false,
                archived_at: new Date().toISOString(),
                updated_by: user?.id
            })
                .eq('id', id);
            if (classTypeError)
                throw classTypeError;
            // Deactivate all related class schedules
            const { error: schedulesError } = await supabase
                .from('class_schedules')
                .update({
                is_active: false,
                effective_until: new Date().toISOString().split('T')[0]
            })
                .eq('class_type_id', id);
            if (schedulesError) {
                console.error('Error deactivating schedules:', schedulesError);
                // Continue anyway, class type is already archived
            }
            await fetchClassTypes();
            alert('Class type archived successfully!');
        }
        catch (error) {
            console.error('Error archiving class type:', error);
            alert(`Failed to archive class type: ${error.message}`);
        }
        finally {
            setLoading(false);
        }
    };
    const handleUnarchive = async (id) => {
        if (!checkUserPermissions())
            return;
        if (!confirm('Are you sure you want to restore this class type from the archive?'))
            return;
        try {
            setLoading(true);
            const { error } = await supabase
                .from('class_types')
                .update({
                is_archived: false,
                is_active: true,
                archived_at: null,
                updated_by: user?.id
            })
                .eq('id', id);
            if (error)
                throw error;
            await fetchClassTypes();
            alert('Class type restored successfully!');
        }
        catch (error) {
            console.error('Error restoring class type:', error);
            alert(`Failed to restore class type: ${error.message}`);
        }
        finally {
            setLoading(false);
        }
    };
    const handleEditPackage = (pkg) => {
        if (!checkUserPermissions())
            return;
        setEditingPackage(pkg);
        setPackageFormData({ ...pkg });
        // Parse duration if it exists
        if (pkg.duration) {
            const parsed = parseDuration(pkg.duration);
            setDurationNumber(parsed.number);
            setDurationUnit(parsed.unit);
        }
        else {
            setDurationNumber(1);
            setDurationUnit('weeks');
        }
        setShowForm(true);
    };
    const handleArchivePackage = async (id) => {
        if (!checkUserPermissions())
            return;
        if (!confirm('Are you sure you want to archive this package? It will be moved to the archived section.'))
            return;
        try {
            setLoading(true);
            const { error } = await supabase
                .from('class_packages')
                .update({
                is_archived: true,
                is_active: false,
                archived_at: new Date().toISOString()
            })
                .eq('id', id);
            if (error)
                throw error;
            await fetchPackages();
            alert('Package archived successfully!');
        }
        catch (error) {
            console.error('Error archiving package:', error);
            alert(`Failed to archive package: ${error.message}`);
        }
        finally {
            setLoading(false);
        }
    };
    const handleUnarchivePackage = async (id) => {
        if (!checkUserPermissions())
            return;
        if (!confirm('Are you sure you want to restore this package from the archive?'))
            return;
        try {
            setLoading(true);
            const { error } = await supabase
                .from('class_packages')
                .update({
                is_archived: false,
                is_active: true,
                archived_at: null
            })
                .eq('id', id);
            if (error)
                throw error;
            await fetchPackages();
            alert('Package restored successfully!');
        }
        catch (error) {
            console.error('Error restoring package:', error);
            alert(`Failed to restore package: ${error.message}`);
        }
        finally {
            setLoading(false);
        }
    };
    const resetForm = () => {
        setFormData({
            name: '',
            description: '',
            difficulty_level: 'beginner',
            price: 800,
            duration_minutes: 60,
            max_participants: 20,
            is_active: true,
            is_archived: false
        });
        setPackageFormData({
            name: '',
            description: '',
            class_count: 1,
            price: 800,
            validity_days: 90,
            class_type_restrictions: [],
            is_active: true,
            is_archived: false,
            type: 'Individual',
            course_type: 'regular',
            duration: ''
        });
        setEditingClassType(null);
        setEditingPackage(null);
        setDurationNumber(1);
        setDurationUnit('weeks');
        setShowForm(false);
        setErrors({});
    };
    const getDifficultyColor = (level) => {
        switch (level) {
            case 'beginner': return 'bg-green-100 text-green-800';
            case 'intermediate': return 'bg-yellow-100 text-yellow-800';
            case 'advanced': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };
    const formatPrice = (price) => {
        return `₹${price}`;
    };
    const formatArchiveDate = (dateString) => {
        if (!dateString)
            return 'Unknown';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };
    const getTypeColor = (type) => {
        switch (type) {
            case 'Individual': return 'bg-blue-100 text-blue-800';
            case 'Corporate': return 'bg-purple-100 text-purple-800';
            case 'Private group': return 'bg-green-100 text-green-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };
    const getCourseTypeColor = (courseType) => {
        switch (courseType) {
            case 'regular': return 'bg-green-100 text-green-800';
            case 'crash': return 'bg-orange-100 text-orange-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };
    const formatCourseType = (courseType) => {
        switch (courseType) {
            case 'regular': return 'Regular';
            case 'crash': return 'Crash';
            default: return courseType;
        }
    };
    // Add role check for UI elements
    const canManageClasses = userProfile && userProfile.roles &&
        userProfile.roles.some((role) => ['yoga_acharya', 'admin', 'super_admin'].includes(role));
    if (loading) {
        return (_jsx("div", { className: "flex justify-center py-12", children: _jsx(LoadingSpinner, { size: "lg" }) }));
    }
    // Show access denied message if user doesn't have required role
    if (!canManageClasses) {
        return (_jsx("div", { className: "text-center py-12", children: _jsxs("div", { className: "bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto", children: [_jsx("h3", { className: "text-lg font-semibold text-red-900 mb-2", children: "Access Denied" }), _jsx("p", { className: "text-red-700", children: "You need yoga_acharya, admin, or super_admin role to manage class types." }), _jsxs("p", { className: "text-sm text-red-600 mt-2", children: ["Current roles: ", userProfile?.roles?.join(', ') || 'No roles assigned'] })] }) }));
    }
    return (_jsxs("div", { className: "space-y-6 px-4 sm:px-0", children: [_jsxs("div", { className: "flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3", children: [_jsxs("h2", { className: "text-2xl font-bold text-gray-900 flex items-center min-w-0", children: [_jsx(Award, { className: "w-6 h-6 mr-2" }), "Class & Package Manager", _jsx("span", { className: "ml-2 text-sm bg-blue-100 text-blue-600 px-2 py-1 rounded", children: userProfile?.roles?.join(', ') || 'No roles' })] }), _jsx("div", { className: "flex items-center space-x-2 flex-wrap", children: _jsxs("div", { className: "flex bg-gray-200 rounded-lg p-1", children: [_jsxs("button", { onClick: () => setMainTab('classtypes'), className: `px-3 sm:px-4 py-1 sm:py-2 rounded-md text-sm font-medium transition-colors ${mainTab === 'classtypes'
                                        ? 'bg-white text-blue-600 shadow-sm'
                                        : 'text-gray-600 hover:text-gray-900'}`, children: [_jsx(Award, { className: "w-4 h-4 mr-1 inline" }), "Class Types"] }), _jsxs("button", { onClick: () => setMainTab('packages'), className: `px-3 sm:px-4 py-1 sm:py-2 rounded-md text-sm font-medium transition-colors ${mainTab === 'packages'
                                        ? 'bg-white text-blue-600 shadow-sm'
                                        : 'text-gray-600 hover:text-gray-900'}`, children: [_jsx(Package, { className: "w-4 h-4 mr-1 inline" }), "Packages"] })] }) })] }), _jsxs("div", { className: "flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4", children: [_jsx("div", {}), _jsxs("div", { className: "flex items-center space-x-2 flex-wrap", children: [_jsxs("div", { className: "flex bg-gray-100 rounded-lg p-1", children: [_jsxs("button", { onClick: () => setActiveTab('active'), className: `px-3 sm:px-4 py-1 sm:py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'active'
                                            ? 'bg-white text-blue-600 shadow-sm'
                                            : 'text-gray-600 hover:text-gray-900'}`, children: ["Active ", mainTab === 'classtypes' ? 'Classes' : 'Packages', " (", mainTab === 'classtypes' ? classTypes.length : packages.length, ")"] }), _jsxs("button", { onClick: () => setActiveTab('archived'), className: `px-3 sm:px-4 py-1 sm:py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'archived'
                                            ? 'bg-white text-blue-600 shadow-sm'
                                            : 'text-gray-600 hover:text-gray-900'}`, children: [_jsx(Archive, { className: "w-4 h-4 mr-1 inline" }), "Archived (", mainTab === 'classtypes' ? archivedClassTypes.length : archivedPackages.length, ")"] })] }), activeTab === 'active' && (_jsxs(_Fragment, { children: [_jsx("div", { className: "flex items-center", children: _jsxs(ResponsiveActionButton, { onClick: () => setShowForm(true), className: "hidden sm:inline-flex items-center mt-0 ml-3", children: [_jsx(Plus, { className: "w-4 h-4 mr-2" }), "Add ", mainTab === 'classtypes' ? 'Class Type' : 'Package'] }) }), _jsx("div", { className: "sm:hidden w-full mt-3 flex justify-center", children: _jsxs(ResponsiveActionButton, { onClick: () => setShowForm(true), className: "inline-flex items-center px-3 py-2 text-sm", children: [_jsx(Plus, { className: "w-4 h-4 mr-2" }), "Add ", mainTab === 'classtypes' ? 'Class Type' : 'Package'] }) })] }))] })] }), showForm && (_jsx("div", { className: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50", children: _jsxs("div", { className: "bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto", children: [_jsx("div", { className: "p-6 border-b border-gray-200", children: _jsxs("div", { className: "flex justify-between items-center", children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900", children: mainTab === 'classtypes'
                                            ? (editingClassType ? 'Edit Class Type' : 'Add New Class Type')
                                            : (editingPackage ? 'Edit Package' : 'Add New Package') }), _jsx("button", { onClick: resetForm, className: "text-gray-400 hover:text-gray-600", children: _jsx(X, { className: "w-5 h-5" }) })] }) }), _jsxs("form", { onSubmit: mainTab === 'classtypes' ? handleSubmit : handlePackageSubmit, className: "p-6 space-y-6", children: [errors.general && (_jsx("div", { className: "bg-red-50 border border-red-200 rounded-lg p-3", children: _jsx("p", { className: "text-red-600 text-sm", children: errors.general }) })), mainTab === 'classtypes' && (_jsxs(_Fragment, { children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Class Name *" }), _jsx("input", { type: "text", value: formData.name, onChange: (e) => handleInputChange('name', e.target.value), className: `w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.name ? 'border-red-500' : 'border-gray-300'}`, placeholder: "e.g., Hatha Yoga, Vinyasa Flow" }), errors.name && _jsx("p", { className: "text-red-500 text-sm mt-1", children: errors.name })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Description *" }), _jsx("textarea", { value: formData.description, onChange: (e) => handleInputChange('description', e.target.value), rows: 3, className: `w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.description ? 'border-red-500' : 'border-gray-300'}`, placeholder: "Describe the class style, benefits, and what students can expect" }), errors.description && _jsx("p", { className: "text-red-500 text-sm mt-1", children: errors.description })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Difficulty Level *" }), _jsx("select", { value: formData.difficulty_level, onChange: (e) => handleInputChange('difficulty_level', e.target.value), className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500", children: difficultyLevels.map(level => (_jsx("option", { value: level.value, children: level.label }, level.value))) })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Price (\u20B9) *" }), _jsx("input", { type: "number", value: formData.price, onChange: (e) => handleInputChange('price', parseFloat(e.target.value) || 0), min: "0", step: "1", className: `w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.price ? 'border-red-500' : 'border-gray-300'}`, placeholder: "800" }), errors.price && _jsx("p", { className: "text-red-500 text-sm mt-1", children: errors.price }), _jsx("p", { className: "text-xs text-gray-500 mt-1", children: "Weekly classes for \u20B9800/month" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Duration (minutes) *" }), _jsx("input", { type: "number", value: formData.duration_minutes, onChange: (e) => handleInputChange('duration_minutes', parseInt(e.target.value) || 0), min: "15", max: "180", className: `w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.duration_minutes ? 'border-red-500' : 'border-gray-300'}` }), errors.duration_minutes && _jsx("p", { className: "text-red-500 text-sm mt-1", children: errors.duration_minutes })] })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Max Participants *" }), _jsx("input", { type: "number", value: formData.max_participants, onChange: (e) => handleInputChange('max_participants', parseInt(e.target.value) || 0), min: "1", max: "50", className: `w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.max_participants ? 'border-red-500' : 'border-gray-300'}` }), errors.max_participants && _jsx("p", { className: "text-red-500 text-sm mt-1", children: errors.max_participants })] }), _jsxs("div", { className: "flex items-center pt-6", children: [_jsx("input", { type: "checkbox", id: "is_active", checked: formData.is_active, onChange: (e) => handleInputChange('is_active', e.target.checked), className: "h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" }), _jsx("label", { htmlFor: "is_active", className: "ml-2 block text-sm text-gray-900", children: "Active Class Type" })] })] })] })), mainTab === 'packages' && (_jsxs(_Fragment, { children: [_jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Package Name *" }), _jsx("input", { type: "text", value: packageFormData.name, onChange: (e) => handlePackageInputChange('name', e.target.value), className: `w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.name ? 'border-red-500' : 'border-gray-300'}`, placeholder: "e.g., Monthly Unlimited, 8-Class Package" }), errors.name && _jsx("p", { className: "text-red-500 text-sm mt-1", children: errors.name })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Package Type *" }), _jsx("select", { value: packageFormData.type, onChange: (e) => handlePackageInputChange('type', e.target.value), className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500", children: packageTypes.map(type => (_jsx("option", { value: type.value, children: type.label }, type.value))) })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Description" }), _jsx("textarea", { value: packageFormData.description || '', onChange: (e) => handlePackageInputChange('description', e.target.value), rows: 3, className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500", placeholder: "Describe the package benefits and features" })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Course Type *" }), _jsx("select", { value: packageFormData.course_type, onChange: (e) => handlePackageInputChange('course_type', e.target.value), className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500", children: courseTypes.map(type => (_jsx("option", { value: type.value, children: type.label }, type.value))) })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Class Count *" }), _jsx("input", { type: "number", value: packageFormData.class_count, onChange: (e) => handlePackageInputChange('class_count', parseInt(e.target.value) || 0), min: "1", className: `w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.class_count ? 'border-red-500' : 'border-gray-300'}` }), errors.class_count && _jsx("p", { className: "text-red-500 text-sm mt-1", children: errors.class_count })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Price (\u20B9) *" }), _jsx("input", { type: "number", value: packageFormData.price, onChange: (e) => handlePackageInputChange('price', parseFloat(e.target.value) || 0), min: "0", step: "1", className: `w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.price ? 'border-red-500' : 'border-gray-300'}` }), errors.price && _jsx("p", { className: "text-red-500 text-sm mt-1", children: errors.price })] })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [packageFormData.course_type === 'regular' && (_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Validity Days *" }), _jsx("input", { type: "number", value: packageFormData.validity_days, onChange: (e) => handlePackageInputChange('validity_days', parseInt(e.target.value) || 0), min: "1", className: `w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.validity_days ? 'border-red-500' : 'border-gray-300'}`, placeholder: "90" }), errors.validity_days && _jsx("p", { className: "text-red-500 text-sm mt-1", children: errors.validity_days }), _jsx("p", { className: "text-xs text-gray-500 mt-1", children: "Number of days package remains valid" })] })), packageFormData.course_type === 'crash' && (_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Duration *" }), _jsxs("div", { className: "flex gap-2", children: [_jsx("input", { type: "number", value: durationNumber, onChange: (e) => setDurationNumber(parseInt(e.target.value) || 1), min: "1", className: `w-1/2 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.duration ? 'border-red-500' : 'border-gray-300'}`, placeholder: "1" }), _jsx("select", { value: durationUnit, onChange: (e) => setDurationUnit(e.target.value), className: `w-1/2 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.duration ? 'border-red-500' : 'border-gray-300'}`, children: durationUnits.map(unit => (_jsx("option", { value: unit.value, children: unit.label }, unit.value))) })] }), errors.duration && _jsx("p", { className: "text-red-500 text-sm mt-1", children: errors.duration }), _jsx("p", { className: "text-xs text-gray-500 mt-1", children: "Select duration number and time unit" })] })), _jsxs("div", { className: "flex items-center pt-6", children: [_jsx("input", { type: "checkbox", id: "package_is_active", checked: packageFormData.is_active, onChange: (e) => handlePackageInputChange('is_active', e.target.checked), className: "h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" }), _jsx("label", { htmlFor: "package_is_active", className: "ml-2 block text-sm text-gray-900", children: "Active Package" })] })] })] })), _jsxs("div", { className: "flex justify-end space-x-3 pt-4", children: [_jsx(Button, { type: "button", variant: "outline", onClick: resetForm, children: "Cancel" }), _jsxs(Button, { type: "submit", loading: saving, className: "flex items-center", children: [_jsx(Save, { className: "w-4 h-4 mr-2" }), saving ? 'Saving...' :
                                                    mainTab === 'classtypes'
                                                        ? (editingClassType ? 'Update' : 'Create')
                                                        : (editingPackage ? 'Update' : 'Create')] })] })] })] }) })), activeTab === 'active' && (_jsx("div", { className: "bg-white rounded-xl shadow-lg overflow-hidden", children: (mainTab === 'classtypes' ? classTypes.length === 0 : packages.length === 0) ? (_jsxs("div", { className: "text-center py-12", children: [_jsx(Award, { className: "w-16 h-16 text-gray-400 mx-auto mb-4" }), _jsxs("h3", { className: "text-lg font-semibold text-gray-900 mb-2", children: ["No active ", mainTab === 'classtypes' ? 'class types' : 'packages'] }), _jsxs("p", { className: "text-gray-600 mb-4", children: ["Create your first ", mainTab === 'classtypes' ? 'class type' : 'package', " to get started."] }), _jsxs("div", { className: "flex items-center justify-center", children: [_jsxs(ResponsiveActionButton, { onClick: () => setShowForm(true), className: "hidden sm:inline-flex mt-4", children: [_jsx(Plus, { className: "w-4 h-4 mr-2" }), "Add ", mainTab === 'classtypes' ? 'Class Type' : 'Package'] }), _jsxs(ResponsiveActionButton, { onClick: () => setShowForm(true), className: "sm:hidden mt-4 inline-flex items-center px-3 py-2 text-sm", children: [_jsx(Plus, { className: "w-4 h-4 mr-2" }), "Add"] })] })] })) : (_jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-4 sm:p-6", children: [mainTab === 'classtypes' && classTypes.map((classType) => (_jsxs("div", { className: `border rounded-lg p-4 sm:p-6 hover:shadow-md transition-shadow ${classType.is_active ? 'border-gray-200' : 'border-gray-300 bg-gray-50'}`, children: [_jsxs("div", { className: "flex justify-between items-start mb-4", children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900", children: classType.name }), _jsxs("div", { className: "flex space-x-1", children: [_jsx("button", { onClick: () => handleEdit(classType), className: "text-blue-600 hover:text-blue-800 p-1", title: "Edit", children: _jsx(Edit, { className: "w-4 h-4" }) }), _jsx("button", { onClick: () => handleArchive(classType.id), className: "text-orange-600 hover:text-orange-800 p-1", title: "Archive Class", children: _jsx(Archive, { className: "w-4 h-4" }) })] })] }), _jsx("p", { className: "text-gray-600 text-sm mb-4", children: classType.description }), _jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "flex justify-between items-center", children: [_jsx("span", { className: "text-sm text-gray-500", children: "Difficulty:" }), _jsx("span", { className: `px-2 py-1 rounded text-xs ${getDifficultyColor(classType.difficulty_level)}`, children: classType.difficulty_level })] }), _jsxs("div", { className: "flex justify-between items-center", children: [_jsx("span", { className: "text-sm text-gray-500", children: "Price:" }), _jsx("span", { className: "font-semibold text-green-600", children: formatPrice(classType.price) })] }), _jsxs("div", { className: "flex justify-between items-center", children: [_jsx("span", { className: "text-sm text-gray-500", children: "Duration:" }), _jsxs("span", { className: "text-sm", children: [classType.duration_minutes, " min"] })] }), _jsxs("div", { className: "flex justify-between items-center", children: [_jsx("span", { className: "text-sm text-gray-500", children: "Max Participants:" }), _jsx("span", { className: "text-sm", children: classType.max_participants })] }), _jsxs("div", { className: "flex justify-between items-center", children: [_jsx("span", { className: "text-sm text-gray-500", children: "Status:" }), _jsx("span", { className: `px-2 py-1 rounded text-xs ${classType.is_active
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-gray-100 text-gray-800'}`, children: classType.is_active ? 'Active' : 'Inactive' })] })] }), classType.price === 800 && (_jsx("div", { className: "mt-3 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-800", children: "\uD83D\uDCA1 Weekly classes for \u20B9800/month" }))] }, classType.id))), mainTab === 'packages' && packages.map((pkg) => (_jsxs("div", { className: `border rounded-lg p-4 sm:p-6 hover:shadow-md transition-shadow ${pkg.is_active ? 'border-gray-200' : 'border-gray-300 bg-gray-50'}`, children: [_jsxs("div", { className: "flex justify-between items-start mb-4", children: [_jsxs("div", { children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900", children: pkg.name }), _jsxs("div", { className: "flex space-x-2 mt-2", children: [_jsx("span", { className: `px-2 py-1 rounded text-xs ${getTypeColor(pkg.type || '')}`, children: pkg.type }), _jsx("span", { className: `px-2 py-1 rounded text-xs ${getCourseTypeColor(pkg.course_type || '')}`, children: formatCourseType(pkg.course_type || '') })] })] }), _jsxs("div", { className: "flex space-x-1", children: [_jsx("button", { onClick: () => handleEditPackage(pkg), className: "text-blue-600 hover:text-blue-800 p-1", title: "Edit", children: _jsx(Edit, { className: "w-4 h-4" }) }), _jsx("button", { onClick: () => handleArchivePackage(pkg.id), className: "text-orange-600 hover:text-orange-800 p-1", title: "Archive Package", children: _jsx(Archive, { className: "w-4 h-4" }) })] })] }), pkg.description && (_jsx("p", { className: "text-gray-600 text-sm mb-4", children: pkg.description })), _jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "flex justify-between items-center", children: [_jsx("span", { className: "text-sm text-gray-500", children: "Class Count:" }), _jsx("span", { className: "font-medium", children: pkg.class_count })] }), _jsxs("div", { className: "flex justify-between items-center", children: [_jsx("span", { className: "text-sm text-gray-500", children: "Price:" }), _jsx("span", { className: "font-semibold text-green-600", children: formatPrice(pkg.price) })] }), pkg.course_type === 'regular' && (_jsxs("div", { className: "flex justify-between items-center", children: [_jsx("span", { className: "text-sm text-gray-500", children: "Validity:" }), _jsxs("span", { className: "text-sm", children: [pkg.validity_days, " days"] })] })), pkg.course_type === 'crash' && pkg.duration && (_jsxs("div", { className: "flex justify-between items-center", children: [_jsx("span", { className: "text-sm text-gray-500", children: "Duration:" }), _jsx("span", { className: "text-sm", children: pkg.duration })] })), _jsxs("div", { className: "flex justify-between items-center", children: [_jsx("span", { className: "text-sm text-gray-500", children: "Status:" }), _jsx("span", { className: `px-2 py-1 rounded text-xs ${pkg.is_active
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-gray-100 text-gray-800'}`, children: pkg.is_active ? 'Active' : 'Inactive' })] })] }), pkg.course_type === 'crash' && (_jsx("div", { className: "mt-3 p-2 bg-orange-50 border border-orange-200 rounded text-xs text-orange-800", children: "\u26A1 Crash Course - Intensive training program" }))] }, pkg.id)))] })) })), activeTab === 'archived' && (_jsx("div", { className: "bg-white rounded-xl shadow-lg overflow-hidden", children: (mainTab === 'classtypes' ? archivedClassTypes.length === 0 : archivedPackages.length === 0) ? (_jsxs("div", { className: "text-center py-12", children: [_jsx(Archive, { className: "w-16 h-16 text-gray-400 mx-auto mb-4" }), _jsxs("h3", { className: "text-lg font-semibold text-gray-900 mb-2", children: ["No archived ", mainTab === 'classtypes' ? 'class types' : 'packages'] }), _jsxs("p", { className: "text-gray-600", children: ["Archived ", mainTab === 'classtypes' ? 'class types' : 'packages', " will appear here for future reference."] })] })) : (_jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-4 sm:p-6", children: [mainTab === 'classtypes' && archivedClassTypes.map((classType) => (_jsxs("div", { className: "border border-orange-200 bg-orange-50 rounded-lg p-4 sm:p-6 hover:shadow-md transition-shadow", children: [_jsxs("div", { className: "flex justify-between items-start mb-4", children: [_jsxs("div", { children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900", children: classType.name }), _jsxs("p", { className: "text-xs text-orange-600 mt-1", children: ["\uD83D\uDCE6 Archived on ", formatArchiveDate(classType.archived_at)] })] }), _jsxs("div", { className: "flex space-x-1", children: [_jsx("button", { onClick: () => handleEdit(classType), className: "text-blue-600 hover:text-blue-800 p-1", title: "View Details", children: _jsx(Eye, { className: "w-4 h-4" }) }), _jsx("button", { onClick: () => handleUnarchive(classType.id), className: "text-green-600 hover:text-green-800 p-1", title: "Restore from Archive", children: _jsx(RotateCcw, { className: "w-4 h-4" }) })] })] }), _jsx("p", { className: "text-gray-600 text-sm mb-4", children: classType.description }), _jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "flex justify-between items-center", children: [_jsx("span", { className: "text-sm text-gray-500", children: "Difficulty:" }), _jsx("span", { className: `px-2 py-1 rounded text-xs ${getDifficultyColor(classType.difficulty_level)}`, children: classType.difficulty_level })] }), _jsxs("div", { className: "flex justify-between items-center", children: [_jsx("span", { className: "text-sm text-gray-500", children: "Price:" }), _jsx("span", { className: "font-semibold text-green-600", children: formatPrice(classType.price) })] }), _jsxs("div", { className: "flex justify-between items-center", children: [_jsx("span", { className: "text-sm text-gray-500", children: "Duration:" }), _jsxs("span", { className: "text-sm", children: [classType.duration_minutes, " min"] })] }), _jsxs("div", { className: "flex justify-between items-center", children: [_jsx("span", { className: "text-sm text-gray-500", children: "Max Participants:" }), _jsx("span", { className: "text-sm", children: classType.max_participants })] }), _jsxs("div", { className: "flex justify-between items-center", children: [_jsx("span", { className: "text-sm text-gray-500", children: "Status:" }), _jsx("span", { className: "px-2 py-1 rounded text-xs bg-orange-100 text-orange-800", children: "Archived" })] })] }), _jsx("div", { className: "mt-3 p-2 bg-orange-100 border border-orange-200 rounded text-xs text-orange-800", children: "\uD83D\uDCE6 This class is archived. Click restore to make it active again." })] }, classType.id))), mainTab === 'packages' && archivedPackages.map((pkg) => (_jsxs("div", { className: "border border-orange-200 bg-orange-50 rounded-lg p-4 sm:p-6 hover:shadow-md transition-shadow", children: [_jsxs("div", { className: "flex justify-between items-start mb-4", children: [_jsxs("div", { children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900", children: pkg.name }), _jsxs("p", { className: "text-xs text-orange-600 mt-1", children: ["\uD83D\uDCE6 Archived on ", formatArchiveDate(pkg.archived_at)] }), _jsxs("div", { className: "flex space-x-2 mt-2", children: [_jsx("span", { className: `px-2 py-1 rounded text-xs ${getTypeColor(pkg.type || '')}`, children: pkg.type }), _jsx("span", { className: `px-2 py-1 rounded text-xs ${getCourseTypeColor(pkg.course_type || '')}`, children: formatCourseType(pkg.course_type || '') })] })] }), _jsxs("div", { className: "flex space-x-1", children: [_jsx("button", { onClick: () => handleEditPackage(pkg), className: "text-blue-600 hover:text-blue-800 p-1", title: "View Details", children: _jsx(Eye, { className: "w-4 h-4" }) }), _jsx("button", { onClick: () => handleUnarchivePackage(pkg.id), className: "text-green-600 hover:text-green-800 p-1", title: "Restore from Archive", children: _jsx(RotateCcw, { className: "w-4 h-4" }) })] })] }), pkg.description && (_jsx("p", { className: "text-gray-600 text-sm mb-4", children: pkg.description })), _jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "flex justify-between items-center", children: [_jsx("span", { className: "text-sm text-gray-500", children: "Class Count:" }), _jsx("span", { className: "font-medium", children: pkg.class_count })] }), _jsxs("div", { className: "flex justify-between items-center", children: [_jsx("span", { className: "text-sm text-gray-500", children: "Price:" }), _jsx("span", { className: "font-semibold text-green-600", children: formatPrice(pkg.price) })] }), pkg.course_type === 'regular' && (_jsxs("div", { className: "flex justify-between items-center", children: [_jsx("span", { className: "text-sm text-gray-500", children: "Validity:" }), _jsxs("span", { className: "text-sm", children: [pkg.validity_days, " days"] })] })), pkg.course_type === 'crash' && pkg.duration && (_jsxs("div", { className: "flex justify-between items-center", children: [_jsx("span", { className: "text-sm text-gray-500", children: "Duration:" }), _jsx("span", { className: "text-sm", children: pkg.duration })] })), _jsxs("div", { className: "flex justify-between items-center", children: [_jsx("span", { className: "text-sm text-gray-500", children: "Status:" }), _jsx("span", { className: "px-2 py-1 rounded text-xs bg-orange-100 text-orange-800", children: "Archived" })] })] }), _jsx("div", { className: "mt-3 p-2 bg-orange-100 border border-orange-200 rounded text-xs text-orange-800", children: "\uD83D\uDCE6 This package is archived. Click restore to make it active again." })] }, pkg.id)))] })) }))] }));
}
export default ClassTypeManager;
