import { UserRole } from '../config/roleConfig';

export type PermissionAction =
  | 'view'
  | 'create'
  | 'update'
  | 'delete'
  | 'assign'
  | 'unassign'
  | 'export'
  | 'import';

export type PermissionResource =
  | 'containers'
  | 'assignments'
  | 'bookings'
  | 'students'
  | 'instructors'
  | 'packages'
  | 'invoices'
  | 'reports';

type PermissionFlags = Partial<Record<PermissionAction, boolean>>;

type PermissionMatrix = Record<
  UserRole,
  Partial<Record<PermissionResource, PermissionFlags>>
>;

// Basic permission matrix. Explicit deny by default (missing = false).
export const PERMISSIONS: PermissionMatrix = {
  super_admin: {
    containers: {
      view: true,
      create: true,
      update: true,
      delete: true,
      assign: true,
      unassign: true,
      export: true,
      import: true,
    },
    assignments: {
      view: true,
      create: true,
      update: true,
      delete: true,
      assign: true,
      unassign: true,
      export: true,
      import: true,
    },
  },

  admin: {
    containers: {
      view: true,
      create: true,
      update: true,
      delete: false,
      assign: true,
      unassign: false,
      export: true,
      import: false,
    },
    assignments: {
      view: true,
      create: true,
      update: true,
      delete: false,
      assign: true,
      unassign: false,
      export: true,
      import: false,
    },
  },

  yoga_acharya: {
    containers: {
      view: true,
      create: false,
      update: false,
      delete: false,
      assign: true,
      unassign: false,
      export: false,
      import: false,
    },
    assignments: {
      view: true,
      create: false,
      update: false,
      delete: false,
      assign: true,
      unassign: false,
    },
  },

  instructor: {
    containers: {
      view: true,
      create: false,
      update: false,
      delete: false,
      assign: false,
      unassign: false,
      export: false,
      import: false,
    },
    assignments: {
      view: true,
      create: false,
      update: false,
      delete: false,
      assign: false,
      unassign: false,
    },
  },

  energy_exchange_lead: {},
  sangha_guide: {},
  user: {},
};

export function hasPermission(
  roleOrUser: UserRole | { role?: UserRole } | undefined | null,
  resource: PermissionResource,
  action: PermissionAction
): boolean {
  const role: UserRole | undefined =
    typeof roleOrUser === 'string'
      ? roleOrUser
      : roleOrUser && (roleOrUser as any).role
      ? (roleOrUser as any).role
      : undefined;

  if (!role) return false;
  return Boolean(PERMISSIONS[role]?.[resource]?.[action]);
}

export function getResourcePermissions(role: UserRole | undefined, resource: PermissionResource) {
  const flags = (role && PERMISSIONS[role]?.[resource]) || {};
  return {
    canView: Boolean(flags.view),
    canCreate: Boolean(flags.create),
    canUpdate: Boolean(flags.update),
    canDelete: Boolean(flags.delete),
    canAssign: Boolean(flags.assign),
    canUnassign: Boolean(flags.unassign),
    canExport: Boolean(flags.export),
    canImport: Boolean(flags.import),
  };
}

export function getPermissionDenialReason(
  role: UserRole | undefined,
  resource: PermissionResource,
  action: PermissionAction
): string {
  if (!role) return 'Sign in to see available actions.';
  if (hasPermission(role, resource, action)) return '';

  const roleLabel = role.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  const actionLabel = action.charAt(0).toUpperCase() + action.slice(1);

  const messages: Partial<Record<UserRole, Partial<Record<PermissionAction, string>>>> = {
    admin: {
      delete: 'Only Super Admins can permanently delete items. Contact a Super Admin.',
      unassign: 'Unassigning students is restricted to Super Admins.',
    },
    yoga_acharya: {
      create: 'Only Admins can create containers. Contact your admin team.',
    },
  };

  return (
    messages[role as UserRole]?.[action] || `${roleLabel} role does not have permission to ${actionLabel.toLowerCase()} ${resource}.`
  );
}

export function checkPermissions(
  role: UserRole | undefined,
  resource: PermissionResource,
  actions: PermissionAction[]
): Record<PermissionAction, boolean> {
  const result: Partial<Record<PermissionAction, boolean>> = {};
  actions.forEach(action => {
    result[action] = hasPermission(role, resource, action);
  });
  return result as Record<PermissionAction, boolean>;
}

export default {
  PERMISSIONS,
  hasPermission,
  getResourcePermissions,
  getPermissionDenialReason,
  checkPermissions,
};
