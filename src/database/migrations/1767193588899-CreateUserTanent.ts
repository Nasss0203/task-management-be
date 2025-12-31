import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateUserTanent1767193588899 implements MigrationInterface {
    name = 'CreateUserTanent1767193588899'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."user_tenants_role_enum" AS ENUM('owner', 'admin', 'member')`);
        await queryRunner.query(`CREATE TABLE "user_tenants" ("user_id" uuid NOT NULL, "tenant_id" uuid NOT NULL, "role" "public"."user_tenants_role_enum" NOT NULL DEFAULT 'member', "joined_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_01847c3ffef489ea549f205d1ed" PRIMARY KEY ("user_id", "tenant_id"))`);
        await queryRunner.query(`ALTER TABLE "user_tenants" ADD CONSTRAINT "FK_63a8ef4ed4fad61231cdfc3dc63" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_tenants" ADD CONSTRAINT "FK_a1feca39273dfd9a32c7cc4153c" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_tenants" DROP CONSTRAINT "FK_a1feca39273dfd9a32c7cc4153c"`);
        await queryRunner.query(`ALTER TABLE "user_tenants" DROP CONSTRAINT "FK_63a8ef4ed4fad61231cdfc3dc63"`);
        await queryRunner.query(`DROP TABLE "user_tenants"`);
        await queryRunner.query(`DROP TYPE "public"."user_tenants_role_enum"`);
    }

}
