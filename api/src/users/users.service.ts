import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

// Same reasoning as SELLER_SELECT: contact details aren't part of any
// public payload. `GET /users/me` returns the full row (it's your own
// profile) — this select is only for other people's profiles.
const PUBLIC_PROFILE_SELECT = {
  id: true,
  name: true,
  avatarUrl: true,
  ratingAvg: true,
  ratingCount: true,
  createdAt: true,
};

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('Foydalanuvchi topilmadi');
    return user;
  }

  async getPublicProfile(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: PUBLIC_PROFILE_SELECT,
    });
    if (!user) throw new NotFoundException('Foydalanuvchi topilmadi');
    return user;
  }

  async updateProfile(id: string, dto: UpdateProfileDto) {
    return this.prisma.user.update({ where: { id }, data: dto });
  }
}
