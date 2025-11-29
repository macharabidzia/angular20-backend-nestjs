import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PrismaService } from '../core/prisma/prisma.service';
import { MulterConfigService } from 'src/upload/services/multer.config.service';
import { UsersService } from 'src/users/users.service';
import { EmailService } from 'src/email/email.service';
import { JwtStrategy } from './jwt.strategy';
import { PasswordResetModule } from 'src/password-reset/password-reset.module';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'super-secret-key',
      signOptions: { expiresIn: '7d' },
    }),
    PasswordResetModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    PrismaService,
    MulterConfigService,
    UsersService,
    EmailService,
    JwtStrategy,
  ],
})
export class AuthModule {}
