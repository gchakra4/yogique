
// Types
export type UserRole =
  | 'admin'
  | 'super_admin'
  | 'instructor'
  | 'yoga_acharya'
  | 'energy_exchange_lead'
  | 'sangha_guide'
  | 'user';

export type DashboardModule =
  | 'overview'
  | 'user_management'
  | 'user_role_management'
  | 'rate_management'
  | 'transaction_management'
  | 'invoice_management'
  | 'payment_links_monitor'
  | 'business_settings'
  | 'article_management'
  | 'class_assignment'
  | 'article_editing'
  | 'content_review'
  | 'user_profile'
  | 'booking_management'
  | 'assigned_bookings'
  | 'weekly_schedule'
  | 'class_schedule_manager'
  | 'class_type_manager'
  | 'programs_v2'
  | 'article_workflow'
  | 'forms'
  | 'newsletterManagement'
  | 'teaching_dashboard'
  | 'admin_classes_overview'

export interface ModuleConfig {
  id: DashboardModule | string;
  title: string;
  component: string; // Component name to lazy load or import
  icon?: string;
  description?: string;
  order: number;
}

// Role-based module configuration
export const ROLE_MODULES: Record<UserRole, ModuleConfig[]> = {
  super_admin: [
    { id: 'message_monitor', title: 'Message Monitoring', component: 'MessageMonitor', icon: 'monitor', order: 3 },
    { id: 'user_management', title: 'User Management', component: 'UserManagement', icon: 'users', order: 2 },
    { id: 'rate_management', title: 'Rate Management', component: 'InstructorRatesPage', icon: 'dollar-sign', order: 4 },
    { id: 'class_assignment', title: 'Class Management', component: 'ClassAssignmentManager', icon: 'edit', order: 5 },
    { id: 'programs_v2', title: 'Programs', component: 'ClassesDashboard', icon: 'grid', order: 5.5 },
    { id: 'article_management', title: 'Article Management', component: 'ArticleManagement', icon: 'book', order: 6 },
    { id: 'transaction_management', title: 'Transactions', component: 'TransactionManagement', icon: 'credit-card', order: 7 },
    { id: 'invoice_management', title: 'Invoice Management', component: 'InvoiceManagement', icon: 'file-text', order: 8 },
    { id: 'payment_links_monitor', title: 'Payment Links', component: 'PaymentLinksMonitor', icon: 'link', order: 9 },
    { id: 'business_settings', title: 'Business Settings', component: 'BusinessSettings', icon: 'settings', order: 10 },
    { id: 'booking_management', title: 'Class Bookings', component: 'BookingManagement', icon: 'calendar', order: 11 },
    { id: 'weekly_schedule', title: 'Weekly Schedule', component: 'WeeklySchedule', icon: 'schedule', order: 12 },
    { id: 'form_submission', title: 'Form Submissions & Messages', component: 'FormSubmissions', icon: 'file-text', order: 13 },
    { id: 'class_type_manager', title: 'Class & Package Manager', component: 'ClassTypeManager', icon: 'layers', order: 14 },
    { id: 'newsletterManagement', title: 'NewsLetter Management', component: 'NewsletterManagement', icon: 'mail', order: 15 },
    { id: 'admin_classes_overview', title: 'Classes Overview', component: 'AdminClassesOverview', icon: 'bar-chart', order: 16 },
    { id: 'template_mappings', title: 'Template Mappings', component: 'AdminTemplateMappings', icon: 'message-square', order: 17 },
    { id: 'audit_logs', title: 'Audit Logs', component: 'AuditLogs', icon: 'archive', order: 17 },
      { id: 'attendance_register', title: 'Attendance Register', component: 'AttendanceRegister', icon: 'attendance', order: 4 },
  ],

  admin: [
    { id: 'overview', title: 'Overview', component: 'Overview', icon: 'dashboard', order: 1 },
    { id: 'attendance_register', title: 'Attendance Register', component: 'AttendanceRegister', icon: 'attendance', order: 3 },
    { id: 'user_management', title: 'User Management', component: 'UserManagement', icon: 'users', order: 2 },
    { id: 'instructor_management', title: 'Instructor Management', component: 'InstructorManagement', icon: 'teacher', order: 3 },
    { id: 'rate_management', title: 'Rate Management', component: 'InstructorRatesPage', icon: 'dollar-sign', order: 4 },
    { id: 'programs_v2', title: 'Programs', component: 'ClassesDashboard', icon: 'grid', order: 5 },
    { id: 'transactions', title: 'Transactions', component: 'Transactions', icon: 'credit-card', order: 5 },
    { id: 'business_settings', title: 'Business Settings', component: 'BusinessSettings', icon: 'settings', order: 6 },
    { id: 'article_editing', title: 'Article Editing', component: 'ArticleEditing', icon: 'edit', order: 7 },
    { id: 'forms', title: 'Forms', component: 'Forms', icon: 'file-text', order: 9 },
    { id: 'class_type_manager', title: 'Class & Package Manager', component: 'ClassTypeManager', icon: 'layers', order: 8 },
    { id: 'admin_classes_overview', title: 'Classes Overview', component: 'AdminClassesOverview', icon: 'bar-chart', order: 15 }
    ,{ id: 'template_mappings', title: 'Template Mappings', component: 'AdminTemplateMappings', icon: 'message-square', order: 16 }
    ,{ id: 'audit_logs', title: 'Audit Logs', component: 'AuditLogs', icon: 'archive', order: 16 }
  ],

  instructor: [
    { id: 'teaching_dashboard', title: 'Teaching Dashboard', component: 'TeachingDashboard', icon: 'graduation-cap', order: 1 },
    { id: 'attendance_register', title: 'Attendance Register', component: 'AttendanceRegister', icon: 'attendance', order: 2 },
    { id: 'article_management', title: 'Article Management', component: 'ArticleManagement', icon: 'book', order: 2 },
    // User Profile removed from instructor modules
  ],

  yoga_acharya: [
    { id: 'teaching_dashboard', title: 'Teaching Dashboard', component: 'TeachingDashboard', icon: 'graduation-cap', order: 1 },
    { id: 'attendance_register', title: 'Attendance Register', component: 'AttendanceRegister', icon: 'attendance', order: 2 },
    { id: 'programs_v2', title: 'Programs', component: 'ClassesDashboard', icon: 'grid', order: 2 },
    { id: 'class_assignment', title: 'Class Management', component: 'ClassAssignmentManager', icon: 'edit', order: 3 },
    { id: 'article_management', title: 'Article Management', component: 'ArticleManagement', icon: 'book', order: 4 },
    { id: 'weekly_schedule', title: 'Weekly Schedule', component: 'WeeklySchedule', icon: 'schedule', order: 5 },
    { id: 'class_type_manager', title: 'Class & Package Manager', component: 'ClassTypeManager', icon: 'layers', order: 6 },
  ],

  energy_exchange_lead: [
    { id: 'transaction_management', title: 'Transactions', component: 'TransactionManagement', icon: 'credit-card', order: 1 }
  ],

  sangha_guide: [
    { id: 'comment_moderation', title: 'Comment Moderation', component: 'CommentModeration', icon: 'message-square', order: 1 },
    { id: 'article_editing', title: 'Article Editing', component: 'ArticleEditing', icon: 'edit', order: 3 },
    { id: 'content_review', title: 'Content Review', component: 'ContentReview', icon: 'check-circle', order: 4 },
    { id: 'article_workflow', title: 'Article Workflow', component: 'ArticleWorkflow', icon: 'CheckCircle', order: 5 }
  ],

  user: [
    { id: 'article_management', title: 'Article Management', component: 'ArticleManagement', icon: 'book', order: 5 },
    // User Profile removed for regular users
  ]
};

// Helper function to get modules for a specific role
export const getModulesForRole = (role: UserRole): ModuleConfig[] => {
  return ROLE_MODULES[role]?.sort((a, b) => a.order - b.order) || [];
};

// Helper function to check if user has access to a specific module
export const hasModuleAccess = (userRole: UserRole, moduleId: DashboardModule): boolean => {
  const modules = getModulesForRole(userRole);
  return modules.some(module => module.id === moduleId);
};
