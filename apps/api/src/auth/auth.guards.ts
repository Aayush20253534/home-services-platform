import {
  CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthService } from './auth.service';
import { AUTH_ROLES, IS_PUBLIC } from './auth.decorators';
import type { AuthenticatedRequest } from './auth.types';
import type { UserRole } from '@home-services/database';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly reflector: Reflector, private readonly auth: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC, [
      context.getHandler(), context.getClass(),
    ]);
    if (isPublic) return true;
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const header = request.headers.authorization ?? '';
    if (!/^Bearer [^\s]+$/.test(header)) throw new UnauthorizedException('Authentication required');
    request.authUser = await this.auth.authenticate(header.slice(7));
    return true;
  }
}

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.getAllAndOverride<UserRole[]>(AUTH_ROLES, [
      context.getHandler(), context.getClass(),
    ]);
    if (!roles?.length) return true;
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    if (!request.authUser || !roles.includes(request.authUser.role)) {
      throw new ForbiddenException('Insufficient permissions');
    }
    return true;
  }
}
