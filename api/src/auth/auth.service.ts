import {
  BadRequestException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { Redis } from '@upstash/redis';
import { PrismaService } from '../prisma/prisma.service';
import { REDIS_CLIENT } from '../redis/redis.module';
import { SMS_PROVIDER } from './providers/sms/sms-provider.interface';
import type { SmsProvider } from './providers/sms/sms-provider.interface';
import type {
  AuthenticatedUser,
  JwtPayload,
} from './types/authenticated-user.type';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
    @Inject(SMS_PROVIDER) private readonly sms: SmsProvider,
  ) {}

  async requestOtp(phone: string): Promise<{ retryAfterSeconds: number }> {
    const cooldownKey = this.cooldownKey(phone);
    const cooldownLeft = await this.redis.ttl(cooldownKey);
    if (cooldownLeft > 0) {
      throw new BadRequestException(
        `Iltimos, ${cooldownLeft} soniyadan keyin qayta urinib koʻring`,
      );
    }

    const code = this.generateCode();
    const ttl = Number(this.config.get('OTP_TTL_SECONDS', '120'));
    const cooldown = Number(
      this.config.get('OTP_RESEND_COOLDOWN_SECONDS', '60'),
    );

    await this.redis.set(this.otpKey(phone), code, { ex: ttl });
    await this.redis.set(cooldownKey, '1', { ex: cooldown });

    await this.sms.sendOtp(phone, code);

    return { retryAfterSeconds: cooldown };
  }

  async verifyOtp(phone: string, code: string): Promise<TokenPair> {
    const stored = await this.redis.get(this.otpKey(phone));

    if (!stored || stored !== code) {
      throw new UnauthorizedException('Kod notoʻgʻri yoki muddati oʻtgan');
    }

    await this.redis.del(this.otpKey(phone));

    const user = await this.prisma.user.upsert({
      where: { phone },
      update: {},
      create: { phone, name: phone },
    });

    return this.issueTokens({
      id: user.id,
      phone: user.phone,
      role: user.role,
    });
  }

  async refresh(refreshToken: string): Promise<TokenPair> {
    let payload: JwtPayload;
    try {
      payload = await this.jwt.verifyAsync<JwtPayload>(refreshToken, {
        secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Yaroqsiz refresh token');
    }

    if (payload.type !== 'refresh') {
      throw new UnauthorizedException('Yaroqsiz token turi');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });
    if (!user) throw new UnauthorizedException('Foydalanuvchi topilmadi');

    return this.issueTokens({
      id: user.id,
      phone: user.phone,
      role: user.role,
    });
  }

  private async issueTokens(user: AuthenticatedUser): Promise<TokenPair> {
    const basePayload = { sub: user.id, phone: user.phone, role: user.role };

    const accessToken = await this.jwt.signAsync(
      { ...basePayload, type: 'access' } satisfies JwtPayload,
      {
        secret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'),
        expiresIn: this.config.get('JWT_ACCESS_EXPIRES_IN', '15m'),
      },
    );

    const refreshToken = await this.jwt.signAsync(
      { ...basePayload, type: 'refresh' } satisfies JwtPayload,
      {
        secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.config.get('JWT_REFRESH_EXPIRES_IN', '30d'),
      },
    );

    return { accessToken, refreshToken };
  }

  private generateCode(): string {
    return String(Math.floor(100000 + Math.random() * 900000));
  }

  private otpKey(phone: string): string {
    return `otp:${phone}`;
  }

  private cooldownKey(phone: string): string {
    return `otp-cooldown:${phone}`;
  }
}
