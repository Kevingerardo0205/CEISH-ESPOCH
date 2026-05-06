import { Controller, Post, Body, UseGuards, Request, Get, HttpCode, HttpStatus, Patch, Param, ParseIntPipe } from '@nestjs/common';
import { AuthService } from '../../application/services/auth.service';
import { LocalAuthGuard } from '../guards/local-auth.guard';
import { JwtAuthGuard } from '../../../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../../../shared/guards/roles.guard';
import { Roles } from '../../../../shared/decorators/roles.decorator';
import { ForgotPasswordDto, ResetPasswordDto, ConfirmEmailDto } from '../../application/dtos/password-recovery.dto';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';


import { RegisterInvestigatorDto } from '../../application/dtos/register-investigator.dto';
import { CreateUserDto } from '../../application/dtos/create-user.dto';
import { UpdateUserDto } from '../../application/dtos/update-user.dto';


@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(@Request() req) {
    return this.authService.login(req.user);
  }

  @Post('register')
  async register(@Body() userData: RegisterInvestigatorDto) {
    return this.authService.register(userData);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('presidente', 'admin_ti')
  @Post('users')
  async createUser(@Body() userData: CreateUserDto) {
    return this.authService.createUser(userData);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('presidente', 'admin_ti')
  @Patch('users/:id')
  async updateUser(@Param('id', ParseIntPipe) id: number, @Body() userData: UpdateUserDto) {
    return this.authService.updateUser(id, userData);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('presidente', 'admin_ti')
  @Get('users')
  async findAllUsers() {
    return this.authService.findAllUsers();
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
    await this.authService.resetPassword(
      resetPasswordDto.email,
      resetPasswordDto.code,
      resetPasswordDto.newPassword,
    );
    return { message: 'Contraseña actualizada exitosamente.' };
  }

  @Post('confirm-email')
  @HttpCode(HttpStatus.OK)
  async confirmEmail(@Body() confirmEmailDto: ConfirmEmailDto) {
    await this.authService.confirmEmail(confirmEmailDto.email, confirmEmailDto.code);
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

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('presidente', 'admin_ti')
  @Get('roles')
  async getRoles() {
    return this.authService.getRoles();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('presidente', 'admin_ti')
  @Patch('users/:id/roles')
  async updateUserRoles(@Param('id', ParseIntPipe) id: number, @Body('roles') roles: string[]) {
    return this.authService.updateUserRoles(id, roles);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Request() req) {
    return req.user;
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getMe(@Request() req) {
    return this.authService.getMe(req.user.sub);
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
