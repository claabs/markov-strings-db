import {MigrationInterface, QueryRunner} from "typeorm";

export class InputDataIndices1640929645188 implements MigrationInterface {
    name = 'InputDataIndices1640929645188'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "temporary_markov_input_data" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "string" varchar NOT NULL, "custom" text, "fragmentId" integer, "tags" text, CONSTRAINT "FK_3a7c2afb8b47b7d8e3da8e39d95" FOREIGN KEY ("fragmentId") REFERENCES "markov_fragment" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "temporary_markov_input_data"("id", "string", "custom", "fragmentId") SELECT "id", "string", "custom", "fragmentId" FROM "markov_input_data"`);
        await queryRunner.query(`DROP TABLE "markov_input_data"`);
        await queryRunner.query(`ALTER TABLE "temporary_markov_input_data" RENAME TO "markov_input_data"`);
        await queryRunner.query(`CREATE INDEX "IDX_e195c7452af674347760316d7c" ON "markov_input_data" ("string") `);
        await queryRunner.query(`CREATE INDEX "IDX_3e74ed7045eb827c346350a1b4" ON "markov_input_data" ("tags") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "IDX_3e74ed7045eb827c346350a1b4"`);
        await queryRunner.query(`DROP INDEX "IDX_e195c7452af674347760316d7c"`);
        await queryRunner.query(`ALTER TABLE "markov_input_data" RENAME TO "temporary_markov_input_data"`);
        await queryRunner.query(`CREATE TABLE "markov_input_data" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "string" varchar NOT NULL, "custom" text, "fragmentId" integer, CONSTRAINT "FK_3a7c2afb8b47b7d8e3da8e39d95" FOREIGN KEY ("fragmentId") REFERENCES "markov_fragment" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "markov_input_data"("id", "string", "custom", "fragmentId") SELECT "id", "string", "custom", "fragmentId" FROM "temporary_markov_input_data"`);
        await queryRunner.query(`DROP TABLE "temporary_markov_input_data"`);
    }

}
