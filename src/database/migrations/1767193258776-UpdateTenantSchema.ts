import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateTenantSchema1767193258776 implements MigrationInterface {
    name = 'UpdateTenantSchema1767193258776'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."tenant_plan_type_enum" AS ENUM('free', 'pro')`);
        await queryRunner.query(`CREATE TABLE "tenant" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(255) NOT NULL, "slug" character varying(255) NOT NULL, "plan_type" "public"."tenant_plan_type_enum" NOT NULL DEFAULT 'free', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, CONSTRAINT "PK_da8c6efd67bb301e810e56ac139" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "tenant"`);
        await queryRunner.query(`DROP TYPE "public"."tenant_plan_type_enum"`);
    }

}
