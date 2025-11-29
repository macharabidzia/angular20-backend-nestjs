import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../core/prisma/prisma.service';
import * as crypto from 'crypto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class PasswordResetService {
  constructor(private prisma: PrismaService) {}

  // 1) Request reset
  async createResetToken(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) return; // Do NOT leak existence of the email

    // invalidate previous tokens
    await this.prisma.passwordResetToken.deleteMany({
      where: { userId: user.id },
    });

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 1000 * 60 * 15); // 15 minutes

    await this.prisma.passwordResetToken.create({
      data: { token, userId: user.id, expiresAt },
    });

    return { token, user };
  }

  // 2) Reset password
  async resetPassword(token: string, newPassword: string) {
    const reset = await this.prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!reset) throw new BadRequestException('INVALID_TOKEN');
    if (reset.expiresAt < new Date())
      throw new BadRequestException('TOKEN_EXPIRED');

    // hash new password
    const hashed = await bcrypt.hash(newPassword, 10);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: reset.userId },
        data: { password: hashed },
      }),

      // delete token so it can't be reused
      this.prisma.passwordResetToken.delete({
        where: { id: reset.id },
      }),
    ]);

    return true;
  }

  // (optional)
  async cleanupExpired() {
    await this.prisma.passwordResetToken.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
  }
}
