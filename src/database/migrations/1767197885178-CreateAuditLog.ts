import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateAuditLog1767197885178 implements MigrationInterface {
    name = 'CreateAuditLog1767197885178'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "audit_logs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenant_id" uuid NOT NULL, "user_id" uuid NOT NULL, "action" character varying(50) NOT NULL, "resource" character varying(100) NOT NULL, "ip_address" character varying(45), "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_1bb179d048bbc581caa3b013439" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "idx_audit_logs_action" ON "audit_logs" ("action") `);
        await queryRunner.query(`CREATE INDEX "idx_audit_logs_user" ON "audit_logs" ("user_id") `);
        await queryRunner.query(`CREATE INDEX "idx_audit_logs_tenant" ON "audit_logs" ("tenant_id") `);
        await queryRunner.query(`ALTER TABLE "audit_logs" ADD CONSTRAINT "FK_6f18d459490bb48923b1f40bdb7" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "audit_logs" ADD CONSTRAINT "FK_bd2726fd31b35443f2245b93ba0" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "audit_logs" DROP CONSTRAINT "FK_bd2726fd31b35443f2245b93ba0"`);
        await queryRunner.query(`ALTER TABLE "audit_logs" DROP CONSTRAINT "FK_6f18d459490bb48923b1f40bdb7"`);
        await queryRunner.query(`DROP INDEX "public"."idx_audit_logs_tenant"`);
        await queryRunner.query(`DROP INDEX "public"."idx_audit_logs_user"`);
        await queryRunner.query(`DROP INDEX "public"."idx_audit_logs_action"`);
        await queryRunner.query(`DROP TABLE "audit_logs"`);
    }

}
