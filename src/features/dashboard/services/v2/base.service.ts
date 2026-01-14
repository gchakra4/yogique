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
    // Basic error mapping - expand as needed
    console.error(`[${this.constructor.name}] ${context}:`, error);

    const code = error?.code || error?.status || 'unknown_error';
    const message = error?.message || 'An unexpected error occurred.';

    return {
      success: false,
      error: {
        code: String(code),
        message,
        details: error,
      },
    };
  }

  protected success<T>(data: T): ServiceResult<T> {
    return { success: true, data };
  }
}
