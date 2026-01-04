import { genSaltSync, hashSync } from 'bcrypt';

const hashPassword = (password: string) => {
  const salt = genSaltSync(10);
  const hash = hashSync(password, salt);
  return hash;
};

const ROLE_PERMISSION_MAP: Record<string, string[]> = {
  tenant_owner: [
    // toàn quyền trong tenant
    'tenant.manage',
    'tenant.member.assign_role',
    'tenant.role.permission.toggle',

    'project.read',
    'project.create',
    'project.update',
    'project.delete',
  ],

  admin: [
    'tenant.member.assign_role',

    'project.read',
    'project.create',
    'project.update',
    'project.delete',
  ],

  manager: ['project.read', 'project.create', 'project.update'],

  staff: ['project.read', 'project.create'],

  viewer: ['project.read'],
};

export { hashPassword, ROLE_PERMISSION_MAP };
