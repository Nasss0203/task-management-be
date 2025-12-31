import { Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { Permission } from '../../permissions/entities/permission.entity';
import { Role } from '../../role/entities/role.entity';

@Entity('role_permissions')
export class RolePermission {
  @PrimaryColumn('uuid')
  role_id: string;

  @PrimaryColumn('uuid')
  permission_id: string;

  @ManyToOne(() => Role, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'role_id' })
  role: Role;

  @ManyToOne(() => Permission, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'permission_id' })
  permission: Permission;
}
