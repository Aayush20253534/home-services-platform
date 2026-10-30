import { Body, Controller, Get, HttpCode, Post, Req, BadRequestException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Public } from './auth.decorators';
import type { AuthenticatedRequest } from './auth.types';
import { parseRole } from './auth.types';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('request-otp')
  @Public()
  @HttpCode(200)
  async requestOtp(@Body() body: Record<string, unknown>, @Req() req: AuthenticatedRequest) {
    let role;
    try { role = parseRole(body?.role); } catch { throw new BadRequestException('Invalid role'); }
    return this.auth.requestOtp(body?.phone, role, req.ip ?? req.socket.remoteAddress ?? 'unknown');
  }

  @Post('verify-otp')
  @Public()
  @HttpCode(200)
  async verifyOtp(@Body() body: Record<string, unknown>) {
    let role;
    try { role = parseRole(body?.role); } catch { throw new BadRequestException('Invalid role'); }
    return this.auth.verifyOtp(body?.challengeId, body?.phone, body?.code, role);
  }

  @Post('refresh')
  @Public()
  @HttpCode(200)
  refresh(@Body() body: Record<string, unknown>) {
    return this.auth.refresh(body?.refreshToken);
  }

  @Post('logout')
  @HttpCode(200)
  async logout(@Req() request: AuthenticatedRequest) {
    await this.auth.revoke(request.authUser!.sessionId, request.authUser!.id);
    return { success: true };
  }

  @Post('logout-all')
  @HttpCode(200)
  async logoutAll(@Req() request: AuthenticatedRequest) {
    await this.auth.revokeAll(request.authUser!.id);
    return { success: true };
  }

  @Get('me')
  me(@Req() request: AuthenticatedRequest) {
    const user = request.authUser!;
    return { id: user.id, phone: user.phone, role: user.role };
  }
}
