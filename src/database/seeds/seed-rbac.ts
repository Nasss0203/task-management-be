import * as bcrypt from 'bcrypt';
import 'reflect-metadata';
import { IsNull } from 'typeorm';

import { Permission } from '../../modules/permissions/entities/permission.entity';
import { RolePermission } from '../../modules/role-permissions/entities/role-permission.entity';
import { Role } from '../../modules/role/entities/role.entity';
import { UserRole } from '../../modules/users/entities/user-role.entity';
import { User } from '../../modules/users/entities/user.entity';
import dataSource from '../data-source';

async function seed() {
  await dataSource.initialize();

  const permissionRepo = dataSource.getRepository(Permission);
  const roleRepo = dataSource.getRepository(Role);
  const rolePermRepo = dataSource.getRepository(RolePermission);
  const userRepo = dataSource.getRepository(User);
  const userRoleRepo = dataSource.getRepository(UserRole);

  // 1️⃣ PERMISSIONS (CỐ ĐỊNH)
  const permissions = [
    'tenant.manage',
    'tenant.member.manage',

    'project.create',
    'project.read',
    'project.update',
    'project.delete',

    'task.create',
    'task.read',
    'task.update',
    'task.delete',
    'task.assign',
    'task.change_status',
  ];

  for (const code of permissions) {
    const exists = await permissionRepo.findOne({ where: { code } });
    if (!exists) {
      await permissionRepo.save({ code, description: code });
    }
  }

  // 2️⃣ SYSTEM ROLE – CHỈ 1
  let superAdminRole = await roleRepo.findOne({
    where: { name: 'SUPER_ADMIN', tenant_id: IsNull() },
  });

  if (!superAdminRole) {
    superAdminRole = await roleRepo.save({
      name: 'SUPER_ADMIN',
      tenant_id: null,
    });
  }

  // 3️⃣ SUPER_ADMIN → ALL PERMISSIONS
  const allPermissions = await permissionRepo.find();

  for (const perm of allPermissions) {
    const exists = await rolePermRepo.findOne({
      where: {
        role_id: superAdminRole.id,
        permission_id: perm.id,
      },
    });

    if (!exists) {
      await rolePermRepo.save({
        role_id: superAdminRole.id,
        permission_id: perm.id,
      });
    }
  }

  // 4️⃣ SYSTEM ADMIN USER
  const adminEmail = 'admin@system.local';

  let admin = await userRepo.findOne({ where: { email: adminEmail } });

  if (!admin) {
    admin = await userRepo.save({
      email: adminEmail,
      username: 'admin',
      passwordHash: await bcrypt.hash('Admin@123', 10),
      isActive: true,
    });
  }

  // 5️⃣ GÁN SUPER_ADMIN
  const existsRole = await userRoleRepo.findOne({
    where: {
      user_id: admin.id,
      role_id: superAdminRole.id,
      tenant_id: IsNull(),
    },
  });

  if (!existsRole) {
    await userRoleRepo.save({
      user_id: admin.id,
      role_id: superAdminRole.id,
      tenant_id: null,
    });
  }

  console.log('✅ System RBAC seeded');
  await dataSource.destroy();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
