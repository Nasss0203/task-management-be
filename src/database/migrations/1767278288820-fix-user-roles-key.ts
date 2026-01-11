import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixUserRolesKey1767278288820 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Drop PK cũ (user_id, role_id, tenant_id)
    await queryRunner.query(`
      ALTER TABLE "user_roles"
      DROP CONSTRAINT IF EXISTS "PK_1b8d5bcdafc0a5a35d4dc86d8e6"
    `);

    // 2. Tạo PK mới (user_id, role_id)
    await queryRunner.query(`
      ALTER TABLE "user_roles"
      ADD CONSTRAINT "PK_user_roles_user_role"
      PRIMARY KEY ("user_id", "role_id")
    `);

    // 3. Cho phép tenant_id = NULL
    await queryRunner.query(`
      ALTER TABLE "user_roles"
      ALTER COLUMN "tenant_id" DROP NOT NULL
    `);

    // 4. Unique index tránh trùng (user, role, tenant)
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "uq_user_role_tenant"
      ON "user_roles" ("user_id", "role_id", "tenant_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "uq_user_role_tenant"`);

    await queryRunner.query(`
      ALTER TABLE "user_roles"
      DROP CONSTRAINT "PK_user_roles_user_role"
    `);

    await queryRunner.query(`
      ALTER TABLE "user_roles"
      ADD CONSTRAINT "PK_1b8d5bcdafc0a5a35d4dc86d8e6"
      PRIMARY KEY ("user_id", "role_id", "tenant_id")
    `);

    await queryRunner.query(`
      ALTER TABLE "user_roles"
      ALTER COLUMN "tenant_id" SET NOT NULL
    `);
  }
}
