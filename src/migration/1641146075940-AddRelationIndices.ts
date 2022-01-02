import {MigrationInterface, QueryRunner} from "typeorm";

export class AddRelationIndices1641146075940 implements MigrationInterface {
    name = 'AddRelationIndices1641146075940'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE INDEX "IDX_04d2e6b22ee071a03100ca342d" ON "markov_input_data" ("markovId") `);
        await queryRunner.query(`CREATE INDEX "IDX_5cdce6bfbe0cbd5dc2af7f56ed" ON "markov_fragment" ("startWordMarkovId") `);
        await queryRunner.query(`CREATE INDEX "IDX_a5570e8c77d287dae063e4b806" ON "markov_fragment" ("endWordMarkovId") `);
        await queryRunner.query(`CREATE INDEX "IDX_39d78f192de3530bf9cef4ec47" ON "markov_fragment" ("corpusEntryId") `);
        await queryRunner.query(`CREATE INDEX "IDX_59495cdd803f7e0c8f3576fc26" ON "markov_corpus_entry" ("markovId") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "IDX_59495cdd803f7e0c8f3576fc26"`);
        await queryRunner.query(`DROP INDEX "IDX_39d78f192de3530bf9cef4ec47"`);
        await queryRunner.query(`DROP INDEX "IDX_a5570e8c77d287dae063e4b806"`);
        await queryRunner.query(`DROP INDEX "IDX_5cdce6bfbe0cbd5dc2af7f56ed"`);
        await queryRunner.query(`DROP INDEX "IDX_04d2e6b22ee071a03100ca342d"`);
    }

}
