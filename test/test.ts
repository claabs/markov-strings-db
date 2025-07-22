import path from 'path';
import { readFileSync } from 'fs';
import { DataSource, DataSourceOptions } from 'typeorm';
import Markov, { AddDataProps, MarkovResult } from '../src/index';
import { MarkovCorpusEntry } from '../src/entity/MarkovCorpusEntry';
import { MarkovFragment } from '../src/entity/MarkovFragment';
import { MarkovInputData } from '../src/entity/MarkovInputData';
import { MarkovOptions } from '../src/entity/MarkovOptions';
import { MarkovRoot } from '../src/entity/MarkovRoot';
import { ormconfig } from './ormconfig';

const data = [
  'Lorem ipsum dolor sit amet',
  'Lorem ipsum duplicate start words',
  'Consectetur adipiscing elit',
  'Quisque tempor, erat vel lacinia imperdiet',
  'Justo nisi fringilla dui',
  'Egestas bibendum eros nisi ut lacus',
  "fringilla dui avait annoncé une rupture avec le erat vel: il n'en est rien…",
  'Fusce tincidunt tempor, erat vel lacinia vel ex pharetra pretium lacinia imperdiet',
];

jest.setTimeout(1000000);
describe('Markov class', () => {
  const dataSource = new DataSource(ormconfig);

  describe('Constructor', () => {
    it('should extend a data source', () => {
      let customConnection: DataSourceOptions = {
        entities: ['CustomEntity'],
        type: 'better-sqlite3',
        database: 'config/db/db.sqlite3',
      };
      customConnection = Markov.extendDataSourceOptions(customConnection);
      expect(customConnection.entities?.length).toBeGreaterThan(1);
    });

    it('should have a default stateSize', () => {
      const markov = new Markov();
      expect(markov.options.stateSize).toBe(2);
    });

    it('should save a different stateSize', () => {
      const markov = new Markov({ options: { stateSize: 3 } });
      expect(markov.options.stateSize).toBe(3);
    });

    it('should persist options in the database', async () => {
      await dataSource.initialize();
      const markov = new Markov({ options: { stateSize: 3 } });
      await markov.setup();
      const markov2 = new Markov();
      await markov2.setup();
      expect(markov2.options.stateSize).toBe(3);
      await dataSource.dropDatabase();
      await dataSource.destroy();
    });
  });

  describe('Adding data', () => {
    let markov: Markov;
    beforeEach(async () => {
      markov = new Markov();
      await dataSource.initialize();
    });

    afterEach(async () => {
      await dataSource.dropDatabase();
      await dataSource.destroy();
    });

    it('should build corpus', async () => {
      let count = await MarkovCorpusEntry.countBy({
        markov: { id: markov.db?.id },
      });
      expect(count).toEqual(0);
      await markov.addData(data);
      count = await MarkovCorpusEntry.countBy({
        markov: { id: markov.db.id },
      });
      expect(count).toBeGreaterThan(0);
    });
    it('should throw an error if the data structure is invalid', async () => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      await expect(markov.addData([{}])).rejects.toThrowError();
    });
    it('should accept objects', async () => {
      await markov.addData(data.map((o) => ({ string: o })));
      const count = await MarkovCorpusEntry.countBy({
        markov: { id: markov.db.id },
      });
      expect(count).toBeGreaterThan(0);
    });
  });

  describe('After adding data', () => {
    let markov: Markov;
    beforeEach(async () => {
      markov = new Markov();
      await dataSource.initialize();
      await markov.addData(data);
    });

    afterEach(async () => {
      await dataSource.dropDatabase();
      await dataSource.destroy();
    });

    describe('The startWords array', () => {
      it('should contain the right values', async () => {
        const testSet = [
          'Lorem ipsum',
          'Consectetur adipiscing',
          'Quisque tempor,',
          'Justo nisi',
          'Egestas bibendum',
          'fringilla dui',
          'Fusce tincidunt',
        ];
        const promises = testSet.map(async (startWord) => {
          const fragment = await MarkovFragment.findOneBy({
            startWordMarkov: { id: markov.db.id },
            words: startWord,
          });
          expect(fragment).toBeDefined();
        });
        await Promise.all(promises);
      });

      it('should have the right length', async () => {
        const count = await MarkovFragment.countBy({
          startWordMarkov: { id: markov.db.id },
        });
        expect(count).toEqual(8); // This is a change from v3's 7 as this version keeps duplicates
      });
    });

    describe('The endWords array', () => {
      it('should have the right length', async () => {
        const count = await MarkovFragment.countBy({
          endWordMarkov: { id: markov.db.id },
        });
        expect(count).toEqual(8); // This is a change from v3's 7 as this version keeps duplicates
      });

      it('should contain the right values', async () => {
        const testSet = [
          'sit amet',
          'start words',
          'adipiscing elit',
          'fringilla dui',
          'ut lacus',
          'est rien…',
        ];
        const promises = testSet.map(async (endWord) => {
          const fragment = await MarkovFragment.findOneBy({
            endWordMarkov: { id: markov.db.id },
            words: endWord,
          });
          expect(fragment).toBeDefined();
        });
        await Promise.all(promises);
      });
    });

    describe('The corpus itself', () => {
      it('should have the right values for the right keys', async () => {
        const testSet = [
          ['Lorem ipsum', 'dolor sit'],
          ['Lorem ipsum', 'duplicate start'],
          ['tempor, erat', 'vel lacinia'],
        ];
        const promises = testSet.map(async ([block, words]) => {
          const entry = await MarkovCorpusEntry.findOneBy({
            markov: { id: markov.db.id },
            block,
          });
          expect(entry).toBeDefined();
          const fragment = await MarkovFragment.findOneBy({
            corpusEntry: { id: entry?.id },
            words,
          });
          expect(fragment).toBeDefined();
        });
        await Promise.all(promises);
      });
    });
  });

  describe('Import/Export', () => {
    let markov: Markov;
    afterEach(async () => {
      await dataSource.dropDatabase();
      await dataSource.destroy();
    });

    it('should export the original database values', async () => {
      markov = new Markov({ id: '1', options: { id: '1' } });
      await dataSource.initialize();
      await markov.addData(data);

      const exported = await markov.export();

      const v4Import = JSON.parse(readFileSync(path.join(__dirname, 'v4-export.json'), 'utf8'));

      expect(exported).toMatchObject(v4Import);
    });

    describe('Import v3 data', () => {
      it('onto fresh DB', async () => {
        markov = new Markov();
        await dataSource.initialize();
        let count = await MarkovCorpusEntry.countBy({
          markov: { id: markov.db?.id },
        });
        expect(count).toEqual(0);

        const v3Import = JSON.parse(readFileSync(path.join(__dirname, 'v3-export.json'), 'utf8'));
        await markov.import(v3Import);

        count = await MarkovCorpusEntry.countBy({
          markov: { id: markov.db.id },
        });
        expect(count).toEqual(28);

        // Should still generate a sentence
        const sentence = await markov.generate({ maxTries: 20 });
        expect(sentence.tries).toBeLessThanOrEqual(20);
      });

      it('should overwrite original values', async () => {
        markov = new Markov();
        await dataSource.initialize();
        await markov.addData(data);

        const v3Import = JSON.parse(readFileSync(path.join(__dirname, 'v3-export.json'), 'utf8'));
        await markov.import(v3Import);

        const count = await MarkovCorpusEntry.countBy({
          markov: { id: markov.db.id },
        });
        expect(count).toEqual(28);
      });
    });

    describe('Import v4 data', () => {
      it('onto fresh DB', async () => {
        markov = new Markov();
        await dataSource.initialize();
        let count = await MarkovCorpusEntry.countBy({
          markov: { id: markov.db?.id },
        });
        expect(count).toEqual(0);

        const v4Import = JSON.parse(readFileSync(path.join(__dirname, 'v4-export.json'), 'utf8'));
        await markov.import(v4Import);

        count = await MarkovCorpusEntry.countBy({
          markov: { id: markov.db.id },
        });
        expect(count).toEqual(28);

        // Should still generate a sentence
        const sentence = await markov.generate({ maxTries: 20 });
        expect(sentence.tries).toBeLessThanOrEqual(20);
      });

      it('should overwrite original values', async () => {
        markov = new Markov();
        await dataSource.initialize();
        await markov.addData(data);

        const v4Import = JSON.parse(readFileSync(path.join(__dirname, 'v4-export.json'), 'utf8'));
        await markov.import(v4Import);

        const count = await MarkovCorpusEntry.countBy({
          markov: { id: markov.db.id },
        });
        expect(count).toEqual(28);
      });
    });
  });

  describe('The sentence generator', () => {
    let markov: Markov;
    describe('With no data', () => {
      beforeEach(async () => {
        markov = new Markov();
        await dataSource.initialize();
      });

      afterEach(async () => {
        await dataSource.dropDatabase();
        await dataSource.destroy();
      });

      it('should throw an error if the corpus is not built', async () => {
        await expect(markov.generate()).rejects.toThrow(
          'Corpus is empty. There is either no data, or the data is not sufficient to create markov chains.'
        );
      });

      it('should return a result with custom data', async () => {
        interface CustomData {
          index: number;
          otherString: string;
        }
        const customData: AddDataProps[] = data.map((datum, idx) => ({
          string: datum,
          custom: {
            index: idx,
            otherString: idx.toString(),
          },
        }));
        await markov.addData(customData);

        const promises = [...Array(10)].map(async () => {
          const sentence = await markov.generate<CustomData>({ maxTries: 20 });
          expect(sentence.tries).toBeLessThanOrEqual(20);
          sentence.refs.forEach((ref) => {
            expect(ref.custom?.index).toBeGreaterThanOrEqual(0);
            expect(ref.custom?.otherString).toMatch(/\d+/);
          });
        });
        await Promise.all(promises);
      });
    });

    describe('With data', () => {
      beforeEach(async () => {
        markov = new Markov();
        await dataSource.initialize();
        await markov.addData(data);
      });

      afterEach(async () => {
        await dataSource.dropDatabase();
        await dataSource.destroy();
      });

      it('should return a result if under the tries limit', async () => {
        expect.assertions(10);

        const promises = [...Array(10)].map(async () => {
          const sentence = await markov.generate({ maxTries: 20 });
          expect(sentence.tries).toBeLessThanOrEqual(20);
        });
        await Promise.all(promises);
      });

      it('should call the `filter` callback', async () => {
        const filter = jest.fn(() => true);
        await markov.generate({ filter });
        expect(filter).toHaveBeenCalled();
      });

      it('should throw an error after 10 tries, by default', async () => {
        await expect(
          markov.generate({
            filter: () => {
              return false;
            },
          })
        ).rejects.toThrow('10');
      });

      it('should end with a value from endWords', async () => {
        expect.assertions(10);

        const promises = [...Array(10)].map(async () => {
          const result = await markov.generate();
          const arr = result.string.split(' ');
          const end = arr.slice(arr.length - 2, arr.length);
          const endWords = await MarkovFragment.findOneBy({
            endWordMarkov: { id: markov.db.id },
            words: end.join(' '),
          });
          expect(endWords).toBeDefined();
        });
        await Promise.all(promises);
      });

      it(`should pass the result object to 'filter(result)'`, async () => {
        expect.assertions(6);

        const options = {
          minWords: 5,
          maxTries: 10,
          filter: (result: MarkovResult): boolean => {
            expect(Object.keys(result)).toHaveLength(4);
            expect(result).toHaveProperty('string');
            expect(result).toHaveProperty('score');
            expect(result).toHaveProperty('refs');
            expect(Array.isArray(result.refs)).toBeTruthy();
            expect(result).toHaveProperty('tries');
            return true;
          },
        };
        await markov.generate(options);
      });

      it('should generate a phrase with a startSeed', async () => {
        const options = {
          startSeed: 'Egestas bibendum',
        };
        const result = await markov.generate(options);
        expect(result.string.startsWith('Egestas bibendum')).toBeTruthy();
      });

      it('should trim a startSeed', async () => {
        const options = {
          startSeed: 'Egestas bibendum extra words',
        };
        const result = await markov.generate(options);
        expect(result.string.startsWith('Egestas bibendum')).toBeTruthy();
      });

      it('should continue with a short startSeed', async () => {
        const options = {
          startSeed: 'whoops',
        };
        const result = await markov.generate(options);
        expect(result.string).toBeDefined();
      });

      it('should continue with a bad startSeed', async () => {
        const options = {
          startSeed: 'whoops word',
        };
        const result = await markov.generate(options);
        expect(result.string).toBeDefined();
      });

      it('should retry without startSeed if it cannot generate', async () => {
        const obscureStartSeed = 'obscure words';
        markov.addData([obscureStartSeed]);
        const options = {
          startSeed: obscureStartSeed,
        };
        const result = await markov.generate(options);
        expect(result.string).toBeDefined();
        expect(result.string.startsWith(obscureStartSeed)).toBeFalsy();
      });

      it(`should delete the entire database`, async () => {
        await markov.delete();

        const afterInputDataCount = await MarkovInputData.count();
        const afterFragmentCount = await MarkovFragment.count();
        const afterCorpusEntryCount = await MarkovCorpusEntry.count();
        const afterOptionsCount = await MarkovOptions.count();
        const afterRootCount = await MarkovRoot.count();

        expect(afterInputDataCount).toEqual(0);
        expect(afterFragmentCount).toEqual(0);
        expect(afterCorpusEntryCount).toEqual(0);
        expect(afterOptionsCount).toEqual(0);
        expect(afterRootCount).toEqual(0);
      });

      it(`should still work after being deleted`, async () => {
        await markov.delete();

        await markov.addData(data);

        const count = await MarkovFragment.countBy({
          startWordMarkov: { id: markov.db.id },
        });
        expect(count).toEqual(8); // This is a change from v3's 7 as this version keeps duplicates
      });

      it(`should erase a phrase from the database`, async () => {
        const deletePhrase = data[3];

        const beforeInputDataCount = await MarkovInputData.count();
        const beforeFragmentCount = await MarkovFragment.count();
        const beforeCorpusEntryCount = await MarkovCorpusEntry.count();

        await markov.removeStrings([deletePhrase]);

        const afterInputDataCount = await MarkovInputData.count();
        const afterFragmentCount = await MarkovFragment.count();
        const afterCorpusEntryCount = await MarkovCorpusEntry.count();

        expect(afterInputDataCount).toEqual(beforeInputDataCount - 1);
        expect(afterFragmentCount).toEqual(beforeFragmentCount - 5);
        expect(afterCorpusEntryCount).toEqual(beforeCorpusEntryCount - 1);
      });
    });

    describe('With tagged data', () => {
      beforeEach(async () => {
        markov = new Markov();
        await dataSource.initialize();

        const customData: AddDataProps[] = data.map((datum, idx) => ({
          string: datum,
          tags: [`message-${idx}`, 'other-tag'],
        }));
        await markov.addData(customData);
      });

      afterEach(async () => {
        await dataSource.dropDatabase();
        await dataSource.destroy();
      });

      it(`should erase using the tags`, async () => {
        const beforeInputDataCount = await MarkovInputData.count();
        const beforeFragmentCount = await MarkovFragment.count();
        const beforeCorpusEntryCount = await MarkovCorpusEntry.count();

        await markov.removeTags(['message-3']);

        const afterInputDataCount = await MarkovInputData.count();
        const afterFragmentCount = await MarkovFragment.count();
        const afterCorpusEntryCount = await MarkovCorpusEntry.count();

        expect(afterInputDataCount).toEqual(beforeInputDataCount - 1);
        expect(afterFragmentCount).toEqual(beforeFragmentCount - 5);
        expect(afterCorpusEntryCount).toEqual(beforeCorpusEntryCount - 1);
      });
    });
  });
});
