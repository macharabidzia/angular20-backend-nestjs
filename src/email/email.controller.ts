import { Body, Controller, Get, Post } from '@nestjs/common';
import { EmailService } from './email.service';

@Controller('email')
export class EmailController {
  constructor(private email: EmailService) {}

  @Get('test')
  async test() {
    await this.email.sendWelcome('macharabidzia@gmail.com');
    return { ok: true };
  }

  @Post('send-welcome')
  async sendWelcome(@Body('to') to: string) {
    await this.email.sendWelcome(to);
    return { status: 'success', data: true };
  }
}
