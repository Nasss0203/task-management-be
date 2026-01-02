import {
  Body,
  Controller,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { Auth } from 'src/common/decorator/auth.decorator';
import { Public } from 'src/common/decorator/public.decorator';
import { ResponseMessage } from 'src/common/decorator/response-message.decorator';
import { LocalAuthGuard } from 'src/common/guard/local-auth.guard';
import { type IAuth } from 'src/types/auth';
import { RegisterUserDto } from '../users/dto/create-user.dto';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @Public()
  @ResponseMessage('Register user successfully!!')
  register(@Body() registerUserDto: RegisterUserDto) {
    return this.authService.register(registerUserDto);
  }

  @Post('login')
  @Public()
  @UseGuards(LocalAuthGuard)
  @ResponseMessage('Login user successfully!!')
  async login(@Auth() auth: IAuth, @Res({ passthrough: true }) res: Response) {
    const { refresh_token, ...safeData } = await this.authService.login(auth);

    res.cookie('refresh_token', refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/api/v1/auth/refresh',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return safeData;
  }

  @Public()
  @ResponseMessage('Refresh token')
  @Post('refresh')
  async handleRefreshToken(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies?.refresh_token;

    if (!refreshToken) {
      throw new UnauthorizedException('Missing refresh token');
    }

    const { access_token, refresh_token: newRefreshToken } =
      await this.authService.refresh(refreshToken);

    res.cookie('refresh_token', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/api/v1/auth/refresh',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return {
      access_token,
    };
  }

  @ResponseMessage('Logout successfully')
  @Post('logout')
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies?.refresh_token;

    if (!refreshToken) {
      res.clearCookie('refresh_token', {
        path: '/api/v1/auth/refresh',
      });
      return { success: true };
    }

    const log = await this.authService.logout(refreshToken);

    res.clearCookie('refresh_token', {
      path: '/api/v1/auth/refresh',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });

    return log;
  }
}
