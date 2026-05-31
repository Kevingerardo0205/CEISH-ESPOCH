import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { AuthService } from '../../application/services/auth.service';
import { UsersService } from '../../application/services/users.service';
import { LocalAuthGuard } from '../guards/local-auth.guard';
import { JwtAuthGuard } from '../../../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../../../shared/guards/roles.guard';
import { Roles } from '../../../../shared/decorators/roles.decorator';
import { Audit } from '../../../../shared/decorators/audit.decorator';
import {
  ForgotPasswordDto,
  ResetPasswordDto,
  ConfirmEmailDto,
} from '../../application/dtos/password-recovery.dto';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';

import { RegisterInvestigatorDto } from '../../application/dtos/register-investigator.dto';
import { CreateUserDto } from '../../application/dtos/create-user.dto';
import { UpdateUserDto } from '../../application/dtos/update-user.dto';
import { SetupAccountDto } from '../../application/dtos/setup-account.dto';

import { RoleCode } from '../../domain/enums/role.enum';

import { PermissionsGuard } from '../../../../shared/guards/permissions.guard';
import { Permissions } from '../../../../shared/decorators/permissions.decorator';
import { Permission } from '../../../../shared/enums/permission.enum';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  @Post('setup-account')
  @HttpCode(HttpStatus.OK)
  async setupAccount(@Body() setupAccountDto: SetupAccountDto) {
    await this.authService.setupAccount(setupAccountDto);
    return {
      message:
        'Cuenta configurada exitosamente. Ya puede iniciar sesión con su nueva contraseña.',
    };
  }

  @UseGuards(LocalAuthGuard)
  // ... existing methods ...
  @Post('login')
  async login(@Request() req) {
    return this.authService.login(req.user);
  }

  @Post('register')
  async register(@Body() userData: RegisterInvestigatorDto) {
    return this.authService.register(userData);
  }

  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Permissions(Permission.USERS_CREATE)
  @Audit('USER_CREATED')
  @Post('users')
  async createUser(@Body() userData: CreateUserDto) {
    return this.usersService.createUser(userData);
  }

  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Permissions(Permission.USERS_EDIT)
  @Audit('USER_UPDATED')
  @Patch('users/:id')
  async updateUser(
    @Param('id', ParseIntPipe) id: number,
    @Body() userData: UpdateUserDto,
  ) {
    return this.usersService.updateUser(id, userData);
  }

  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Permissions(Permission.USERS_VIEW)
  @Get('users')
  async findAllUsers() {
    return this.usersService.findAllUsers();
  }

  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Permissions(Permission.USERS_STATUS_TOGGLE)
  @Audit('USER_STATUS_UPDATED')
  @Patch('users/:id/status')
  async updateUserStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body('isActive') isActive: boolean,
  ) {
    return this.usersService.updateUser(id, { isActive });
  }

  @Post('refresh')
  async refresh(
    @Body('userId') userId: number,
    @Body('refreshToken') refreshToken: string,
  ) {
    return this.authService.refreshTokens(userId, refreshToken);
  }

  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 3, ttl: 900000 } }) // 3 requests per 15 minutes
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    await this.authService.forgotPassword(forgotPasswordDto.email);
    return {
      message: 'Si el correo existe, se ha enviado un enlace de recuperación.',
    };
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
    await this.authService.confirmEmail(
      confirmEmailDto.email,
      confirmEmailDto.code,
    );
    return { message: 'Correo electrónico confirmado exitosamente.' };
  }

  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 3, ttl: 900000 } }) // 3 requests per 15 minutes
  @Post('resend-confirmation')
  @HttpCode(HttpStatus.OK)
  async resendConfirmation(@Body('email') email: string) {
    await this.authService.resendConfirmation(email);
    return {
      message:
        'Si la cuenta existe y no está confirmada, se ha enviado un nuevo enlace.',
    };
  }

  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(RoleCode.ADMIN_TI, RoleCode.PRESIDENTE)
  @Get('roles')
  async getRoles() {
    return this.usersService.getRoles();
  }

  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Permissions(Permission.ROLES_ASSIGN)
  @Audit('USER_ROLES_ASSIGNED')
  @Patch('users/:id/roles')
  async updateUserRoles(
    @Param('id', ParseIntPipe) id: number,
    @Body('roles') roles: string[],
  ) {
    return this.usersService.updateUserRoles(id, roles);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Request() req) {
    return req.user;
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getMe(@Request() req) {
    return this.authService.getMe(req.user.id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(RoleCode.ADMIN_TI, RoleCode.PRESIDENTE)
  @Get('admin-only')
  getAdminData() {
    return { message: 'This is admin only data' };
  }

  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(RoleCode.INVESTIGADOR)
  @Get('investigador-only')
  getInvestigadorData() {
    return { message: 'This is investigador only data' };
  }
}
