import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionsService } from 'src/modules/permissions/permissions.service';
import { TenantAccessService } from 'src/modules/tenant/services/tenant-access.service';
import { PERMISSIONS_KEY } from '../decorator/permission.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly tenantAccessService: TenantAccessService,
    private readonly permissionService: PermissionsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!required || required.length === 0) return true;

    const req = context.switchToHttp().getRequest();

    const userId: string | undefined = req.user?.id;

    const tenantId: string | undefined = req.params?.id || req.params?.tenantId;

    if (!userId || !tenantId) {
      throw new ForbiddenException('Missing userId or tenantId');
    }

    const permissionCodes = await this.permissionService.getUserPermissions(
      userId,
      tenantId,
    );

    const ok = required.every((p) => permissionCodes.includes(p));
    if (!ok) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return true;
  }
}
