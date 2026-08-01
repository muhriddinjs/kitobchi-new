import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../prisma/prisma.service';
import type {
  AuthenticatedUser,
  JwtPayload,
} from '../types/authenticated-user.type';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('JWT_ACCESS_SECRET'),
    });
  }

  // Costs one primary-key lookup per authenticated request, in exchange for
  // role and ban state being current rather than whatever was true when the
  // 15-minute access token was minted. That matters both ways: a ban takes
  // effect immediately, and promoting someone to ADMIN doesn't require them
  // to log out and back in.
  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    if (payload.type !== 'access') {
      throw new UnauthorizedException('Invalid token type');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, phone: true, role: true, bannedAt: true },
    });

    if (!user) throw new UnauthorizedException('Foydalanuvchi topilmadi');
    if (user.bannedAt) throw new UnauthorizedException('Hisobingiz bloklangan');

    return { id: user.id, phone: user.phone, role: user.role };
  }
}
