import { Controller, Post, Body, UseGuards, Request, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from '../../application/services/auth.service';
import { LocalAuthGuard } from '../guards/local-auth.guard';
import { JwtAuthGuard } from '../../../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../../../shared/guards/roles.guard';
import { Roles } from '../../../../shared/decorators/roles.decorator';
import { ForgotPasswordDto, ResetPasswordDto } from '../../application/dtos/password-recovery.dto';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';


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

  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 3, ttl: 900000 } }) // 3 requests per 15 minutes
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    await this.authService.forgotPassword(forgotPasswordDto.email);
    return { message: 'Si el correo existe, se ha enviado un enlace de recuperación.' };
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    await this.authService.resetPassword(resetPasswordDto.token, resetPasswordDto.newPassword);
    return { message: 'Contraseña actualizada exitosamente.' };
  }

  @Get('confirm-email')
  @HttpCode(HttpStatus.OK)
  async confirmEmail(@Request() req) {
    const token = req.query.token;
    await this.authService.confirmEmail(token);
    return { message: 'Correo electrónico confirmado exitosamente.' };
  }

  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 3, ttl: 900000 } }) // 3 requests per 15 minutes
  @Post('resend-confirmation')
  @HttpCode(HttpStatus.OK)
  async resendConfirmation(@Body('email') email: string) {
    await this.authService.resendConfirmation(email);
    return { message: 'Si la cuenta existe y no está confirmada, se ha enviado un nuevo enlace.' };
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
