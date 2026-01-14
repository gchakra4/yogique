import { useMemo } from 'react';
import { useAuth } from '../../features/auth/contexts/AuthContext';
import {
    getPermissionDenialReason,
    getResourcePermissions,
    PermissionAction,
    PermissionResource,
} from '../utils/permissions';

interface UsePermissionsResult {
  canView: boolean;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  canAssign: boolean;
  canUnassign: boolean;
  canExport: boolean;
  canImport: boolean;

  can: (action: PermissionAction) => boolean;
  cannot: (action: PermissionAction) => boolean;
  getDenialReason: (action: PermissionAction) => string;

  role?: string;
  isAdmin: boolean;
  isSuperAdmin: boolean;
}

export function usePermissions(resource: PermissionResource): UsePermissionsResult {
  const { user } = useAuth();
  const role = user?.role as any;

  const permissions = useMemo(() => {
    return getResourcePermissions(role, resource);
  }, [role, resource]);

  const can = (action: PermissionAction) => {
    switch (action) {
      case 'view':
        return permissions.canView;
      case 'create':
        return permissions.canCreate;
      case 'update':
        return permissions.canUpdate;
      case 'delete':
        return permissions.canDelete;
      case 'assign':
        return permissions.canAssign;
      case 'unassign':
        return permissions.canUnassign;
      case 'export':
        return permissions.canExport;
      case 'import':
        return permissions.canImport;
      default:
        return false;
    }
  };

  const cannot = (action: PermissionAction) => !can(action);

  const getDenialReason = (action: PermissionAction) => {
    return getPermissionDenialReason(role, resource, action);
  };

  return {
    ...permissions,
    can,
    cannot,
    getDenialReason,
    role,
    isAdmin: role === 'admin',
    isSuperAdmin: role === 'super_admin',
  };
}

export default usePermissions;
