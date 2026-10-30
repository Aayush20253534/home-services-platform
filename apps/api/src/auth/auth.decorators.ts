import { SetMetadata } from '@nestjs/common';
import type { UserRole } from '@home-services/database';

export const IS_PUBLIC = 'auth:isPublic';
export const AUTH_ROLES = 'auth:roles';
export const Public = () => SetMetadata(IS_PUBLIC, true);
export const Roles = (...roles: UserRole[]) => SetMetadata(AUTH_ROLES, roles);
