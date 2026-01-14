/**
 * Package = template from Class Type Manager used to create Containers
 */
export interface Package {
  /** Primary key (uuid) */
  id: string;
  /** Human-friendly name of the package */
  name: string;
  /** Optional short code */
  code?: string | null;
  /** Reference to class_type or template id in Class Type Manager */
  class_type_id?: string | null;
  /** Number of sessions or recurrence info (implementation-specific) */
  sessions_count?: number | null;
  /** Metadata snapshot pulled when creating a Container */
  metadata?: Record<string, any> | null;
  /** Whether this package is active/archived */
  active?: boolean;
  /** Audit fields */
  created_at?: string;
  updated_at?: string;
}
