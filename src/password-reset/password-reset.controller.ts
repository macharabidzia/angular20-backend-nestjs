import { Controller, Post, Body } from '@nestjs/common';
import { PasswordResetService } from './password-reset.service';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { RequestPasswordDto } from './dto/request-password.dto';

@Controller('password-reset')
export class PasswordResetController {
  constructor(private readonly passwordResetService: PasswordResetService) {}

  @Post('request')
  async requestReset(@Body() dto: RequestPasswordDto) {
    await this.passwordResetService.createResetToken(dto.email);
    return { message: 'OK' }; 
  }

  @Post('reset')
  async resetPassword(@Body() dto: ResetPasswordDto) {
    await this.passwordResetService.resetPassword(dto.token, dto.newPassword);
    return { message: 'PASSWORD_RESET_SUCCESS' };
  }
}
