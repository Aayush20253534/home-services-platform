import type { Request } from 'express';
import type { UserRole } from '@home-services/database';

export type AuthenticatedUser = { id: string; phone: string; role: UserRole; sessionId: string };
export type AuthenticatedRequest = Request & { authUser?: AuthenticatedUser };
export type Tokens = {
  accessToken: string;
  refreshToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
  user: { id: string; phone: string; role: UserRole };
};

export const parseRole = (value: unknown): UserRole => {
  if (value === 'CUSTOMER' || value === 'PROVIDER' || value === 'ADMIN') return value;
  throw new Error('Invalid role');
};
