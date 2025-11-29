import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../core/prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { LoginDto } from './dto/login.dto';
import { UsersService } from '../users/users.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { RoleName } from '@prisma/client';
import { EmailService } from 'src/email/email.service';
import { MessageCode } from '../common/constants/message-code.enum'; // import the enum

export interface JwtPayload {
  sub: number;
  email: string;
  roleName: RoleName;
  permissions: string[];
}

@Injectable()
export class AuthService {
  private readonly JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key';

  constructor(
    private prisma: PrismaService,
    private userService: UsersService,
    private emailService: EmailService,
  ) {}

  async register(dto: CreateUserDto, avatarFile?: Express.Multer.File) {
    const existing = await this.userService.findByEmail(dto.email);
    if (existing) throw new ConflictException(MessageCode.USER_ALREADY_EXISTS);

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const roleModel = await this.prisma.role.findUnique({
      where: { name: dto.role ?? RoleName.USER },
      include: { permissions: true },
    });

    if (!roleModel) {
      throw new Error(
        `Role ${dto.role ?? RoleName.USER} not found. Seed roles first.`,
      );
    }

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        password: hashedPassword,
        username: dto.username,
        name: dto.name,
        phone: dto.phone,
        translations: dto.translations
          ? {
              create: dto.translations.map((t) => ({
                lang: t.lang,
                name: t.name,
                bio: t.bio,
              })),
            }
          : undefined,
        role: { connect: { id: roleModel.id } },
        permissions: {
          connect: roleModel.permissions.map((p) => ({ id: p.id })),
        },
      },
    });

    const verificationToken = crypto.randomUUID();

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        verificationToken,
        verificationExpires: new Date(Date.now() + 86400000), // 1 day expiration
      },
    });

    await this.emailService.sendVerificationEmail(
      user.email,
      verificationToken,
    );

    if (avatarFile) {
      await this.userService.addAvatar(
        user.id,
        `/uploads/${avatarFile.filename}`,
      );
    }

    return {
      status: 'success',
      message: MessageCode.USER_REGISTER, // Use enum code for response
    };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      select: {
        id: true,
        email: true,
        password: true,
        isVerified: true,
        role: { select: { name: true } },
        permissions: { select: { code: true } }, // <---- USE user.permissions
      },
    });

    if (!user) throw new UnauthorizedException(MessageCode.INVALID_CREDENTIALS);

    if (!user.isVerified) {
      throw new UnauthorizedException(MessageCode.EMAIL_NOT_VERIFIED);
    }

    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid)
      throw new UnauthorizedException(MessageCode.INVALID_CREDENTIALS);
    if (!user.role)
      throw new UnauthorizedException(MessageCode.NO_ROLE_ASSIGNED);

    const permissions = user.permissions.map((p) => p.code);
    return this.generateToken(user.id, user.email, user.role.name, permissions);
  }
  private generateToken(
    userId: number,
    email: string,
    roleName: RoleName,
    permissions: string[],
  ) {
    const payload: JwtPayload = { sub: userId, email, roleName, permissions };
    const token = jwt.sign(payload, this.JWT_SECRET, { expiresIn: '7d' });
    return { access_token: token };
  }
  async verifyToken(token: string): Promise<JwtPayload> {
    try {
      return jwt.verify(token, this.JWT_SECRET) as unknown as JwtPayload;
    } catch {
      throw new UnauthorizedException(MessageCode.INVALID_TOKEN);
    }
  }

  async getUserById(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      omit: { password: true },
      include: {
        role: { include: { permissions: true } },
        permissions: true,
        translations: true,
        images: true,
        jobs: true,
        reviews: true,
      },
    });
    if (!user) throw new UnauthorizedException(MessageCode.USER_NOT_FOUND);
    return user;
  }

  async verifyEmailToken(token: string) {
    if (!token) throw new UnauthorizedException(MessageCode.INVALID_TOKEN);

    const user = await this.prisma.user.findFirst({
      where: {
        verificationToken: token,
        verificationExpires: { gt: new Date() }, // token not expired
      },
      include: {
        role: true,
        permissions: true,
      },
    });

    if (!user)
      throw new UnauthorizedException(MessageCode.INVALID_OR_EXPIRED_TOKEN);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        isVerified: true,
        verificationToken: null,
        verificationExpires: null,
      },
    });

    if (!user.role)
      throw new UnauthorizedException(MessageCode.USER_HAS_NO_ROLE);
    const permissions = user.permissions.map((p) => p.code);
    const tokenObj = this.generateToken(
      user.id,
      user.email,
      user.role.name,
      permissions,
    );

    return {
      status: 'success',
      message: MessageCode.EMAIL_VERIFIED_SUCCESS,
      ...tokenObj,
    };
  }
}
