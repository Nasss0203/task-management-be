import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateRefreshToken1767197562922 implements MigrationInterface {
    name = 'CreateRefreshToken1767197562922'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "refresh_tokens" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "token" character varying(512) NOT NULL, "user_agent" character varying(255), "ip_address" inet, "expires_at" TIMESTAMP NOT NULL, "revoked_at" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_7d8bee0204106019488c4c50ffa" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "idx_refresh_token_user" ON "refresh_tokens" ("user_id") `);
        await queryRunner.query(`CREATE INDEX "idx_refresh_token_token" ON "refresh_tokens" ("token") `);
        await queryRunner.query(`ALTER TABLE "refresh_tokens" ADD CONSTRAINT "FK_3ddc983c5f7bcf132fd8732c3f4" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "refresh_tokens" DROP CONSTRAINT "FK_3ddc983c5f7bcf132fd8732c3f4"`);
        await queryRunner.query(`DROP INDEX "public"."idx_refresh_token_token"`);
        await queryRunner.query(`DROP INDEX "public"."idx_refresh_token_user"`);
        await queryRunner.query(`DROP TABLE "refresh_tokens"`);
    }

}
