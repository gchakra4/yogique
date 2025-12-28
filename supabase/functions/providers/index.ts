import { WhatsAppProvider } from './adapter.ts';
import { metaProvider } from './meta.ts';

export function getProvider(): WhatsAppProvider {
  const requested = (Deno.env.get('MESSAGE_PROVIDER') || 'meta').toLowerCase();

  if (requested !== 'meta') {
    try { console.warn(`MESSAGE_PROVIDER set to '${requested}' — Twilio has been removed; forcing 'meta' provider`); } catch (e) {}
  }

  const phoneId = Deno.env.get('META_PHONE_NUMBER_ID') || '';
  const token = Deno.env.get('META_ACCESS_TOKEN') || '';
  if (!phoneId || !token) {
    try { console.warn('Meta provider missing META_PHONE_NUMBER_ID or META_ACCESS_TOKEN — sends will likely fail'); } catch (e) {}
  }

  try { console.log('WhatsApp Provider (effective):', 'meta'); } catch (e) {}
  return metaProvider;
}
