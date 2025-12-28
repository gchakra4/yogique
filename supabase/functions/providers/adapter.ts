export interface WhatsAppProvider {
  // Generic send interface. Providers MAY use `otp` or `metadata` fields when present.
  sendMessage(params: {
    to: string;
    type: 'template' | 'text';
    templateName?: string;
    templateLanguage?: string;
    templateParameters?: any[];
    textBody?: string;
    // Optional OTP code (not logged) — providers may render this into messages.
    otp?: string;
    // Arbitrary metadata passed to provider implementations
    metadata?: Record<string, unknown> | null;
  }): Promise<{
    ok: boolean;
    provider: string;
    provider_message_id?: string | null;
    rawResponse: any;
    // attempts may be present when using retry wrappers
    attempts?: number;
  }>;
}

export type SendMessageParams = Parameters<WhatsAppProvider['sendMessage']>[0];
