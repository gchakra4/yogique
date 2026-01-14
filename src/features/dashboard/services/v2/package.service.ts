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
    const safeParams = params || {};
    const cacheKey = JSON.stringify({ type: safeParams.type ?? null, isActive: safeParams.isActive ?? null });

    if (safeParams.useCache !== false) {
      const cached = this.packageCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
        return this.success(cached.data);
      }
    }

    try {
      let query = this.client.from('class_packages').select(
        'id, name, class_count, price, description, is_active, type, duration, course_type, created_at, updated_at'
      );

      if (safeParams.isActive !== undefined && safeParams.isActive !== null) {
        query = query.eq('is_active', safeParams.isActive);
      } else {
        // default to active packages only
        query = query.eq('is_active', true);
      }

      if (safeParams.type) {
        query = query.eq('type', safeParams.type);
      }

      const result = await query.order('name', { ascending: true });

      if (result.error) {
        return this.handleError(result.error, 'listPackages');
      }

      const rows: any[] = result.data || [];

      const packages = rows
        .filter(r => r && r.id && r.name)
        .map(r => ({
          id: r.id,
          name: r.name,
          description: r.description ?? null,
          sessions_count: typeof r.class_count === 'number' ? r.class_count : (r.class_count ? Number(r.class_count) : 0),
          price: r.price ?? null,
          type: r.type ?? null,
          duration: r.duration ?? null,
          course_type: r.course_type ?? null,
          active: r.is_active ?? true,
          created_at: r.created_at ?? null,
          updated_at: r.updated_at ?? null,
        }));

      this.packageCache.set(cacheKey, { data: packages, timestamp: Date.now() });

      return this.success(packages);
    } catch (error) {
      return this.handleError(error, 'listPackages');
    }
  }

  async getPackage(id: string): Promise<ServiceResult<any>> {
    try {
      if (!id) return this.handleError({ message: 'Invalid id' }, 'getPackage');

      // Attempt to find in cache first
      for (const [, v] of this.packageCache.entries()) {
        const found = (v.data || []).find((p: any) => p.id === id);
        if (found) return this.success(found);
      }

      const { data, error } = await this.client
        .from('class_packages')
        .select('id, name, code, class_count, is_active, metadata, created_at, updated_at')
        .eq('id', id)
        .single();

      if (error) return this.handleError(error, 'getPackage');

      if (!data || !data.id || !data.name) {
        return this.handleError({ message: 'Package not found or invalid' }, 'getPackage');
      }

      const pkg = {
        id: data.id,
        name: data.name,
        code: data.code ?? null,
        sessions_count: typeof data.class_count === 'number' ? data.class_count : (data.class_count ? Number(data.class_count) : 0),
        metadata: data.metadata ?? null,
        active: data.is_active ?? true,
        created_at: data.created_at ?? null,
        updated_at: data.updated_at ?? null,
      };

      return this.success(pkg);
    } catch (error) {
      return this.handleError(error, 'getPackage');
    }
  }

  clearCache(): void {
    this.packageCache.clear();
  }
}
