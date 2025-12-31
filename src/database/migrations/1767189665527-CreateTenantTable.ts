import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateTenantTable1767189665527 implements MigrationInterface {
    name = 'CreateTenantTable1767189665527'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "user_profiles" ("user_id" uuid NOT NULL, "full_name" character varying(255), "avatar_url" character varying(500), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_6ca9503d77ae39b4b5a6cc3ba88" PRIMARY KEY ("user_id"))`);
        await queryRunner.query(`CREATE TABLE "tenant" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(255) NOT NULL, "slug" character varying(255) NOT NULL, "plan_type" character varying(255) NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, CONSTRAINT "PK_da8c6efd67bb301e810e56ac139" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "user_profiles" ADD CONSTRAINT "FK_6ca9503d77ae39b4b5a6cc3ba88" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_profiles" DROP CONSTRAINT "FK_6ca9503d77ae39b4b5a6cc3ba88"`);
        await queryRunner.query(`DROP TABLE "tenant"`);
        await queryRunner.query(`DROP TABLE "user_profiles"`);
    }

}
