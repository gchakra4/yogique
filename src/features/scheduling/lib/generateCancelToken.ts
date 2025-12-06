import { supabase } from '../../../shared/lib/supabase'

export async function generateCancelToken(bookingId: string, expiresInSeconds?: number) {
  if (!bookingId) throw new Error('bookingId required')

  try {
    const payload: Record<string, any> = { booking_id: bookingId }
    if (expiresInSeconds) payload.expires_in_seconds = expiresInSeconds

    // Call the edge function which will persist the token using the service role key
    const res = await supabase.functions.invoke('generate-cancel-token', { body: payload })
    // Supabase functions invoke returns { data, error } shape in this codebase's usage (services may differ)
    if ('error' in res && res.error) throw res.error

    // res should contain { token, expires_at }
    const data = (res as any).data || (res as any)
    return data
  } catch (err) {
    console.warn('generateCancelToken failed', err)
    return null
  }
}
