/**
 * ValidationService
 * Helpers for validation, timezone normalization, and business rules.
 */
export class ValidationService {
  normalizeDateToUTC(dateInput: string | Date): string {
    // TODO: normalize local date/time to UTC ISO string
    throw new Error('Not implemented');
  }

  validateAssignmentPayload(payload: Record<string, any>): { valid: boolean; errors?: Record<string, string> } {
    // TODO: run business rule validations (capacity, times, instructor availability)
    return { valid: false, errors: { _general: 'Not implemented' } };
  }
}
