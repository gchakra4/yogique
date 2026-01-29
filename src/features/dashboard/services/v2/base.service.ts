import { supabase } from '@/shared/lib/supabase';
import type { SupabaseClient } from '@supabase/supabase-js';

export type ServiceError = {
  code: string;
  message: string;
  details?: any;
};

export type ServiceResult<T> = {
  success: boolean;
  data?: T;
  error?: ServiceError;
};

export abstract class BaseService {
  protected client: SupabaseClient;

  constructor(client: SupabaseClient = supabase) {
    this.client = client;
  }

  protected handleError(error: any, context: string): ServiceResult<never> {
    // Enhanced error mapping: try to extract Postgres/PostgREST fields (message, details, hint)
    const normalized: any = {};
    normalized.code = error?.code ?? error?.status ?? 'unknown_error';
    normalized.message = error?.message ?? error?.error ?? (typeof error === 'string' ? error : 'An unexpected error occurred.');
    if (error?.details) normalized.details = error.details;
    if (error?.hint) normalized.hint = error.hint;
    if (error?.statusText) normalized.statusText = error.statusText;
    if (error?.response) {
      // Axios/Fetch-like response objects
      try {
        normalized.response = {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data,
        };
      } catch (e) {}
    }

    // Fallback: include the raw error object when possible
    normalized.raw = error;

    try {
      console.error(`[${this.constructor.name}] ${context}:`, JSON.parse(JSON.stringify(normalized)));
    } catch (e) {
      console.error(`[${this.constructor.name}] ${context}:`, normalized);
    }

    return {
      success: false,
      error: {
        code: String(normalized.code),
        message: normalized.message,
        details: normalized,
      },
    };
  }

  protected success<T>(data: T): ServiceResult<T> {
    return { success: true, data };
  }
}
