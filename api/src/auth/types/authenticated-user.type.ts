import type { UserRole } from '@prisma/client';

export interface AuthenticatedUser {
  id: string;
  phone: string;
  role: UserRole;
}

export interface JwtPayload {
  sub: string;
  phone: string;
  role: UserRole;
  type: 'access' | 'refresh';
}
