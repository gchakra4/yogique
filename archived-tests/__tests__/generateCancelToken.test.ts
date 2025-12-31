import { generateCancelToken } from '../src/features/scheduling/lib/generateCancelToken'

jest.mock('../src/shared/lib/supabase', () => ({
  INSERT INTO public.audit_logs (event_type, entity_type, entity_id, action, actor_id, metadata, created_at)
SELECT
  'revoke_cancel_token' AS event_type,
  'booking' AS entity_type,
  booking_id::text AS entity_id,
  'revoke_token' AS action,
  admin_id AS actor_id,
  jsonb_build_object('reason', reason) AS metadata,
  created_at
FROM public.revoke_cancel_audit_logs;supabase: {
    functions: {
      invoke: jest.fn(async (name: string, opts: any) => {
        if (name === 'generate-cancel-token') {
          return { data: { token: 'deadbeef', expires_at: new Date(Date.now() + 1000).toISOString() } }
        }
        return { data: null }
      })
    }
  }
}))

describe('generateCancelToken', () => {
  it('requests server token and returns data', async () => {
    const bookingId = 'BOOK-1234'
    const data = await generateCancelToken(bookingId)
    expect(data).toBeDefined()
    expect(data.token).toBe('deadbeef')
  })

  it('throws when no bookingId provided', async () => {
    // @ts-ignore
    await expect(generateCancelToken()).rejects.toThrow('bookingId required')
  })
})
