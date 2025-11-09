import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { AlertTriangle, Check, Clock, Shield, User } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '../../../../shared/components/ui/Button';
import { supabase } from '../../../../shared/lib/supabase';
export function UserRoleManagement({ userId, userEmail, currentRoles, onRoleUpdate, onClose }) {
    const [availableRoles, setAvailableRoles] = useState([]);
    const [selectedRoles, setSelectedRoles] = useState(currentRoles || []);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [roleChanges, setRoleChanges] = useState([]);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    // Initialize selectedRoles with currentRoles on mount
    useEffect(() => {
        setSelectedRoles([...(currentRoles || [])]);
    }, [currentRoles]);
    useEffect(() => {
        // Reset selected roles to match current roles on component mount or when currentRoles changes
        setSelectedRoles([...(currentRoles || [])]);
        // Then fetch other data
        fetchAvailableRoles();
        fetchRoleChangeHistory();
    }, [userId, currentRoles]);
    const fetchAvailableRoles = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('roles')
                .select('*')
                .order('name');
            if (error)
                throw error;
            setAvailableRoles(data || []);
        }
        catch (err) {
            console.error('Error fetching roles:', err.message);
            setError('Failed to load available roles');
        }
        finally {
            setLoading(false);
        }
    };
    const fetchRoleChangeHistory = async () => {
        // For now we're using mock data, but this would typically fetch from a role_changes table
        try {
            // This would normally fetch from a role_changes table
            // For demo purposes, we're using mock data
            const mockRoleChanges = [
                {
                    timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
                    changed_by: 'admin@Yogique.com',
                    old_role: 'user',
                    new_role: 'instructor'
                }
            ];
            setRoleChanges(mockRoleChanges);
        }
        catch (err) {
            console.error('Error fetching role history:', err.message);
        }
    };
    const handleRoleToggle = (roleName) => {
        setSelectedRoles(prev => {
            setError(''); // Clear any previous errors
            if (prev.includes(roleName)) {
                // Don't allow removing all roles - user must have at least one role
                if (prev.length > 1) {
                    return prev.filter(r => r !== roleName);
                }
                else {
                    setError("User must have at least one role");
                    return prev;
                }
            }
            else {
                return [...prev, roleName];
            }
        });
    };
    const handleUpdateRoles = async () => {
        if (selectedRoles.length === 0) {
            setError('User must have at least one role');
            return;
        }
        setUpdating(true);
        setError('');
        setSuccess('');
        console.log('🔄 Starting role update process...');
        console.log('📋 User ID:', userId);
        console.log('📧 User Email:', userEmail);
        console.log('🔄 Current roles:', currentRoles);
        console.log('✅ Selected roles:', selectedRoles);
        try {
            // Get the current user ID at the beginning of the function
            const currentUser = await supabase.auth.getUser();
            const assignedById = currentUser.data.user?.id || null;
            console.log('👤 Assigned by user ID:', assignedById);
            // 1. Get the current user roles from the database
            console.log('🔍 Fetching existing user roles from database...');
            const { data: existingRoleData, error: fetchError } = await supabase
                .from('user_roles')
                .select('role_id, roles(name)')
                .eq('user_id', userId);
            if (fetchError) {
                console.error('❌ Error fetching existing roles:', fetchError);
                throw fetchError;
            }
            // Convert the response data to an array of role names
            const existingRoles = existingRoleData?.map(item => item.roles?.name).filter((name) => name != null) || [];
            console.log('📊 Existing roles from DB:', existingRoles);
            // 2. Get IDs for ALL roles (not just selected ones) to handle removals
            console.log('🔍 Fetching ALL role data for removal operations...');
            const { data: allRoleData, error: allRoleError } = await supabase
                .from('roles')
                .select('id, name');
            console.log('📋 All role data:', allRoleData);
            if (allRoleError) {
                console.error('❌ Error fetching all role data:', allRoleError);
                throw allRoleError;
            }
            if (!allRoleData || allRoleData.length === 0) {
                console.error('❌ No role data found');
                throw new Error('Could not find role information');
            }
            // 3. Delete roles that are no longer selected
            const rolesToRemove = existingRoles.filter((role) => !selectedRoles.includes(role));
            console.log('🗑️ Roles to remove:', rolesToRemove);
            if (rolesToRemove.length > 0) {
                const removeRoleIds = allRoleData
                    .filter(r => rolesToRemove.includes(r.name))
                    .map(r => r.id);
                console.log('🔑 Role IDs to remove:', removeRoleIds);
                if (removeRoleIds.length > 0) {
                    console.log('🗑️ Executing role removal...');
                    const { error: removeError, data: removeData } = await supabase
                        .from('user_roles')
                        .delete()
                        .eq('user_id', userId)
                        .in('role_id', removeRoleIds)
                        .select(); // Add select to see what was actually deleted
                    console.log('📊 Removal result data:', removeData);
                    if (removeError) {
                        console.error('❌ Error removing roles:', removeError);
                        console.error('❌ Full remove error object:', JSON.stringify(removeError, null, 2));
                        throw removeError;
                    }
                    else {
                        console.log('✅ Roles removed successfully:', removeData);
                    }
                }
            }
            // 4. Add newly selected roles
            const rolesToAdd = selectedRoles.filter(role => !existingRoles.includes(role));
            console.log('➕ Roles to add:', rolesToAdd);
            if (rolesToAdd.length > 0) {
                const roleRecords = [];
                for (const roleName of rolesToAdd) {
                    const roleRecord = allRoleData.find(r => r.name === roleName);
                    if (!roleRecord) {
                        console.error(`❌ Role '${roleName}' not found in database`);
                        throw new Error(`Role '${roleName}' not found in database`);
                    }
                    roleRecords.push({
                        user_id: userId,
                        role_id: roleRecord.id,
                        assigned_by: assignedById
                    });
                }
                console.log('📝 Role records to insert:', roleRecords);
                const { error: insertError, data: insertData } = await supabase
                    .from('user_roles')
                    .insert(roleRecords)
                    .select(); // Add select to see what was actually inserted
                console.log('📊 Insert result data:', insertData);
                if (insertError) {
                    console.error('❌ Error inserting roles:', insertError);
                    console.error('❌ Full insert error object:', JSON.stringify(insertError, null, 2));
                    throw insertError;
                }
                else {
                    console.log('✅ Roles added successfully:', insertData);
                }
            }
            // 5. Log role change for history
            const changeDetails = {
                user_id: userId,
                changed_by: assignedById || 'system',
                old_roles: existingRoles,
                new_roles: selectedRoles,
                timestamp: new Date().toISOString()
            };
            console.log('📝 Role change logged:', changeDetails);
            // In a real app, you would insert this into a role_changes table
            // Refresh role history
            await fetchRoleChangeHistory();
            console.log('✅ Role update completed successfully');
            setSuccess('User roles updated successfully');
            // Call the callback with the selected roles to update parent component
            onRoleUpdate(selectedRoles);
            // Set success message and clear it after delay
            setTimeout(() => setSuccess(''), 3000);
        }
        catch (err) {
            console.error('❌ Error updating roles:', err);
            console.error('❌ Full error object:', JSON.stringify(err, null, 2));
            setError('Failed to update roles: ' + err.message);
        }
        finally {
            setUpdating(false);
        }
    };
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };
    return (_jsxs("div", { className: "bg-white rounded-xl shadow-lg", children: [_jsx("div", { className: "p-6 border-b border-gray-200", children: _jsxs("div", { className: "flex justify-between items-center", children: [_jsxs("h3", { className: "text-lg font-semibold text-gray-900 flex items-center", children: [_jsx(User, { className: "w-5 h-5 mr-2" }), "User Role Management"] }), _jsx("button", { onClick: onClose, className: "text-gray-400 hover:text-gray-600", children: "\u2715" })] }) }), _jsxs("div", { className: "p-6 space-y-6", children: [error && (_jsx("div", { className: "bg-red-50 border border-red-200 rounded-lg p-3", children: _jsxs("p", { className: "text-red-600 text-sm flex items-center", children: [_jsx(AlertTriangle, { className: "w-4 h-4 mr-1" }), error] }) })), success && (_jsx("div", { className: "bg-green-50 border border-green-200 rounded-lg p-3", children: _jsxs("p", { className: "text-green-600 text-sm flex items-center", children: [_jsx(Check, { className: "w-4 h-4 mr-1" }), success] }) })), _jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-700 mb-1", children: "User Email" }), _jsx("p", { className: "text-gray-900 font-medium", children: userEmail })] }), _jsxs("div", { children: [_jsx("h4", { className: "font-medium text-gray-900 mb-3", children: "Current Roles" }), _jsx("div", { className: "bg-gray-50 p-4 rounded-lg", children: selectedRoles && selectedRoles.length > 0 ? (_jsx("div", { className: "flex flex-wrap gap-2", children: selectedRoles.map((role) => (_jsx("span", { className: "px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm capitalize", children: role }, role))) })) : (_jsx("p", { className: "text-gray-500 text-sm", children: "No roles assigned" })) })] }), _jsxs("div", { children: [_jsx("h4", { className: "font-medium text-gray-900 mb-3", children: "Manage Roles" }), loading ? (_jsx("div", { className: "bg-gray-50 p-4 rounded-lg", children: _jsx("p", { className: "text-gray-500 text-sm", children: "Loading roles..." }) })) : (_jsxs("div", { className: "bg-gray-50 p-4 rounded-lg", children: [_jsx("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-3", children: availableRoles.map((role) => (_jsxs("div", { className: `border rounded-lg p-3 cursor-pointer hover:bg-gray-100 transition-colors ${selectedRoles.includes(role.name)
                                                ? 'border-blue-500 bg-blue-50'
                                                : 'border-gray-200'}`, onClick: () => handleRoleToggle(role.name), children: [_jsxs("div", { className: "flex items-center space-x-2", children: [_jsx("input", { type: "checkbox", checked: selectedRoles.includes(role.name), onChange: () => { }, className: "h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" }), _jsx("span", { className: `font-medium capitalize ${role.name === 'admin' || role.name === 'super_admin'
                                                                ? 'text-red-600'
                                                                : 'text-gray-900'}`, children: role.name })] }), role.description && (_jsx("p", { className: "text-sm text-gray-500 mt-1 ml-6", children: role.description }))] }, role.id))) }), _jsx("div", { className: "mt-4", children: _jsxs("p", { className: "text-sm text-gray-500 mb-2", children: [_jsx(Shield, { className: "w-4 h-4 inline mr-1 text-amber-500" }), "Warning: Admin roles grant significant permissions"] }) })] }))] }), _jsxs("div", { children: [_jsx("h4", { className: "font-medium text-gray-900 mb-3", children: "Role Change History" }), _jsx("div", { className: "bg-gray-50 p-4 rounded-lg", children: roleChanges.length > 0 ? (_jsx("div", { className: "space-y-3", children: roleChanges.map((change, index) => (_jsx("div", { className: "border-b border-gray-200 pb-3 last:border-0 last:pb-0", children: _jsxs("div", { className: "flex items-start", children: [_jsx(Clock, { className: "w-4 h-4 text-gray-400 mt-0.5 mr-2" }), _jsxs("div", { children: [_jsxs("p", { className: "text-sm text-gray-700", children: ["Changed from ", _jsx("span", { className: "font-medium capitalize", children: change.old_role }), " to", ' ', _jsx("span", { className: "font-medium capitalize", children: change.new_role })] }), _jsx("div", { className: "text-xs text-gray-500 mt-1", children: _jsxs("p", { children: ["By ", change.changed_by, " on ", formatDate(change.timestamp)] }) })] })] }) }, index))) })) : (_jsx("p", { className: "text-gray-500 text-sm", children: "No role changes recorded" })) })] }), _jsxs("div", { className: "flex justify-end space-x-3 pt-4", children: [_jsx(Button, { variant: "outline", onClick: onClose, children: "Cancel" }), _jsx(Button, { onClick: handleUpdateRoles, loading: updating, className: "bg-blue-600 hover:bg-blue-700", children: updating ? 'Updating...' : 'Update Roles' })] })] })] }));
}
export default UserRoleManagement;
