// src/auth/permissions.service.ts
import { Injectable } from '@nestjs/common';
import { Role, Permission } from './permissions.enum';
import { rolePermissions } from './role-permission-mapping';
import { InjectModel } from '@nestjs/mongoose';
import { User } from 'src/users/entities/user.entity';
import { Model, Types } from 'mongoose';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class PermissionsService {
    constructor(
      @InjectModel(User.name) private readonly userModel: Model<User>
    )
    {}

    private async getUserRoleInOrg(userId: string, orgId: string): Promise<Role | null> {
      const user = await this.userModel.findById(userId).lean().exec();
      
      if (!user || !user.organizationRoles) return null;

      // 2. Convert string orgId to ObjectId for comparison
        const orgIdObj = new Types.ObjectId(orgId);

          // 3. Find matching organization role
        const orgRole = user.organizationRoles.find(role => 
          role.organizationId.toString() === orgIdObj.toString()
        );
      // Assuming user schema has organizations array with roles
      return orgRole ? (orgRole.role as Role) : null;
     
    }
  
    private getRolePermissions(role: Role): Permission[] {
      return rolePermissions[role] || [];
    }

  // Check if user has a specific permission
  async hasPermission(userId: string, orgId: string, permission: Permission): Promise<boolean> {
    const role = await this.getUserRoleInOrg(userId, orgId);
    if (!role) return false;
    
    const permissions = this.getRolePermissions(role);
    return permissions.includes(permission);
  }

    // Check if user has any of the provided permissions in an organization
    async hasAnyPermission(userId: string, orgId: string, permissions: Permission[]): Promise<boolean> {
      const role = await this.getUserRoleInOrg(userId, orgId);
      if (!role) return false;

      const rolePermissions = this.getRolePermissions(role);
      return permissions.some(p => rolePermissions.includes(p));
    }

  // Check if user has all of the provided permissions in an organization
  async hasAllPermissions(userId: string, orgId: string, permissions: Permission[]): Promise<boolean> {
    const role = await this.getUserRoleInOrg(userId, orgId);
    if (!role) return false;
    
    const rolePermissions = this.getRolePermissions(role);
    return permissions.every(p => rolePermissions.includes(p));
  }
}

