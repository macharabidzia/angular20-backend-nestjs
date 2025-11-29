import {
  Controller,
  Post,
  Body,
  Res,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
  Get,
  Req,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  Query,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { FormDataJsonPipe } from '../common/pipes/form-data-json.pipe';
import { MulterConfigService } from 'src/upload/services/multer.config.service';
import { AuthCookieInterceptor } from './interceptors/auth.interceptor';
import { CreateUserDto } from 'src/users/dto/create-user.dto';
import { MessageCode } from '../common/constants/message-code.enum';
import { RequestPasswordDto } from 'src/password-reset/dto/request-password.dto';
import { PasswordResetService } from 'src/password-reset/password-reset.service';
import { ResetPasswordDto } from 'src/password-reset/dto/reset-password.dto';
import { EmailService } from 'src/email/email.service';
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly multerConfig: MulterConfigService,
    private resetService: PasswordResetService,
    private emailService: EmailService,
  ) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    FileInterceptor('avatar', new MulterConfigService().createMulterOptions()),
  )
  async register(
    @Body(FormDataJsonPipe) dto: CreateUserDto,
    @UploadedFile(
      new ParseFilePipe({
        validators: [new MaxFileSizeValidator({ maxSize: 1024 * 1024 * 5 })],
        fileIsRequired: false,
      }),
    )
    file?: Express.Multer.File,
  ) {
    await this.authService.register(dto, file);

    return {
      status: 'success',
      message: MessageCode.USER_REGISTER,
    };
  }

  @Post('login')
  @UseInterceptors(AuthCookieInterceptor)
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { access_token } = await this.authService.login(dto);

    if (!access_token)
      throw new UnauthorizedException(MessageCode.INVALID_CREDENTIALS);

    return {
      status: 'success',
      access_token: access_token,
      message: MessageCode.LOGGED_IN,
    };
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('access_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      domain: 'localhost',
    });
    return;
  }

  @Get('me')
  @HttpCode(HttpStatus.OK)
  async me(@Req() req: Request) {
    const token = req.cookies?.['access_token'];
    if (!token) throw new UnauthorizedException(MessageCode.NO_TOKEN_FOUND);

    const payload = await this.authService.verifyToken(token);
    const user = await this.authService.getUserById(payload.sub);

    return {
      status: 'success',
      data: user,
      message: MessageCode.SUCCESS,
    };
  }

  @Get('verify-email')
  async verifyEmail(@Query('token') token: string) {
    return this.authService.verifyEmailToken(token);
  }

  @Post('request-password-reset')
  async requestReset(@Body() dto: RequestPasswordDto) {
    const result = await this.resetService.createResetToken(dto.email);
    if (!result) return { message: 'OK' };

    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${result.token}`;

    await this.emailService.sendPasswordReset(result.user.email, resetLink);

    return { message: 'OK' };
  }

  @Post('reset-password')
  async resetPass(@Body() dto: ResetPasswordDto) {
    await this.resetService.resetPassword(dto.token, dto.newPassword);
    return { message: 'PASSWORD_UPDATED' };
  }
}
