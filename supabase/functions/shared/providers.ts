import { WhatsAppProvider } from '../providers/adapter.ts';
import { metaProvider as _meta } from '../providers/meta.ts';
import { twilioProvider as _twilio } from '../providers/twilio.ts';
import renderer from './waTemplateRenderer.ts';

// Re-export providers through a central shared module to stabilize imports
export const metaProvider: WhatsAppProvider = _meta;
export const twilioProvider: WhatsAppProvider = _twilio;

export default { metaProvider, twilioProvider, renderer };
