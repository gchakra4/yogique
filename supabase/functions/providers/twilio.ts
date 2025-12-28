import { WhatsAppProvider } from './adapter.ts';

// Twilio integration removed — provide a stub that fails fast.
export const twilioProvider: WhatsAppProvider = {
  async sendMessage(_params) {
    return {
      ok: false,
      provider: 'twilio',
      provider_message_id: null,
      rawResponse: { error: 'twilio_integration_removed' },
    };
  }
};
