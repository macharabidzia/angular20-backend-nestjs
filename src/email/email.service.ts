import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class EmailService {
  constructor(private mailer: MailerService) {}

  async sendWelcome(to: string) {
    return this.mailer.sendMail({
      to,
      subject: 'Welcome',
      html: `<p>Welcome to our platform</p>`,
    });
  }
  async sendVerificationEmail(email: string, token: string) {
    const uiUrl = process.env.FRONTEND_URL;
    const url = `${uiUrl}/en/auth/verify-email?token=${token}`;

    return this.mailer.sendMail({
      to: email,
      subject: 'Verify Email',
      html: `Click here to activate your account:<br><br><a href="${url}">${url}</a>`,
    });
  }
  async sendPasswordReset(to: string, link: string) {
    return this.mailer.sendMail({
      to,
      subject: 'Reset your password',
      html: `
      <p>You requested a password reset.</p>
      <p><a href="${link}">Click here to reset your password</a></p>
      <p>This link expires in 15 minutes.</p>
    `,
    });
  }
}
