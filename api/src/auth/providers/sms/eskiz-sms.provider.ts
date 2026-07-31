import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import type { SmsProvider } from './sms-provider.interface';

// https://documenter.getpostman.com/view/663428/RzfmESqx
@Injectable()
export class EskizSmsProvider implements SmsProvider {
  private readonly logger = new Logger('SMS');
  private readonly http: AxiosInstance;
  private token: string | null = null;

  constructor(private readonly config: ConfigService) {
    this.http = axios.create({
      baseURL: this.config.getOrThrow<string>('ESKIZ_BASE_URL'),
    });
  }

  async sendOtp(phone: string, code: string): Promise<void> {
    const message = `Kitobchi tasdiqlash kodi: ${code}`;
    await this.send(phone, message);
  }

  private async send(
    phone: string,
    message: string,
    retry = true,
  ): Promise<void> {
    const token = await this.getToken();

    try {
      await this.http.post(
        '/message/sms/send',
        {
          mobile_phone: phone.replace('+', ''),
          message,
          from: this.config.getOrThrow<string>('ESKIZ_FROM'),
        },
        { headers: { Authorization: `Bearer ${token}` } },
      );
    } catch (err) {
      if (retry && axios.isAxiosError(err) && err.response?.status === 401) {
        this.token = null;
        await this.send(phone, message, false);
        return;
      }
      this.logger.error('Failed to send SMS via Eskiz', err);
      throw err;
    }
  }

  private async getToken(): Promise<string> {
    if (this.token) return this.token;

    const { data } = await this.http.post<{ data: { token: string } }>(
      '/auth/login',
      {
        email: this.config.getOrThrow<string>('ESKIZ_EMAIL'),
        password: this.config.getOrThrow<string>('ESKIZ_PASSWORD'),
      },
    );

    this.token = data.data.token;
    return this.token;
  }
}
