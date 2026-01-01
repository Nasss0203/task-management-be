import 'reflect-metadata';

import * as bcrypt from 'bcrypt';
import { IsNull } from 'typeorm';
import { Permission } from '../../modules/permissions/entities/permission.entity';
import { RolePermission } from '../../modules/role-permissions/entities/role-permission.entity';
import { Role } from '../../modules/role/entities/role.entity';
import { User } from '../../modules/users/entities/user.entity';
import { UserRole } from '../../modules/users/entities/user_role.entity';
import dataSource from '../data-source';

async function seed() {
  await dataSource.initialize();

  const permissionRepo = dataSource.getRepository(Permission);
  const roleRepo = dataSource.getRepository(Role);
  const rolePermRepo = dataSource.getRepository(RolePermission);
  const userRepo = dataSource.getRepository(User);
  const userRoleRepo = dataSource.getRepository(UserRole);

  /* =========================
   * 1. PERMISSIONS
   * ========================= */
  const permissions = [
    'user:create',
    'user:update',
    'user:delete',
    'role:create',
    'role:assign',
    'permission:assign',
    'tenant:manage',
  ];

  for (const code of permissions) {
    const exists = await permissionRepo.findOne({ where: { code } });
    if (!exists) {
      await permissionRepo.save({ code, description: code });
    }
  }

  /* =========================
   * 2. ROLES (SYSTEM ROLES)
   * tenant_id = null
   * ========================= */
  const roles = ['SUPER_ADMIN', 'ADMIN', 'USER'];

  const roleMap: Record<string, Role> = {};

  for (const name of roles) {
    let role = await roleRepo.findOne({ where: { name, tenant_id: IsNull() } });
    if (!role) {
      role = await roleRepo.save({ name, tenant_id: null });
    }
    roleMap[name] = role;
  }

  /* =========================
   * 3. ROLE ↔ PERMISSION
   * ========================= */
  const allPermissions = await permissionRepo.find();

  for (const perm of allPermissions) {
    const exists = await rolePermRepo.findOne({
      where: {
        role_id: roleMap['SUPER_ADMIN'].id,
        permission_id: perm.id,
      },
    });

    if (!exists) {
      await rolePermRepo.save({
        role_id: roleMap['SUPER_ADMIN'].id,
        permission_id: perm.id,
      });
    }
  }

  /* =========================
   * 4. ADMIN USER
   * ========================= */
  const adminEmail = 'admin@system.local';
  let admin = await userRepo.findOne({ where: { email: adminEmail } });

  if (!admin) {
    admin = await userRepo.save({
      email: adminEmail,
      username: 'admin',
      passwordHash: await bcrypt.hash('Admin@123', 10),
      is_active: true,
    });
  }

  /* =========================
   * 5. USER ↔ ROLE (SYSTEM)
   * tenant_id = null
   * ========================= */
  const adminRoleExists = await userRoleRepo.findOne({
    where: {
      user_id: admin.id,
      role_id: roleMap['SUPER_ADMIN'].id,
      tenant_id: IsNull(),
    },
  });

  if (!adminRoleExists) {
    await userRoleRepo.save({
      user_id: admin.id,
      role_id: roleMap['SUPER_ADMIN'].id,
      tenant_id: null,
    });
  }

  console.log('✅ RBAC seed completed');
  await dataSource.destroy();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
