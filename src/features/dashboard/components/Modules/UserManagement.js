import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Filter, Search, Shield, User, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import ResponsiveActionButton from '../../../../shared/components/ui/ResponsiveActionButton';
import { LoadingSpinner } from '../../../../shared/components/ui/LoadingSpinner';
import { supabase } from '../../../../shared/lib/supabase';
import { useUserProfiles } from '../../../user-profile/hooks/useUserProfiles';
import { UserRoleManagement } from './UserRoleManagement';
export function UserManagement() {
    const { loading: profilesLoading } = useUserProfiles();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const [selectedUser, setSelectedUser] = useState(null);
    const [showRoleManagement, setShowRoleManagement] = useState(false);
    const [error, setError] = useState(null);
    useEffect(() => {
        fetchUsers();
    }, []);
    const fetchUsers = async () => {
        try {
            setLoading(true);
            setError(null);
            // Get the current session
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                throw new Error('No active session');
            }
            // Call the secure Edge Function instead of direct admin API
            const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-users`;
            const response = await fetch(apiUrl, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${session.access_token}`,
                    'Content-Type': 'application/json',
                },
            });
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
            }
            const data = await response.json();
            setUsers(data.users || []);
        }
        catch (error) {
            console.error('Error in fetchUsers:', error);
            setError(error instanceof Error ? error.message : 'Failed to fetch users');
            setUsers([]);
        }
        finally {
            setLoading(false);
        }
    };
    const handleRoleUpdate = async (userId, newRoles) => {
        setLoading(true);
        setError(null);
        try {
            // Get the current session
            const { data: { session } } = await supabase.auth.getSession();
            if (!session)
                throw new Error('No active session');
            // Call your Edge Function to update roles
            const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-update-user-roles`;
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${session.access_token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    user_id: userId,
                    user_roles: newRoles // This should be an array of role names like ['admin', 'instructor']
                }),
            });
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
            }
            const result = await response.json();
            console.log('Role update successful:', result);
            // Update local state immediately
            setUsers(prev => prev.map(user => user.user_id === userId
                ? { ...user, user_roles: newRoles }
                : user));
            // Refresh the data to ensure consistency
            await fetchUsers();
            setShowRoleManagement(false);
            setSelectedUser(null);
            // Show success message
            console.log('Roles updated successfully');
        }
        catch (error) {
            console.error('Role update error:', error);
            setError(error instanceof Error ? error.message : 'Failed to update roles');
        }
        finally {
            setLoading(false);
        }
    };
    const getFilteredUsers = () => {
        return users.filter(user => {
            const matchesSearch = searchTerm === '' ||
                user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.email.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesRole = roleFilter === 'all' ||
                (user.user_roles && user.user_roles.includes(roleFilter));
            return matchesSearch && matchesRole;
        });
    };
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };
    const getRoleColor = (role) => {
        switch (role) {
            case 'admin':
            case 'super_admin':
                return 'bg-red-100 text-red-800';
            case 'instructor':
                return 'bg-blue-100 text-blue-800';
            case 'yoga_acharya':
                return 'bg-purple-100 text-purple-800';
            case 'mantra_curator':
                return 'bg-green-100 text-green-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };
    if (loading || profilesLoading) {
        return (_jsx("div", { className: "flex justify-center py-12", children: _jsx(LoadingSpinner, { size: "lg" }) }));
    }
    if (error) {
        return (_jsxs("div", { className: "bg-red-50 border border-red-200 rounded-xl p-6 text-center", children: [_jsx("div", { className: "text-red-600 font-semibold mb-2", children: "Error Loading Users" }), _jsx("div", { className: "text-red-500 text-sm mb-4", children: error }), _jsx(ResponsiveActionButton, { onClick: fetchUsers, variant: "outline", className: "border-red-300 text-red-600 hover:bg-red-50", children: "Try Again" })] }));
    }
    if (showRoleManagement && selectedUser) {
        return (_jsx(UserRoleManagement, { userId: selectedUser.user_id, userEmail: selectedUser.email, currentRoles: selectedUser.user_roles || [], onRoleUpdate: (newRoles) => handleRoleUpdate(selectedUser.user_id, newRoles), onClose: () => {
                setShowRoleManagement(false);
                setSelectedUser(null);
            } }));
    }
    return (_jsxs("div", { className: "space-y-6", children: [_jsx("div", { className: "flex justify-between items-center", children: _jsxs("h2", { className: "text-2xl font-bold text-gray-900 flex items-center", children: [_jsx(Users, { className: "w-6 h-6 mr-2" }), "User Management (", users.length, ")"] }) }), _jsx("div", { className: "bg-white rounded-xl shadow-lg p-6", children: _jsxs("div", { className: "flex flex-col md:flex-row gap-4", children: [_jsx("div", { className: "flex-1", children: _jsxs("div", { className: "relative", children: [_jsx(Search, { className: "absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" }), _jsx("input", { type: "text", placeholder: "Search by name or email...", value: searchTerm, onChange: (e) => setSearchTerm(e.target.value), className: "w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" })] }) }), _jsx("div", { children: _jsxs("div", { className: "relative", children: [_jsx(Filter, { className: "absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" }), _jsxs("select", { value: roleFilter, onChange: (e) => setRoleFilter(e.target.value), className: "pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white", children: [_jsx("option", { value: "all", children: "All Roles" }), _jsx("option", { value: "user", children: "Users" }), _jsx("option", { value: "instructor", children: "Instructors" }), _jsx("option", { value: "yoga_acharya", children: "Yoga Acharyas" }), _jsx("option", { value: "mantra_curator", children: "Mantra Curators" }), _jsx("option", { value: "admin", children: "Admins" }), _jsx("option", { value: "super_admin", children: "Super Admins" })] })] }) })] }) }), _jsx("div", { className: "bg-white rounded-xl shadow-lg overflow-hidden", children: getFilteredUsers().length === 0 ? (_jsxs("div", { className: "text-center py-12", children: [_jsx(Users, { className: "w-16 h-16 text-gray-400 mx-auto mb-4" }), _jsx("h3", { className: "text-lg font-semibold text-gray-900 mb-2", children: "No users found" }), _jsx("p", { className: "text-gray-600", children: "Try adjusting your search or filter criteria." })] })) : (_jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "min-w-full divide-y divide-gray-200", children: [_jsx("thead", { className: "bg-gray-50", children: _jsxs("tr", { children: [_jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "User" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Roles" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Joined" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Actions" })] }) }), _jsx("tbody", { className: "bg-white divide-y divide-gray-200", children: getFilteredUsers().map((user) => (_jsxs("tr", { className: "hover:bg-gray-50", children: [_jsx("td", { className: "px-6 py-4", children: _jsxs("div", { className: "flex items-center", children: [_jsx("div", { className: "w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-4", children: _jsx(User, { className: "w-5 h-5 text-blue-600" }) }), _jsxs("div", { children: [_jsx("div", { className: "text-sm font-medium text-gray-900", children: user.full_name || 'No name' }), _jsx("div", { className: "text-sm text-gray-500", children: user.email }), user.phone && (_jsx("div", { className: "text-xs text-gray-400", children: user.phone }))] })] }) }), _jsx("td", { className: "px-6 py-4", children: _jsx("div", { className: "flex flex-wrap gap-1", children: user.user_roles && user.user_roles.length > 0 ? (user.user_roles.map((role, index) => (_jsx("span", { className: `px-2 py-1 text-xs rounded-full ${getRoleColor(role)}`, children: role.replace('_', ' ') }, index)))) : (_jsx("span", { className: "px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800", children: "user" })) }) }), _jsx("td", { className: "px-6 py-4 text-sm text-gray-500", children: formatDate(user.created_at) }), _jsx("td", { className: "px-6 py-4", children: _jsxs(ResponsiveActionButton, { onClick: () => {
                                                    setSelectedUser(user);
                                                    setShowRoleManagement(true);
                                                }, size: "sm", variant: "outline", className: "flex items-center", children: [_jsx(Shield, { className: "w-4 h-4 mr-1" }), "Manage Roles"] }) })] }, user.user_id))) })] }) })) }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-4 gap-6", children: [_jsxs("div", { className: "bg-white rounded-xl shadow-lg p-6 text-center", children: [_jsx("div", { className: "text-3xl font-bold text-blue-600 mb-2", children: users.length }), _jsx("div", { className: "text-gray-600", children: "Total Users" })] }), _jsxs("div", { className: "bg-white rounded-xl shadow-lg p-6 text-center", children: [_jsx("div", { className: "text-3xl font-bold text-green-600 mb-2", children: users.filter(u => u.user_roles?.includes('instructor')).length }), _jsx("div", { className: "text-gray-600", children: "Instructors" })] }), _jsxs("div", { className: "bg-white rounded-xl shadow-lg p-6 text-center", children: [_jsx("div", { className: "text-3xl font-bold text-purple-600 mb-2", children: users.filter(u => u.user_roles?.includes('yoga_acharya')).length }), _jsx("div", { className: "text-gray-600", children: "Yoga Acharyas" })] }), _jsxs("div", { className: "bg-white rounded-xl shadow-lg p-6 text-center", children: [_jsx("div", { className: "text-3xl font-bold text-red-600 mb-2", children: users.filter(u => u.user_roles?.some(role => ['admin', 'super_admin'].includes(role))).length }), _jsx("div", { className: "text-gray-600", children: "Admins" })] })] })] }));
}
export default UserManagement;
