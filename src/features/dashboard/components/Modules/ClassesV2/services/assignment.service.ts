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
      // Mark bookings as classes_assigned (bulk RPC)
      try {
        const uniqueBookingIds = Array.from(new Set(bookingIds.filter(Boolean)));
        if (uniqueBookingIds.length > 0) {
          await supabase.rpc('mark_bookings_classes_assigned', { p_booking_ids: uniqueBookingIds });
        }
      } catch (e) {
        console.warn('Failed to mark bookings as classes_assigned (bulk)', e);
      }
    }

    // Normalize booking ids
    const bookingIds = Array.isArray(data.booking_ids) && data.booking_ids.length > 0
      ? data.booking_ids
      : (data.booking_id ? [data.booking_id] : [])

    // Single assignment path
    if (assignmentType !== 'monthly') {
      // Derive package_id from container if not provided (satisfies DB constraint)
      let class_package_id = data.class_package_id || data.package_id || null
      const scheduled_class_id = data.scheduled_class_id || null
      if (!class_package_id && !scheduled_class_id && (data.container_id || data.class_container_id)) {
        try {
          const cid = data.container_id || data.class_container_id
          const { data: container, error: cErr } = await supabase
            .from('class_containers')
            .select('package_id')
            .eq('id', cid)
            .maybeSingle()
          if (!cErr && container && container.package_id) class_package_id = container.package_id
        } catch (e) {
          // ignore and validate below
        }
      }
      // Enforce DB constraint: either scheduled_class_id OR class_package_id must be set
      if (!class_package_id && !scheduled_class_id) {
        throw new Error('Either class_package_id (package) or scheduled_class_id must be provided for assignment creation')
      }

      const payload: any = {
        class_container_id: data.container_id || data.class_container_id || null,
        package_id: class_package_id || null,
        class_package_id: class_package_id || null,
        ...(scheduled_class_id ? { scheduled_class_id } : {}),
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

    // Determine instructor: prefer provided, otherwise try to derive from container
    let defaultInstructorId: string | null = data.instructor_id || null
    if (!defaultInstructorId && (data.container_id || data.class_container_id)) {
      try {
        const cid = data.container_id || data.class_container_id
        const { data: container, error: cErr } = await supabase.from('class_containers').select('instructor_id').eq('id', cid).maybeSingle()
        if (!cErr && container && container.instructor_id) defaultInstructorId = container.instructor_id
      } catch (e) {
        // ignore and validate below
      }
    }

    // If still missing, monthly generation requires an instructor (DB enforces NOT NULL).
    if (!defaultInstructorId) {
      throw new Error('Instructor is required for monthly assignment creation. Please select an instructor or assign one to the program.')
    }

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
            instructor_id: defaultInstructorId,
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
          instructor_id: defaultInstructorId,
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

    // Insert all assignments. If PostgREST reports missing columns in the schema cache
    // (PGRST204), iteratively strip the reported missing columns from the payload and retry.
    async function tryInsert(rows: any[]) {
      const { data: insertedAssignments, error: insertErr } = await supabase
        .from('class_assignments')
        .insert(rows)
        .select('id')
      return { insertedAssignments, insertErr }
    }

    let insertedAssignments: any[] | null = null
    let insertErr: any = null

    // Attempt insertion with iterative retry on missing-column errors
    let rowsToInsert = assignments.map(a => ({ ...a }))
    const maxRetries = 5
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      const res = await tryInsert(rowsToInsert)
      insertedAssignments = res.insertedAssignments
      insertErr = res.insertErr
      if (!insertErr) break

      const msg: string = insertErr?.message || ''
      // Try to extract missing column name from error message like: Could not find the 'X' column
      const m = msg.match(/Could not find the '\"?'?([^'\"\s]+)\"?'? column/i) || msg.match(/Could not find the '([^']+)' column/i)
      const col = m ? m[1] : null
      if (col) {
        console.warn(`PostgREST schema cache missing column '${col}', stripping it and retrying (attempt ${attempt + 1})`)
        rowsToInsert = rowsToInsert.map(r => {
          const copy = { ...r }
          if (col in copy) delete copy[col]
          return copy
        })
        // continue retry loop
        continue
      }

      // If we couldn't parse a missing column name, but the code is PGRST204, attempt a generic retry
      const code: string = insertErr?.code || insertErr?.status || ''
      if (String(code) === 'PGRST204' || msg.includes('schema cache')) {
        console.warn(`Insert failed with PGRST204 but missing column not parsed; retrying without 'calendar_month' as fallback (attempt ${attempt + 1})`)
        rowsToInsert = rowsToInsert.map(r => {
          const copy = { ...r }
          if ('calendar_month' in copy) delete copy.calendar_month
          return copy
        })
        continue
      }

      // Unknown error, break and report
      break
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
