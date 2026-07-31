import { Injectable, Logger } from '@nestjs/common';
import type { SmsProvider } from './sms-provider.interface';

// Used in local dev when Eskiz credentials aren't configured — logs the
// code instead of sending a real SMS so the OTP flow stays testable.
@Injectable()
export class ConsoleSmsProvider implements SmsProvider {
  private readonly logger = new Logger('SMS');

  sendOtp(phone: string, code: string): Promise<void> {
    this.logger.log(`OTP for ${phone}: ${code}`);
    return Promise.resolve();
  }
}
