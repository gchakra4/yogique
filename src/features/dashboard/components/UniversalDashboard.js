import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { Suspense, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Footer } from '../../../shared/components/layout/Footer';
import { Header } from '../../../shared/components/layout/Header';
import RoleBasedNavigation from '../../../shared/components/navigation/RoleBasedNavigation';
import { getModulesForRole, hasModuleAccess } from '../../../shared/config/roleConfig';
// Lazy load components (Modules add here)
const ClassAssignmentManager = React.lazy(() => import('./Modules/ClassAssignmentManager'));
const ArticleManagement = React.lazy(() => import('./Modules/ArticleManagement'));
const UserManagement = React.lazy(() => import('./Modules/UserManagement'));
const UserRoleManagement = React.lazy(() => import('./Modules/UserRoleManagement'));
const TransactionManagement = React.lazy(() => import('./Modules/TransactionManagement'));
const BusinessSettings = React.lazy(() => import('./Modules/BusinessSettings'));
const BookingManagement = React.lazy(() => import('./Modules/BookingManagement'));
const WeeklySchedule = React.lazy(() => import('./Modules/WeeklyClassScheduler'));
const FormSubmissions = React.lazy(() => import('./Modules/FormSubmissions'));
const ContentReview = React.lazy(() => import('./Modules/ContentReview'));
const ClassTypeManager = React.lazy(() => import('./Modules/ClassTypeManager'));
const ArticleWorkflow = React.lazy(() => import('./Modules/ArticleWorkflow'));
const NewsletterManagement = React.lazy(() => import('./Modules/NewsletterManagement'));
const TeachingDashboard = React.lazy(() => import('./Modules/TeachingDashboard'));
const Overview = React.lazy(() => import('./Modules/OverView'));
const AdminClassesOverview = React.lazy(() => import('./Modules/AdminClassesOverview'));
const UniversalDashboard = ({ user }) => {
    const userModules = getModulesForRole(user.role);
    const navigate = useNavigate();
    const location = useLocation();
    // Debug logs
    // Component mapping (Modules add here)
    const componentMap = {
        ClassAssignmentManager,
        ArticleManagement,
        UserManagement,
        UserRoleManagement,
        TransactionManagement,
        BusinessSettings,
        BookingManagement,
        WeeklySchedule,
        FormSubmissions,
        ContentReview,
        ClassTypeManager,
        ArticleWorkflow,
        // UserProfile removed from dashboard module map
        NewsletterManagement,
        TeachingDashboard,
        Overview,
        AdminClassesOverview,
        AuditLogs: React.lazy(() => import('./Modules/AuditLogs')),
        InstructorRatesPage: React.lazy(() => import('../../instructor-rates/pages/InstructorRatesPage')),
    };
    // Get the first available module for default tab
    // Default to first available module or overview
    const defaultModule = userModules[0]?.id || 'overview';
    // Extract current module from URL path
    const getCurrentModuleFromPath = () => {
        const path = location.pathname;
        const pathSegments = path.split('/');
        const moduleId = pathSegments[pathSegments.length - 1];
        // Check if the module exists and user has access
        const moduleExists = userModules.some(module => module.id === moduleId);
        const hasAccess = hasModuleAccess(user.role, moduleId);
        return (moduleExists && hasAccess) ? moduleId : defaultModule;
    };
    // State for managing active tab - sync with URL
    const [activeTab, setActiveTab] = useState(getCurrentModuleFromPath());
    // Sync activeTab with URL changes
    useEffect(() => {
        const currentModule = getCurrentModuleFromPath();
        if (currentModule !== activeTab) {
            setActiveTab(currentModule);
        }
    }, [location.pathname, activeTab, userModules, user.role]);
    // Handle tab change - update both state and URL
    const handleTabChange = (tabId) => {
        if (hasModuleAccess(user.role, tabId)) {
            setActiveTab(tabId);
            navigate(`/dashboard/${tabId}`);
        }
    };
    // Get the active component
    const getActiveComponent = () => {
        const activeModule = userModules.find(module => module.id === activeTab);
        if (!activeModule) {
            console.warn(`Module with id ${activeTab} not found`);
            return null;
        }
        if (!hasModuleAccess(user.role, activeTab)) {
            return _jsx("div", { className: "unauthorized", children: "You don't have access to this module" });
        }
        const Component = componentMap[activeModule.component];
        if (!Component) {
            console.warn(`Component ${activeModule.component} not found`);
            return _jsx("div", { className: "error", children: "Component not found" });
        }
        return _jsx(Component, {});
    };
    return (_jsxs("div", { className: "universal-dashboard", children: [_jsx(Header, {}), _jsxs("div", { className: "dashboard-container", children: [_jsxs("div", { className: "dashboard-main", children: [_jsx("div", { className: "dashboard-sidebar", children: _jsx(RoleBasedNavigation, { user: user }) }), _jsxs("div", { className: "dashboard-content", children: [_jsx("div", { className: "dashboard-tabs hidden sm:flex", children: userModules.map(module => (_jsx("button", { className: `tab-button ${activeTab === module.id ? 'active' : ''}`, onClick: () => handleTabChange(module.id), disabled: !hasModuleAccess(user.role, module.id), children: module.title }, module.id))) }), _jsx("div", { className: "dashboard-tab-content", children: _jsx(Suspense, { fallback: _jsx("div", { className: "loading", children: "Loading..." }), children: getActiveComponent() }) })] })] }), _jsx(Footer, {})] })] }));
};
export default UniversalDashboard;
