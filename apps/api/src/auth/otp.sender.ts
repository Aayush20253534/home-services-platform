import { Injectable, ServiceUnavailableException } from '@nestjs/common';

@Injectable()
export class OtpSender {
  async send(phone: string, code: string): Promise<void> {
    const provider = process.env.SMS_PROVIDER ?? 'disabled';

    if (provider === 'dev-console') {
      if (process.env.NODE_ENV === 'production' || process.env.AUTH_DEV_OTP !== 'true') {
        throw new ServiceUnavailableException('SMS delivery is not configured');
      }
      // Never enabled in production. Do not log other authentication secrets.
      console.info(`[LOCAL DEV OTP] ${phone}: ${code}`);
      return;
    }

    if (provider !== 'twilio') {
      throw new ServiceUnavailableException('SMS delivery is not configured');
    }

    const sid = process.env.TWILIO_ACCOUNT_SID ?? '';
    const token = process.env.TWILIO_AUTH_TOKEN ?? '';
    const from = process.env.TWILIO_FROM_NUMBER ?? '';
    if (!sid || !token || !from) {
      throw new ServiceUnavailableException('SMS delivery is not configured');
    }
    const body = new URLSearchParams({
      From: from,
      To: phone,
      Body: `Your Home Services verification code is ${code}. It expires in 5 minutes. Do not share it.`,
    });
    try {
      const response = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(sid)}/Messages.json`,
        {
          method: 'POST',
          headers: {
            Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString('base64')}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body,
          signal: AbortSignal.timeout(10000),
        },
      );
      if (!response.ok) throw new Error('Twilio rejected the message');
    } catch {
      throw new ServiceUnavailableException('SMS delivery failed');
    }
  }
}
