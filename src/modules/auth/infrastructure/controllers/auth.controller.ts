import { Controller, Post, Body, UseGuards, Request, Get } from '@nestjs/common';
import { AuthService } from '../../application/services/auth.service';
import { LocalAuthGuard } from '../guards/local-auth.guard';
import { JwtAuthGuard } from '../../../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../../../shared/guards/roles.guard';
import { Roles } from '../../../../shared/decorators/roles.decorator';


@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(@Request() req) {
    return this.authService.login(req.user);
  }

  @Post('register')
  async register(@Body() userData: any) {
    return this.authService.register(userData);
  }

  @Post('refresh')
  async refresh(@Body('userId') userId: number, @Body('refreshToken') refreshToken: string) {
    return this.authService.refreshTokens(userId, refreshToken);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Request() req) {
    return req.user;
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('presidente', 'admin_ti')
  @Get('admin-only')
  getAdminData() {
    return { message: 'This is admin only data' };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('investigador')
  @Get('investigador-only')
  getInvestigadorData() {
    return { message: 'This is investigador only data' };
  }
}
