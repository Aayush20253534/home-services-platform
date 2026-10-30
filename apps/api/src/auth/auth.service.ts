import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  HttpException,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { randomBytes, randomInt, randomUUID, createHmac, timingSafeEqual } from 'node:crypto';
import { UserRole } from '@home-services/database';
import { isE164PhoneNumber } from '@home-services/validation';
import { DatabaseService } from '../database/database.service';
import { OtpSender } from './otp.sender';
import type { AuthenticatedUser, Tokens } from './auth.types';

const OTP_LIFETIME_MS = 5 * 60 * 1000;
const REFRESH_LIFETIME_MS = 30 * 24 * 60 * 60 * 1000;
const ACCESS_LIFETIME_SEC = 15 * 60;
const OTP_ATTEMPTS_MAX = 5;
const ISSUER = 'home-services-api';
const AUDIENCE = 'home-services-platform';

export function digest(secret: string, value: string): string {
  return createHmac('sha256', secret).update(value).digest('hex');
}

export function hashesEqual(a: string, b: string): boolean {
  if (!/^[0-9a-f]{64}$/.test(a) || !/^[0-9a-f]{64}$/.test(b)) return false;
  return timingSafeEqual(Buffer.from(a, 'hex'), Buffer.from(b, 'hex'));
}

export function validateAuthConfiguration(env: NodeJS.ProcessEnv): {
  jwtSecret: string; otpSecret: string; refreshSecret: string;
} {
  const secrets = {
    jwtSecret: env.AUTH_JWT_SECRET ?? '',
    otpSecret: env.AUTH_OTP_SECRET ?? '',
    refreshSecret: env.AUTH_REFRESH_SECRET ?? '',
  };
  if (Object.values(secrets).some((value) => value.length < 32)) {
    throw new Error('AUTH_JWT_SECRET, AUTH_OTP_SECRET, and AUTH_REFRESH_SECRET must each contain at least 32 characters');
  }
  if (new Set(Object.values(secrets)).size !== 3) {
    throw new Error('Authentication secrets must be distinct');
  }
  if (env.NODE_ENV === 'production') {
    if (env.SMS_PROVIDER !== 'twilio') throw new Error('Production requires an SMS delivery provider');
    if ([env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN, env.TWILIO_FROM_NUMBER].some((value) => !value)) {
      throw new Error('Production SMS provider credentials are required');
    }
  }
  return secrets;
}

@Injectable()
export class AuthService {
  private readonly secret: ReturnType<typeof validateAuthConfiguration>;

  constructor(
    private readonly database: DatabaseService,
    private readonly jwt: JwtService,
    private readonly otpSender: OtpSender,
  ) {
    this.secret = validateAuthConfiguration(process.env);
  }

  async requestOtp(phoneValue: unknown, role: UserRole, requesterIp: string) {
    if (!isE164PhoneNumber(phoneValue)) throw new BadRequestException('Enter a valid E.164 phone number');
    const phone = phoneValue;
    const now = Date.now();
    const windowStart = new Date(now - 60_000);
    const hourStart = new Date(now - 60 * 60_000);
    const ipHash = digest(this.secret.otpSecret, requesterIp);

    // Throttle requests before sending an SMS. Limits apply across roles.
    const [recent, hourly, fromIp] = await Promise.all([
      this.database.authOtpChallenge.count({ where: { phone, createdAt: { gte: windowStart } } }),
      this.database.authOtpChallenge.count({ where: { phone, createdAt: { gte: hourStart } } }),
      this.database.authOtpChallenge.count({ where: { requesterHash: ipHash, createdAt: { gte: hourStart } } }),
    ]);
    if (recent > 0 || hourly >= 6 || fromIp >= 25) {
      throw new HttpException('Too many verification requests. Try again later.', HttpStatus.TOO_MANY_REQUESTS);
    }

    const existing = await this.database.user.findUnique({ where: { phone } });
    // Admin accounts are provisioned through a separate privileged DB script.
    // Invalid role and unprovisioned admin requests are indistinguishable.
    if ((existing && existing.role !== role) || (role === 'ADMIN' && !existing)) {
      return {
        challengeId: randomUUID(),
        expiresInSeconds: OTP_LIFETIME_MS / 1000,
        message: 'If this number is eligible, a verification code has been sent.',
      };
    }

    const challengeId = randomUUID();
    const code = randomInt(0, 1_000_000).toString().padStart(6, '0');
    const codeHash = digest(this.secret.otpSecret, `${challengeId}|${phone}|${role}|${code}`);

    await this.database.authOtpChallenge.updateMany({
      where: { phone, consumedAt: null },
      data: { consumedAt: new Date() },
    });
    await this.database.authOtpChallenge.create({
      data: {
        id: challengeId,
        phone,
        role,
        codeHash,
        requesterHash: ipHash,
        expiresAt: new Date(now + OTP_LIFETIME_MS),
      },
    });
    try {
      await this.otpSender.send(phone, code);
    } catch (error) {
      await this.database.authOtpChallenge.deleteMany({ where: { id: challengeId } });
      throw error;
    }
    return {
      challengeId,
      expiresInSeconds: OTP_LIFETIME_MS / 1000,
      message: 'If this number is eligible, a verification code has been sent.',
    };
  }

  async verifyOtp(challengeIdValue: unknown, phoneValue: unknown, codeValue: unknown, role: UserRole): Promise<Tokens> {
    if (
      typeof challengeIdValue !== 'string' ||
      !/^[0-9a-f-]{36}$/i.test(challengeIdValue) ||
      !isE164PhoneNumber(phoneValue) ||
      typeof codeValue !== 'string' ||
      !/^\d{6}$/.test(codeValue)
    ) throw new BadRequestException('Invalid verification request');

    const challenge = await this.database.authOtpChallenge.findUnique({ where: { id: challengeIdValue } });
    const now = new Date();
    if (!challenge || challenge.phone !== phoneValue || challenge.role !== role || challenge.consumedAt ||
      challenge.expiresAt <= now || challenge.attempts >= OTP_ATTEMPTS_MAX) {
      throw new UnauthorizedException('Invalid or expired verification code');
    }

    const expectedHash = digest(this.secret.otpSecret, `${challenge.id}|${phoneValue}|${role}|${codeValue}`);
    if (!hashesEqual(expectedHash, challenge.codeHash)) {
      await this.database.authOtpChallenge.updateMany({
        where: { id: challenge.id, consumedAt: null, attempts: { lt: OTP_ATTEMPTS_MAX } },
        data: { attempts: { increment: 1 } },
      });
      throw new UnauthorizedException('Invalid or expired verification code');
    }

    const used = await this.database.authOtpChallenge.updateMany({
      where: { id: challenge.id, consumedAt: null, expiresAt: { gt: now }, attempts: { lt: OTP_ATTEMPTS_MAX } },
      data: { consumedAt: now },
    });
    if (used.count !== 1) throw new UnauthorizedException('Verification code has already been used');

    const previous = await this.database.user.findUnique({ where: { phone: phoneValue } });
    if (previous && previous.role !== role) throw new ForbiddenException('Account is not eligible for this role');
    if (!previous && role === 'ADMIN') throw new ForbiddenException('Admin account is not provisioned');

    const user = await this.database.user.upsert({
      where: { phone: phoneValue },
      update: {},
      create: {
        phone: phoneValue,
        role,
        ...(role === 'CUSTOMER' ? { customerProfile: { create: { displayName: 'New customer' } } } : {}),
        ...(role === 'PROVIDER' ? { providerProfile: { create: { displayName: 'New provider' } } } : {}),
      },
    });
    if (user.role !== role) throw new ForbiddenException('Account is not eligible for this role');
    return this.issueTokens(user.id, phoneValue, user.role);
  }

  private async signAccess(userId: string, phone: string, role: UserRole, sessionId: string): Promise<string> {
    return this.jwt.signAsync(
      { sub: userId, sid: sessionId, role, phone },
      { secret: this.secret.jwtSecret, algorithm: 'HS256', issuer: ISSUER, audience: AUDIENCE, expiresIn: '15m' },
    );
  }

  private async issueTokens(userId: string, phone: string, role: UserRole): Promise<Tokens> {
    const secretValue = randomBytes(32).toString('base64url');
    const sessionId = randomUUID();
    await this.database.authSession.create({
      data: {
        id: sessionId,
        userId,
        refreshHash: digest(this.secret.refreshSecret, `${sessionId}.${secretValue}`),
        expiresAt: new Date(Date.now() + REFRESH_LIFETIME_MS),
      },
    });
    const accessToken = await this.signAccess(userId, phone, role, sessionId);
    return {
      accessToken,
      refreshToken: `${sessionId}.${secretValue}`,
      expiresIn: ACCESS_LIFETIME_SEC,
      tokenType: 'Bearer',
      user: { id: userId, phone, role },
    };
  }

  async authenticate(accessToken: string): Promise<AuthenticatedUser> {
    let claims: { sub: string; sid: string; role: UserRole; phone: string };
    try {
      claims = await this.jwt.verifyAsync<typeof claims>(accessToken, {
        secret: this.secret.jwtSecret,
        algorithms: ['HS256'],
        issuer: ISSUER,
        audience: AUDIENCE,
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired access token');
    }
    if (!claims?.sub || !claims.sid) throw new UnauthorizedException('Invalid access token');
    const session = await this.database.authSession.findUnique({
      where: { id: claims.sid }, include: { user: true },
    });
    if (!session || session.userId !== claims.sub || session.revokedAt ||
      session.expiresAt <= new Date() || session.user.role !== claims.role ||
      session.user.phone !== claims.phone || !session.user.phone) {
      throw new UnauthorizedException('Session is no longer valid');
    }
    return { id: session.userId, phone: session.user.phone, role: session.user.role, sessionId: session.id };
  }

  async refresh(refreshTokenValue: unknown): Promise<Tokens> {
    if (typeof refreshTokenValue !== 'string' || refreshTokenValue.length > 200 ||
      !/^[0-9a-f-]{36}\.[A-Za-z0-9_-]{43}$/.test(refreshTokenValue)) {
      throw new UnauthorizedException('Invalid refresh token');
    }
    const [sessionId] = refreshTokenValue.split('.');
    const session = await this.database.authSession.findUnique({
      where: { id: sessionId }, include: { user: true },
    });
    if (!session || session.revokedAt || session.expiresAt <= new Date() ||
      !session.user.phone || !hashesEqual(session.refreshHash, digest(this.secret.refreshSecret, refreshTokenValue))) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const nextSecret = randomBytes(32).toString('base64url');
    const nextToken = `${sessionId}.${nextSecret}`;
    // Atomic rotation prevents the same token from being redeemed concurrently.
    const changed = await this.database.authSession.updateMany({
      where: { id: sessionId, refreshHash: session.refreshHash, revokedAt: null, expiresAt: { gt: new Date() } },
      data: { refreshHash: digest(this.secret.refreshSecret, nextToken) },
    });
    if (changed.count !== 1) throw new UnauthorizedException('Refresh token already used');

    const accessToken = await this.signAccess(session.userId, session.user.phone, session.user.role, sessionId);
    return {
      accessToken,
      refreshToken: nextToken,
      tokenType: 'Bearer',
      expiresIn: ACCESS_LIFETIME_SEC,
      user: { id: session.userId, phone: session.user.phone, role: session.user.role },
    };
  }

  async revoke(sessionId: string, userId: string): Promise<void> {
    await this.database.authSession.updateMany({
      where: { id: sessionId, userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async revokeAll(userId: string): Promise<void> {
    await this.database.authSession.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
}
