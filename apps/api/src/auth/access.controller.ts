import { Controller, Get, Req } from '@nestjs/common';
import { Roles } from './auth.decorators';
import type { AuthenticatedRequest } from './auth.types';

@Controller('access')
export class AccessController {
  @Get('admin')
  @Roles('ADMIN')
  admin(@Req() request: AuthenticatedRequest) {
    return { permitted: true, role: request.authUser?.role };
  }

  @Get('provider')
  @Roles('PROVIDER')
  provider(@Req() request: AuthenticatedRequest) {
    return { permitted: true, role: request.authUser?.role };
  }
}
