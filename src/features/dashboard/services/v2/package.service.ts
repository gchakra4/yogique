import type { SupabaseClient } from '@supabase/supabase-js';
import { BaseService, ServiceResult } from './base.service';

/**
 * PackageService - caching for class_packages
 */
export class PackageService extends BaseService {
  private packageCache: Map<string, { data: any; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  constructor(client?: SupabaseClient) {
    super(client);
  }

  async listPackages(params?: { type?: string; isActive?: boolean; useCache?: boolean }): Promise<ServiceResult<any[]>> {
    const cacheKey = JSON.stringify(params || {});

    if (params?.useCache !== false) {
      const cached = this.packageCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
        return this.success(cached.data);
      }
    }

    try {
      // TODO: Implement supabase query joining class_types
      const data: any[] = [];
      this.packageCache.set(cacheKey, { data, timestamp: Date.now() });
      return this.success(data);
    } catch (error) {
      return this.handleError(error, 'listPackages');
    }
  }

  async getPackage(id: string): Promise<ServiceResult<any>> {
    try {
      // TODO: Check cache then fetch
      return this.success(null as any);
    } catch (error) {
      return this.handleError(error, 'getPackage');
    }
  }

  clearCache(): void {
    this.packageCache.clear();
  }
}
