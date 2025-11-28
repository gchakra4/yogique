import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link, useLocation } from 'react-router-dom';
import { getModulesForRole } from '../../config/roleConfig';
const RoleBasedNavigation = ({ user, className = '' }) => {
    const location = useLocation();
    const modules = getModulesForRole(user.role);
    const isActive = (moduleId) => {
        const currentPath = location.pathname;
        return currentPath.includes(`/dashboard/${moduleId}`);
    };
    const getIconElement = (iconName) => {
        const iconMap = {
            dashboard: '📊',
            users: '👥',
            teacher: '🧑‍🏫',
            'credit-card': '💳',
            settings: '⚙️',
            edit: '✏️',
            user: '👤',
            calendar: '📅',
            schedule: '🗓️',
            'bar-chart': '📈',
            'file-text': '📄',
            'message-square': '💬',
            mail: '📧',
            'dollar-sign': '💰',
            book: '📚',
            layers: '📋',
            'graduation-cap': '🎓',
            'check-circle': '✅'
        };
        return iconMap[iconName || 'dashboard'] || '📋';
    };
    return (_jsxs("nav", { className: `role-based-navigation ${className}`, children: [_jsx("div", { className: "hidden sm:block mb-6", children: _jsxs("div", { className: "px-4", children: [_jsx("h3", { className: "text-xl font-bold", children: "Dashboard" }), _jsx("div", { className: "text-xs text-gray-500 mt-1", children: user.role.replace('_', ' ').toUpperCase() })] }) }), _jsx("div", { className: "block sm:hidden bg-white shadow-sm sticky top-0 z-30", children: _jsx("div", { className: "px-3 py-2 overflow-x-auto", children: _jsx("div", { className: "flex gap-2", children: modules.map((module) => {
                            const active = isActive(module.id);
                            return (_jsxs(Link, { to: `/dashboard/${module.id}`, className: `flex items-center gap-3 whitespace-nowrap px-4 py-2 rounded-full transition-colors duration-200 ${active ? 'bg-emerald-600 text-white shadow-sm' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`, children: [_jsx("span", { className: `inline-flex items-center justify-center h-6 w-6 rounded-md ${active ? 'bg-white/20' : 'bg-transparent'}`, children: _jsx("span", { className: "text-sm", children: getIconElement(module.icon) }) }), _jsx("span", { className: "text-sm font-medium", children: module.title })] }, module.id));
                        }) }) }) }), _jsx("div", { className: "hidden sm:block", children: _jsx("ul", { className: "space-y-1", children: modules.map((module) => {
                        const active = isActive(module.id);
                        return (_jsx("li", { children: _jsxs(Link, { to: `/dashboard/${module.id}`, className: `flex items-center gap-3 px-4 py-2 rounded-lg transition-colors duration-150 ${active ? 'bg-emerald-50 text-emerald-700 border-l-4 border-emerald-600' : 'text-gray-700 hover:bg-gray-50'}`, children: [_jsx("span", { className: "inline-flex items-center justify-center h-8 w-8 rounded-md bg-gray-100 text-sm", children: getIconElement(module.icon) }), _jsx("span", { className: "font-medium", children: module.title })] }) }, module.id));
                    }) }) })] }));
};
export default RoleBasedNavigation;
