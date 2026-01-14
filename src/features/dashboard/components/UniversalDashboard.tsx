import React, { Suspense, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import AdminTemplateMappings from '../../../pages/admin-template-mappings';
import { Footer } from '../../../shared/components/layout/Footer';
import { Header } from '../../../shared/components/layout/Header';
import RoleBasedNavigation from '../../../shared/components/navigation/RoleBasedNavigation';
import { DashboardModule, getModulesForRole, hasModuleAccess, UserRole } from '../../../shared/config/roleConfig';

// Lazy load components (Modules add here)
const ClassAssignmentManager = React.lazy(() => import('./Modules/ClassAssignmentManager'));
const ClassesDashboard = React.lazy(() => import('./Modules/ClassesV2/ClassesDashboard'));
const ArticleManagement = React.lazy(() => import('./Modules/ArticleManagement'));
const UserManagement = React.lazy(() => import('./Modules/UserManagement'));
const UserRoleManagement = React.lazy(() => import('./Modules/UserRoleManagement'));
const TransactionManagement = React.lazy(() => import('./Modules/TransactionManagement'));
const InvoiceManagement = React.lazy(() => import('./Modules/InvoiceManagement'));
const PaymentLinksMonitor = React.lazy(() => import('./Modules/PaymentLinksMonitor'));
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
const MessageMonitor = React.lazy(() => import('./Modules/MessageMonitor'));

interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  // optional list of roles assigned to the user
  roles?: UserRole[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface UniversalDashboardProps {
  user: User;
}

const UniversalDashboard: React.FC<UniversalDashboardProps> = ({ user }) => {
  // Aggregate modules from all assigned roles (union, dedupe, ordered)
  const roles = (user.roles && user.roles.length > 0) ? user.roles : [user.role]

  const modulesById: Record<string, any> = {}
  roles.forEach(r => {
    getModulesForRole(r).forEach((m) => {
      // keep the module with the smallest order if duplicates occur
      if (!modulesById[m.id] || (m.order < modulesById[m.id].order)) {
        modulesById[m.id] = m
      }
    })
  })

  const userModules = Object.values(modulesById).sort((a: any, b: any) => a.order - b.order)
  const navigate = useNavigate();
  const location = useLocation();

  // Debug logs

  // Component mapping (Modules add here)
  const componentMap = {
    ClassAssignmentManager,
    ArticleManagement,
    ClassesDashboard,
    UserManagement,
    UserRoleManagement,
    TransactionManagement,
    InvoiceManagement,
    PaymentLinksMonitor,
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
    AdminTemplateMappings,
    AuditLogs: React.lazy(() => import('./Modules/AuditLogs')),
    InstructorRatesPage: React.lazy(() => import('../../instructor-rates/pages/InstructorRatesPage')),
    MessageMonitor,
  };

  // Get the first available module for default tab
  // Default to first available module or overview
  const defaultModule = userModules[0]?.id || 'overview';

  // Extract current module from URL path
  const getCurrentModuleFromPath = () => {
    const path = location.pathname;
    const pathSegments = path.split('/');
    const moduleId = pathSegments[pathSegments.length - 1] as DashboardModule;
    // Check if the module exists and user has access
    const moduleExists = userModules.some(module => module.id === moduleId);
    const hasAccess = roles.some(r => hasModuleAccess(r, moduleId as DashboardModule));
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
  }, [location.pathname, activeTab, userModules, roles]);

  // Handle tab change - update both state and URL
  const handleTabChange = (tabId: string) => {
    if (roles.some(r => hasModuleAccess(r, tabId as DashboardModule))) {
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
    if (!roles.some(r => hasModuleAccess(r, activeTab as DashboardModule))) {
      return <div className="unauthorized">You don't have access to this module</div>;
    }
    const Component = componentMap[activeModule.component];
    if (!Component) {
      console.warn(`Component ${activeModule.component} not found`);
      return <div className="error">Component not found</div>;
    }
    return <Component />;
  };

  return (
    <div className="universal-dashboard">
      <Header />
      <div className="dashboard-container">
        <div className="dashboard-main">
          <div className="dashboard-sidebar">
            <RoleBasedNavigation user={user} />
          </div>
          <div className="dashboard-content">
            <div className="dashboard-tabs hidden sm:flex">
              {userModules.map(module => (
                <button
                  key={module.id}
                  className={`tab-button ${activeTab === module.id ? 'active' : ''}`}
                  onClick={() => handleTabChange(module.id)}
                  disabled={!hasModuleAccess(user.role, module.id as DashboardModule)}
                >
                  {module.title}
                </button>
              ))}
            </div>
            <div className="dashboard-tab-content">
              <Suspense fallback={<div className="loading">Loading...</div>}>
                {getActiveComponent()}
              </Suspense>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    </div>
  );
};

export default UniversalDashboard;
