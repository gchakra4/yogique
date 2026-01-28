import { supabase } from '@/shared/lib/supabase';

function isValidDateString(d: any) {
  return typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d);
}

function lastDayOfMonth(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0));
}

function formatDateUTC(d: Date) {
  return d.toISOString().split('T')[0];
}

/**
 * AssignmentService for ClassesV2
 * Supports single assignment creation and bulk monthly generation
 */
export class AssignmentService {
  async listAssignments(_params?: Record<string, any>): Promise<any[]> {
    const { data, error } = await supabase.from('class_assignments').select('*').order('date', { ascending: true });
    if (error) throw error;
    return data || [];
  }

  async getAssignment(id: string): Promise<any> {
    const { data, error } = await supabase.from('class_assignments').select('*').eq('id', id).single();
    if (error) throw error;
    return data;
  }

  /**
   * Create assignment(s).
   * Supports:
   * - Single adhoc assignment (assignment_type: 'adhoc' or omitted)
   * - Bulk monthly generation (assignment_type: 'monthly' with weekly_recurrence or manual_calendar)
   */
  async createAssignment(data: Record<string, any>): Promise<any> {
    if (!data || typeof data !== 'object') throw new Error('Invalid payload')

    const assignmentType = data.assignment_type || 'adhoc'

    // Helper to attach bookings to all created assignments
    const attachBookings = async (assignmentIds: string[], bookingIds: string[], containerId?: string | null) => {
      if (!bookingIds || bookingIds.length === 0 || !assignmentIds || assignmentIds.length === 0) return;
      const rows: any[] = []
      for (const aId of assignmentIds) {
        for (const b of bookingIds) {
          if (!b) continue
          rows.push({ assignment_id: aId, booking_id: b, class_container_id: containerId || null })
        }
      }
      if (rows.length === 0) return;
      const { error } = await supabase.from('assignment_bookings').insert(rows)
      if (error) {
        console.error('Failed to insert assignment_bookings', error)
        throw error
      }
    }

    // Normalize booking ids
    const bookingIds = Array.isArray(data.booking_ids) && data.booking_ids.length > 0
      ? data.booking_ids
      : (data.booking_id ? [data.booking_id] : [])

    // Single assignment path
    if (assignmentType !== 'monthly') {
      const payload: any = {
        class_container_id: data.container_id || data.class_container_id || null,
        package_id: data.package_id || null,
        class_package_id: data.package_id || null,
        date: data.date || data.class_date,
        start_time: data.start_time,
        end_time: data.end_time,
        instructor_id: data.instructor_id || null,
        payment_amount: data.payment_amount || 0,
        schedule_type: data.schedule_type || 'adhoc',
        booking_type: data.booking_type || 'individual',
        class_status: data.class_status || 'scheduled',
        payment_status: data.payment_status || 'pending',
        instructor_status: data.instructor_status || 'pending',
        notes: data.notes || null,
        timezone: data.timezone || null
      }

      const { data: inserted, error } = await supabase.from('class_assignments').insert([payload]).select('id')
      if (error) throw error
      const insertedIds = (inserted || []).map((r: any) => r.id)
      await attachBookings(insertedIds, bookingIds, payload.class_container_id)
      return { success: true, data: inserted && inserted[0] ? inserted[0] : null }
    }

    // Monthly bulk creation path
    // Determine total_classes: prefer provided, otherwise fallback to package.class_count
    let totalClasses = Number(data.total_classes || 0)
    if ((!totalClasses || totalClasses <= 0) && data.package_id) {
      try {
        const { data: pkg } = await supabase.from('class_packages').select('class_count').eq('id', data.package_id).single()
        if (pkg && typeof pkg.class_count === 'number') totalClasses = Number(pkg.class_count)
      } catch (e) {
        console.warn('Failed to resolve package.class_count', e)
      }
    }

    if (!totalClasses || totalClasses <= 0) {
      throw new Error('Total classes not provided and package.class_count unavailable. Please specify total_classes or link a package.')
    }

    const method = data.monthly_assignment_method || 'weekly_recurrence'
    const startDateStr = data.start_date || data.date || data.class_date
    if (!isValidDateString(startDateStr)) throw new Error('Valid start_date is required for monthly generation (YYYY-MM-DD)')
    const startDate = new Date(startDateStr + 'T00:00:00.000Z')

    // Calendar month boundaries (first-month generation stays within this month)
    const monthStart = new Date(Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth(), 1))
    const monthEnd = lastDayOfMonth(startDate)
    const calendarMonthKey = `${monthStart.getUTCFullYear()}-${String(monthStart.getUTCMonth() + 1).padStart(2, '0')}`

    const assignments: any[] = []

    if (method === 'weekly_recurrence') {
      const weeklyDays: number[] = Array.isArray(data.weekly_days) ? data.weekly_days.map(Number).filter(n => !isNaN(n) && n >= 0 && n <= 6) : []
      if (weeklyDays.length === 0) throw new Error('weekly_days required for weekly_recurrence (0=Sunday, 6=Saturday)')

      // Sort days chronologically
      weeklyDays.sort((a, b) => a - b)

      let classesCreated = 0
      // Find week start (Sunday) on or before startDate
      const currentWeekStart = new Date(Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth(), startDate.getUTCDate()))
      currentWeekStart.setUTCDate(currentWeekStart.getUTCDate() - currentWeekStart.getUTCDay())

      while (classesCreated < totalClasses) {
        for (const dayOfWeek of weeklyDays) {
          if (classesCreated >= totalClasses) break
          const classDate = new Date(currentWeekStart)
          classDate.setUTCDate(currentWeekStart.getUTCDate() + dayOfWeek)
          
          // Skip if before start date
          if (classDate < startDate) continue
          
          // Stop if beyond month end (first-month proration)
          if (classDate > monthEnd) {
            console.log(`First month proration: stopped at ${classesCreated}/${totalClasses} classes (month boundary reached)`)
            break
          }
          
          assignments.push({
            class_container_id: data.container_id || data.class_container_id || null,
            package_id: data.package_id || null,
            class_package_id: data.package_id || null,
            date: formatDateUTC(classDate),
            start_time: data.start_time,
            end_time: data.end_time,
            instructor_id: data.instructor_id || null,
            payment_amount: data.payment_amount || 0,
            schedule_type: 'monthly',
            assigned_by: data.assigned_by || null,
            booking_type: data.booking_type || 'individual',
            class_status: 'scheduled',
            payment_status: 'pending',
            instructor_status: 'pending',
            calendar_month: calendarMonthKey,
            is_adjustment: false,
            notes: data.notes || null,
            timezone: data.timezone || null
          })
          classesCreated++
        }
        
        // Advance one week
        currentWeekStart.setUTCDate(currentWeekStart.getUTCDate() + 7)
        if (currentWeekStart > monthEnd) break
        
        // Safety limit
        if (assignments.length > 2000) throw new Error('Too many assignments generated (exceeded 2000)')
      }
    } else if (method === 'manual_calendar') {
      if (!Array.isArray(data.manual_selections) || data.manual_selections.length === 0) {
        throw new Error('manual_selections required for manual_calendar method')
      }
      
      for (const sel of data.manual_selections) {
        if (!isValidDateString(sel.date)) throw new Error('Invalid date in manual_selections')
        
        // Validate date within calendar month
        const d = new Date(sel.date + 'T00:00:00.000Z')
        if (d < monthStart || d > monthEnd) {
          throw new Error(`Manual selection date ${sel.date} is outside calendar month ${calendarMonthKey}`)
        }
        
        assignments.push({
          class_container_id: data.container_id || data.class_container_id || null,
          package_id: data.package_id || null,
          class_package_id: data.package_id || null,
          date: sel.date,
          start_time: sel.start_time,
          end_time: sel.end_time,
          instructor_id: data.instructor_id || null,
          payment_amount: data.payment_amount || 0,
          schedule_type: 'monthly',
          assigned_by: data.assigned_by || null,
          booking_type: data.booking_type || 'individual',
          class_status: 'scheduled',
          payment_status: 'pending',
          instructor_status: 'pending',
          calendar_month: calendarMonthKey,
          is_adjustment: false,
          notes: data.notes || null,
          timezone: data.timezone || null
        })
      }
    } else {
      throw new Error(`Unsupported monthly method: ${method}`)
    }

    if (assignments.length === 0) {
      return { success: true, count: 0, message: 'No assignments generated (check date range)' }
    }

    // Insert all assignments. Retry without `calendar_month` if PostgREST schema cache
    // reports the column is missing (PGRST204). This supports older DBs without migration.
    async function tryInsert(rows: any[]) {
      const { data: insertedAssignments, error: insertErr } = await supabase
        .from('class_assignments')
        .insert(rows)
        .select('id')
      return { insertedAssignments, insertErr }
    }

    let insertedAssignments: any[] | null = null
    let insertErr: any = null

    ({ insertedAssignments, insertErr } = await tryInsert(assignments))

    if (insertErr) {
      const msg: string = insertErr?.message || ''
      const code: string = insertErr?.code || insertErr?.status || ''
      const calendarMissing = msg.includes("Could not find the 'calendar_month'") || msg.includes('calendar_month') || String(code) === 'PGRST204'
      if (calendarMissing) {
        console.warn('calendar_month column not present in DB schema cache; retrying insert without it')
        const slim = assignments.map(a => {
          const copy = { ...a }
          if ('calendar_month' in copy) delete copy.calendar_month
          return copy
        })
        const retry = await tryInsert(slim)
        insertedAssignments = retry.insertedAssignments
        insertErr = retry.insertErr
      }
    }

    if (insertErr) {
      console.error('Failed to insert monthly assignments', insertErr)
      throw insertErr
    }

    const insertedIds = (insertedAssignments || []).map((r: any) => r.id)
    
    // Attach bookings to ALL created assignments
    await attachBookings(insertedIds, bookingIds, data.container_id || data.class_container_id || null)

    return { 
      success: true, 
      count: insertedIds.length, 
      data: insertedAssignments,
      message: `Created ${insertedIds.length} assignments`
    }
  }

  async updateAssignment(id: string, data: Record<string, any>): Promise<any> {
    const payload: any = {}
    if (data.date !== undefined) payload.date = data.date
    if (data.class_date !== undefined) payload.date = data.class_date
    if (data.start_time !== undefined) payload.start_time = data.start_time
    if (data.end_time !== undefined) payload.end_time = data.end_time
    if (data.class_status !== undefined) payload.class_status = data.class_status
    if (data.status !== undefined) payload.class_status = data.status
    if (data.instructor_status !== undefined) payload.instructor_status = data.instructor_status
    if (data.meeting_link !== undefined) {
      payload.zoom_meeting = data.meeting_link ? { join_url: data.meeting_link } : null
    }
    if (data.notes !== undefined) payload.notes = data.notes

    const { error } = await supabase.from('class_assignments').update(payload).eq('id', id)
    if (error) throw error
    return { success: true }
  }

  async cancelAssignment(id: string): Promise<void> {
    const { error } = await supabase.from('class_assignments').update({ class_status: 'cancelled' }).eq('id', id)
    if (error) throw error
  }
}

export default new AssignmentService()
