import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorator/permission.decorator';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // 1️⃣ Lấy permission yêu cầu từ decorator
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    // Nếu route không yêu cầu permission → cho qua
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    // 2️⃣ Lấy user từ request (JWT đã decode)
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !Array.isArray(user.permissions)) {
      throw new ForbiddenException('Permissions not found');
    }

    // 3️⃣ Check permission
    const hasPermission = requiredPermissions.every((perm) =>
      user.permissions.includes(perm),
    );

    if (!hasPermission) {
      throw new ForbiddenException('Permission denied');
    }

    return true;
  }
}
