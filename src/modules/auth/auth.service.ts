import {
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { compareSync } from 'bcrypt';
import { createHash, randomBytes } from 'crypto';
import { IAuth } from 'src/types/auth';
import { hashPassword } from 'src/utils';
import { Repository } from 'typeorm';
import { RefreshToken } from '../refresh-token/entities/refresh-token.entity';
import { RegisterUserDto } from '../users/dto/create-user.dto';
import { User } from '../users/entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private jwt: JwtService,
    @InjectRepository(User)
    private userRepo: Repository<User>,
    @InjectRepository(RefreshToken)
    private refreshRepo: Repository<RefreshToken>,
  ) {}

  async register(registerUserDto: RegisterUserDto) {
    const exists = await this.userRepo.findOne({
      where: [
        { email: registerUserDto.email },
        { username: registerUserDto.username },
      ],
    });

    if (exists) throw new HttpException('User exists', HttpStatus.BAD_REQUEST);

    const auth = await this.userRepo.save({
      ...registerUserDto,
      passwordHash: hashPassword(registerUserDto.password),
      isActive: true,
    });

    const { email, id, username } = auth;
    return { id, email, username };
  }

  async login(auth: IAuth) {
    const { email, id, username } = auth;
    const user = await this.userRepo.findOne({ where: { email } });

    if (!user || !user.isActive)
      throw new HttpException('Invalid credentials', HttpStatus.UNAUTHORIZED);

    const payload = {
      sub: id,
      email: email,
      username: username,
    };

    const accessToken = this.jwt.sign(payload);

    const newRefreshToken = randomBytes(64).toString('hex');

    await this.refreshRepo.save({
      user_id: user.id,
      token: this.hash(newRefreshToken),
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    return {
      id: user.id,
      email: user.email,
      username: user.username,
      access_token: accessToken,
      refresh_token: newRefreshToken,
    };
  }

  async refresh(refreshToken: string) {
    const tokenHash = this.hash(refreshToken);
    const stored = await this.refreshRepo.findOne({
      where: { token: tokenHash },
    });

    if (!stored || stored.expires_at < new Date() || stored.revoked_at) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    stored.revoked_at = new Date();
    await this.refreshRepo.save(stored);

    const user = await this.userRepo.findOne({
      where: { id: stored.user_id },
    });

    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    const payload = {
      sub: user?.id,
      email: user?.email,
      username: user?.username,
    };

    const accessToken = this.jwt.sign(payload);

    const newRefresh = randomBytes(64).toString('hex');
    await this.refreshRepo.save({
      user_id: user?.id,
      token: this.hash(newRefresh),
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    return { access_token: accessToken, refresh_token: newRefresh };
  }

  async logout(refreshToken: string) {
    const tokenHash = this.hash(refreshToken);

    const stored = await this.refreshRepo.findOne({
      where: { token: tokenHash },
    });

    if (stored && !stored.revoked_at) {
      stored.revoked_at = new Date();
      await this.refreshRepo.save(stored);
    }

    return { success: true };
  }

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.userRepo.findOne({
      where: { email },
    });
    if (user) {
      const isValid = this.comparePassword(password, user.passwordHash);
      if (isValid === true) {
        return user;
      }
    }
    return null;
  }

  comparePassword(password: string, hash: string) {
    return compareSync(password, hash);
  }

  private hash(v: string) {
    return createHash('sha256').update(v).digest('hex');
  }
}
