import {MigrationInterface, QueryRunner} from "typeorm";

export class CreateTables1640838335688 implements MigrationInterface {
    name = 'CreateTables1640838335688'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "markov_input_data" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "string" varchar NOT NULL, "custom" text, "fragmentId" integer)`);
        await queryRunner.query(`CREATE TABLE "markov_options" ("id" varchar PRIMARY KEY NOT NULL, "stateSize" integer NOT NULL)`);
        await queryRunner.query(`CREATE TABLE "markov_root" ("id" varchar PRIMARY KEY NOT NULL, "optionsId" text, CONSTRAINT "REL_ba801690a217e54714a023869c" UNIQUE ("optionsId"))`);
        await queryRunner.query(`CREATE TABLE "markov_fragment" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "words" varchar NOT NULL, "startWordMarkovId" text, "endWordMarkovId" text, "corpusEntryId" integer)`);
        await queryRunner.query(`CREATE INDEX "IDX_ac1f55264f77111bf80e4e52d6" ON "markov_fragment" ("words") `);
        await queryRunner.query(`CREATE TABLE "markov_corpus_entry" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "block" varchar NOT NULL, "markovId" text)`);
        await queryRunner.query(`CREATE INDEX "IDX_cb1fdbcebb2cf9a28098e0c8e2" ON "markov_corpus_entry" ("block") `);
        await queryRunner.query(`CREATE TABLE "temporary_markov_input_data" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "string" varchar NOT NULL, "custom" text, "fragmentId" integer, CONSTRAINT "FK_3a7c2afb8b47b7d8e3da8e39d95" FOREIGN KEY ("fragmentId") REFERENCES "markov_fragment" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "temporary_markov_input_data"("id", "string", "custom", "fragmentId") SELECT "id", "string", "custom", "fragmentId" FROM "markov_input_data"`);
        await queryRunner.query(`DROP TABLE "markov_input_data"`);
        await queryRunner.query(`ALTER TABLE "temporary_markov_input_data" RENAME TO "markov_input_data"`);
        await queryRunner.query(`CREATE TABLE "temporary_markov_root" ("id" varchar PRIMARY KEY NOT NULL, "optionsId" text, CONSTRAINT "REL_ba801690a217e54714a023869c" UNIQUE ("optionsId"), CONSTRAINT "FK_ba801690a217e54714a023869cd" FOREIGN KEY ("optionsId") REFERENCES "markov_options" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "temporary_markov_root"("id", "optionsId") SELECT "id", "optionsId" FROM "markov_root"`);
        await queryRunner.query(`DROP TABLE "markov_root"`);
        await queryRunner.query(`ALTER TABLE "temporary_markov_root" RENAME TO "markov_root"`);
        await queryRunner.query(`DROP INDEX "IDX_ac1f55264f77111bf80e4e52d6"`);
        await queryRunner.query(`CREATE TABLE "temporary_markov_fragment" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "words" varchar NOT NULL, "startWordMarkovId" text, "endWordMarkovId" text, "corpusEntryId" integer, CONSTRAINT "FK_5cdce6bfbe0cbd5dc2af7f56edb" FOREIGN KEY ("startWordMarkovId") REFERENCES "markov_root" ("id") ON DELETE CASCADE ON UPDATE NO ACTION, CONSTRAINT "FK_a5570e8c77d287dae063e4b8067" FOREIGN KEY ("endWordMarkovId") REFERENCES "markov_root" ("id") ON DELETE CASCADE ON UPDATE NO ACTION, CONSTRAINT "FK_39d78f192de3530bf9cef4ec479" FOREIGN KEY ("corpusEntryId") REFERENCES "markov_corpus_entry" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "temporary_markov_fragment"("id", "words", "startWordMarkovId", "endWordMarkovId", "corpusEntryId") SELECT "id", "words", "startWordMarkovId", "endWordMarkovId", "corpusEntryId" FROM "markov_fragment"`);
        await queryRunner.query(`DROP TABLE "markov_fragment"`);
        await queryRunner.query(`ALTER TABLE "temporary_markov_fragment" RENAME TO "markov_fragment"`);
        await queryRunner.query(`CREATE INDEX "IDX_ac1f55264f77111bf80e4e52d6" ON "markov_fragment" ("words") `);
        await queryRunner.query(`DROP INDEX "IDX_cb1fdbcebb2cf9a28098e0c8e2"`);
        await queryRunner.query(`CREATE TABLE "temporary_markov_corpus_entry" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "block" varchar NOT NULL, "markovId" text, CONSTRAINT "FK_59495cdd803f7e0c8f3576fc26d" FOREIGN KEY ("markovId") REFERENCES "markov_root" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "temporary_markov_corpus_entry"("id", "block", "markovId") SELECT "id", "block", "markovId" FROM "markov_corpus_entry"`);
        await queryRunner.query(`DROP TABLE "markov_corpus_entry"`);
        await queryRunner.query(`ALTER TABLE "temporary_markov_corpus_entry" RENAME TO "markov_corpus_entry"`);
        await queryRunner.query(`CREATE INDEX "IDX_cb1fdbcebb2cf9a28098e0c8e2" ON "markov_corpus_entry" ("block") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "IDX_cb1fdbcebb2cf9a28098e0c8e2"`);
        await queryRunner.query(`ALTER TABLE "markov_corpus_entry" RENAME TO "temporary_markov_corpus_entry"`);
        await queryRunner.query(`CREATE TABLE "markov_corpus_entry" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "block" varchar NOT NULL, "markovId" text)`);
        await queryRunner.query(`INSERT INTO "markov_corpus_entry"("id", "block", "markovId") SELECT "id", "block", "markovId" FROM "temporary_markov_corpus_entry"`);
        await queryRunner.query(`DROP TABLE "temporary_markov_corpus_entry"`);
        await queryRunner.query(`CREATE INDEX "IDX_cb1fdbcebb2cf9a28098e0c8e2" ON "markov_corpus_entry" ("block") `);
        await queryRunner.query(`DROP INDEX "IDX_ac1f55264f77111bf80e4e52d6"`);
        await queryRunner.query(`ALTER TABLE "markov_fragment" RENAME TO "temporary_markov_fragment"`);
        await queryRunner.query(`CREATE TABLE "markov_fragment" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "words" varchar NOT NULL, "startWordMarkovId" text, "endWordMarkovId" text, "corpusEntryId" integer)`);
        await queryRunner.query(`INSERT INTO "markov_fragment"("id", "words", "startWordMarkovId", "endWordMarkovId", "corpusEntryId") SELECT "id", "words", "startWordMarkovId", "endWordMarkovId", "corpusEntryId" FROM "temporary_markov_fragment"`);
        await queryRunner.query(`DROP TABLE "temporary_markov_fragment"`);
        await queryRunner.query(`CREATE INDEX "IDX_ac1f55264f77111bf80e4e52d6" ON "markov_fragment" ("words") `);
        await queryRunner.query(`ALTER TABLE "markov_root" RENAME TO "temporary_markov_root"`);
        await queryRunner.query(`CREATE TABLE "markov_root" ("id" varchar PRIMARY KEY NOT NULL, "optionsId" text, CONSTRAINT "REL_ba801690a217e54714a023869c" UNIQUE ("optionsId"))`);
        await queryRunner.query(`INSERT INTO "markov_root"("id", "optionsId") SELECT "id", "optionsId" FROM "temporary_markov_root"`);
        await queryRunner.query(`DROP TABLE "temporary_markov_root"`);
        await queryRunner.query(`ALTER TABLE "markov_input_data" RENAME TO "temporary_markov_input_data"`);
        await queryRunner.query(`CREATE TABLE "markov_input_data" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "string" varchar NOT NULL, "custom" text, "fragmentId" integer)`);
        await queryRunner.query(`INSERT INTO "markov_input_data"("id", "string", "custom", "fragmentId") SELECT "id", "string", "custom", "fragmentId" FROM "temporary_markov_input_data"`);
        await queryRunner.query(`DROP TABLE "temporary_markov_input_data"`);
        await queryRunner.query(`DROP INDEX "IDX_cb1fdbcebb2cf9a28098e0c8e2"`);
        await queryRunner.query(`DROP TABLE "markov_corpus_entry"`);
        await queryRunner.query(`DROP INDEX "IDX_ac1f55264f77111bf80e4e52d6"`);
        await queryRunner.query(`DROP TABLE "markov_fragment"`);
        await queryRunner.query(`DROP TABLE "markov_root"`);
        await queryRunner.query(`DROP TABLE "markov_options"`);
        await queryRunner.query(`DROP TABLE "markov_input_data"`);
    }

}
