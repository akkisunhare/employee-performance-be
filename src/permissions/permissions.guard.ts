// src/auth/permissions.guard.ts
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionsService } from './permissions.service';
import { Role, Permission } from './permissions.enum';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly permissionsService: PermissionsService,
    private readonly userService: UsersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userId: string = request.user?.id;
    const orgId: string = request.user?.organizationId;

    if (!userId) {
      return false;
    }

    const user = await this.userService.findOne(userId);
    if (!user || !user.role) {
      return false;
    }

    const requiredPermissions = this.reflector.get<Permission[]>('permissions', context.getHandler()) || [];
    
    if (requiredPermissions.length === 0) {
      return true;
    }

    return this.permissionsService.hasAllPermissions(userId,orgId, requiredPermissions);
  }
}
