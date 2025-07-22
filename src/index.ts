/* eslint-disable no-await-in-loop */
import { DataSource, DataSourceOptions, EntitySchema, Like, MixedList } from 'typeorm';
import { ObjectUtils } from 'typeorm/util/ObjectUtils';
import { MarkovCorpusEntry } from './entity/MarkovCorpusEntry';
import { MarkovFragment } from './entity/MarkovFragment';
import { MarkovInputData } from './entity/MarkovInputData';
import { MarkovOptions } from './entity/MarkovOptions';
import { MarkovRoot } from './entity/MarkovRoot';
import { CreateTables1641083518573 } from './migration/1641083518573-CreateTables';
import { AddRelationIndices1641146075940 } from './migration/1641146075940-AddRelationIndices';
import { getV3ImportInputData } from './importer';
import { MarkovImportExport as MarkovV3ImportExport } from './v3-types';

export const ALL_ENTITIES = [
  MarkovCorpusEntry,
  MarkovRoot,
  MarkovOptions,
  MarkovInputData,
  MarkovFragment,
];
export const ALL_MIGRATIONS = [CreateTables1641083518573, AddRelationIndices1641146075940];

/**
 * Data to build the Markov instance
 */
export type MarkovConstructorOptions = {
  /**
   * Used to set the options database ID manually
   */
  id?: string;

  /**
   * The stateSize is the number of words for each "link" of the generated sentence.
   * 1 will output gibberish sentences without much sense.
   * 2 is a sensible default for most cases.
   * 3 and more can create good sentences if you have a corpus that allows it.
   */
  stateSize?: number;
};

export type MarkovConstructorProps = {
  /**
   * Used to set a root database ID manually
   */
  id?: string;

  /**
   * Global Markov corpus generation options
   */
  options?: MarkovConstructorOptions;
};

/**
 * While `stateSize` is optional as a constructor parameter,
 * it must exist as a member
 */
export interface MarkovDataMembers {
  stateSize: number;
}

export interface AddDataProps {
  /**
   * A string that the corpus is built from
   */
  string: string;

  /**
   * A JSON-like object that will be returned alongside the refs in the result
   */
  custom?: any; // eslint-disable-line @typescript-eslint/no-explicit-any

  /**
   * A list of strings that will be stored alongside the string to be used for later retreival/deletion.
   * Note you MUST NOT have any comma in values of a tag.
   */
  tags?: string[];
}

export interface MarkovResult<CustomData = never> {
  /**
   * The resulting sentence
   */
  string: string;

  /**
   * A relative "score" based on the number of possible permutations.
   * Higher is "better", but the actual value depends on your corpus.
   */
  score: number;

  /**
   * The array of references used to build the sentence.
   */
  refs: MarkovInputData<CustomData>[];

  /**
   * The number of tries it took to output this result
   */
  tries: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type MarkovGenerateOptions<CustomData = any> = {
  /**
   * The max number of tentatives before giving up (default is 10)
   */
  maxTries?: number;

  /**
   * A callback to filter results (see example in the Readme)
   */
  filter?: (result: MarkovResult<CustomData>) => boolean;

  /**
   * Attempt to generate a message with this as the start.
   * It should be a sentence fragment with the number of words equal to the stateSize.
   * Any extra words over the stateSize will be trimmed away.
   */
  startSeed?: string;
};

export type Corpus = Record<string, MarkovFragment[]>;

export default class Markov {
  public db: MarkovRoot;

  public options: MarkovConstructorProps & MarkovDataMembers;

  public id: string;

  private defaultOptions: MarkovDataMembers = {
    stateSize: 2,
  };

  private constructorProps?: MarkovConstructorProps;

  /**
   * If you're connecting the Markov DB with your parent project's DB, you'll need to extend it to add the Markov entities to the data source.
   * @param dataSourceOptions Your TypeORM data source options.
   * @returns DataSourceOptions that should be passed into a new DataSource(...) call.
   */
  public static extendDataSourceOptions(dataSourceOptions: DataSourceOptions): DataSourceOptions {
    // eslint-disable-next-line @typescript-eslint/ban-types, @typescript-eslint/no-explicit-any
    const appendedEntities: MixedList<string | Function | EntitySchema<any>> = ALL_ENTITIES;
    if (dataSourceOptions.entities)
      appendedEntities.push(...ObjectUtils.mixedListToArray(dataSourceOptions.entities));

    // eslint-disable-next-line @typescript-eslint/ban-types
    const appendedMigrations: (Function | string)[] = ALL_MIGRATIONS;
    if (dataSourceOptions.migrations)
      appendedMigrations.push(...ObjectUtils.mixedListToArray(dataSourceOptions.migrations));

    return {
      ...dataSourceOptions,
      entities: appendedEntities,
      migrations: appendedMigrations,
    };
  }

  /**
   * Creates an instance of Markov generator.
   */
  constructor(props?: MarkovConstructorProps) {
    this.constructorProps = props;
    this.construct();
  }

  private construct() {
    this.id = this.constructorProps?.id || '1';

    // Save options
    this.options = Object.assign(this.defaultOptions, this.constructorProps?.options);
  }

  /**
   * If you have a non-default data source (you probably don't), pass it in here.
   * Otherwise, setup() is called implicitly on any async function.
   * @param dataSource A non-default data source to be used by Markov's entities
   */
  public async setup(dataSource?: DataSource): Promise<void> {
    if (dataSource) ALL_ENTITIES.forEach((e) => e.useDataSource(dataSource));

    let db = await MarkovRoot.findOneBy({
      id: this.id,
    });
    let options: MarkovOptions;
    if (!db) {
      options = MarkovOptions.create(this.options);
      await MarkovOptions.save(options);
      this.options = options;
      db = new MarkovRoot();
      db.id = this.id;
      db.options = options;
      await MarkovRoot.save(db);
    } else {
      options = await MarkovOptions.findOneByOrFail({ id: db.options?.id });
    }
    this.db = db;
    this.id = this.db.id;
    this.options = options;
  }

  private async ensureSetup(): Promise<void> {
    if (!this.db?.id) await this.setup();
  }

  /**
   * Gets a random fragment for a startWord or corpusEntry from the database.
   */
  private async sampleFragment(condition?: MarkovCorpusEntry): Promise<MarkovFragment | null>;

  private async sampleFragment(startSeed?: string): Promise<MarkovFragment | null>;

  private async sampleFragment(
    startSeedOrCondition?: string | MarkovCorpusEntry
  ): Promise<MarkovFragment | null> {
    let queryCondition;
    if (typeof startSeedOrCondition === 'string') {
      queryCondition = { startWordMarkov: this.db, words: startSeedOrCondition };
    } else if (startSeedOrCondition) {
      queryCondition = { corpusEntry: startSeedOrCondition };
    } else {
      queryCondition = { startWordMarkov: this.db };
    }
    const fragment = await MarkovFragment.createQueryBuilder('fragment')
      .leftJoinAndSelect('fragment.ref', 'ref')
      .where(queryCondition)
      .orderBy('RANDOM()')
      .limit(1)
      .getOne();
    return fragment;
  }

  /**
   * Imports a corpus. This overwrites existing data.
   * Supports imports from markov-strings v3, as well as exports from this version.
   */
  public async import(data: MarkovRoot | MarkovV3ImportExport): Promise<void> {
    await this.ensureSetup();
    if ('id' in data) {
      this.db = new MarkovRoot();
      this.db.id = this.id;
      const options = MarkovOptions.create(data.options);
      this.db.options = options;
      await MarkovOptions.save(options);
      await MarkovRoot.save(this.db);

      // Populate the inputData first so the relations work
      await MarkovInputData.save(data.inputData);
      // Gather and save all the fragments and corpus entries (cascaded)
      const allFragments: MarkovFragment[] = [];
      // Would rather just use flatmap here, but it's not available in Node 10
      data.inputData.forEach((inputDatum) => allFragments.push(...inputDatum.fragments));
      await MarkovFragment.save(allFragments);

      this.db = await MarkovRoot.findOneByOrFail({ id: this.id }); // Repopulate the top level MarkovRoot fields
    } else {
      // Legacy import
      const options = MarkovOptions.create({ stateSize: data.options.stateSize });
      await MarkovOptions.save(options);
      this.db = new MarkovRoot();
      this.db.id = this.id;
      this.db.options = options;
      await MarkovRoot.save(this.db);

      const inputData = getV3ImportInputData(data);
      await this.buildCorpus(inputData);
    }
    this.id = this.db.id;
    this.options = this.db.options;
  }

  /**
   * Exports all the data in the database associated with this Markov instance as a JSON object.
   */
  public async export(): Promise<MarkovRoot> {
    await this.ensureSetup();
    const db = await MarkovRoot.findOneOrFail({
      where: { id: this.id },
      relations: [
        'inputData',
        'inputData.fragments',
        'inputData.fragments.ref',
        'inputData.fragments.startWordMarkov',
        'inputData.fragments.endWordMarkov',
        'inputData.fragments.corpusEntry',
        'inputData.fragments.corpusEntry.markov',
        'options',
      ],
      loadEagerRelations: true,
    });
    return db;
  }

  /**
   * To function correctly, the Markov generator needs its internal data to be correctly structured. This allows you add raw data, that is automatically formatted to fit the internal structure.
   * You can call this as often as you need, with new data each time. Multiple calls with the same data is not recommended, because it will skew the random generation of results.
   * It's possible to store custom JSON-like data of your choice next to the string by passing in objects of `{ string: 'foo', custom: 'attachment' }`. This data will be returned in the `refs` of the result.
   */
  public async addData(rawData: AddDataProps[] | string[]): Promise<void> {
    await this.ensureSetup();
    if (!rawData.length) return;
    // Format data if necessary
    let input: AddDataProps[] = [];
    if (typeof rawData[0] === 'string') {
      input = (rawData as string[]).map((s) => ({ string: s }));
    } else if (Object.hasOwnProperty.call(rawData[0], 'string')) {
      input = rawData as AddDataProps[];
    } else {
      throw new Error('Objects in your corpus must have a "string" property');
    }

    await this.buildCorpus(input);

    // this.data = this.data.concat(input)
  }

  /**
   * Builds the corpus. You must call this before generating sentences.
   */
  private async buildCorpus(data: AddDataProps[]): Promise<void> {
    await this.ensureSetup();
    const { options } = this;

    // Loop through all sentences
    // eslint-disable-next-line no-restricted-syntax
    for (const item of data) {
      // Arrays to store future DB writes so we can write them all in one transaction
      const fragmentsToSave: MarkovFragment[] = [];

      const line = item.string;
      const words = line.split(' ');
      const { stateSize } = options; // Default value of 2 is set in the constructor

      const inputData = await MarkovInputData.create({
        string: item.string,
        custom: item.custom,
        tags: item.tags,
        markov: this.db,
      }).save();

      // #region Start words
      // "Start words" is the list of words that can start a generated chain.
      const start = words.slice(0, stateSize).join(' ');
      // Add the startWords (and reference) to the list
      // Duplicate fragments with the same words are allowed
      fragmentsToSave.push(
        MarkovFragment.create({
          words: start,
          startWordMarkov: this.db,
          ref: inputData,
        })
      );
      // #endregion Start words

      // #region End words
      // "End words" is the list of words that can end a generated chain.
      const end = words.slice(words.length - stateSize, words.length).join(' ');
      // Duplicate fragments with the same words are allowed
      fragmentsToSave.push(
        MarkovFragment.create({
          words: end,
          endWordMarkov: this.db,
          ref: inputData,
        })
      );
      // #endregion End words

      // #region Corpus generation
      // We loop through all words in the sentence to build "blocks" of `stateSize`
      // e.g. for a stateSize of 2, "lorem ipsum dolor sit amet" will have the following blocks:
      //    "lorem ipsum", "ipsum dolor", "dolor sit", and "sit amet"
      for (let i = 0; i < words.length - 1; i += 1) {
        const curr = words.slice(i, i + stateSize).join(' ');
        const next = words.slice(i + stateSize, i + stateSize * 2).join(' ');
        if (!next || next.split(' ').length !== options.stateSize) {
          // eslint-disable-next-line no-continue
          continue;
        }

        // Check if the corpus already has a corresponding "curr" block
        let entry = await MarkovCorpusEntry.findOneBy({ markov: { id: this.db.id }, block: curr });
        if (!entry) {
          entry = MarkovCorpusEntry.create({
            block: curr,
            markov: this.db,
          });
        }
        fragmentsToSave.push(
          // Add the "curr" block and link it with the "next" one
          MarkovFragment.create({
            words: next,
            corpusEntry: entry,
            ref: inputData,
          })
        );
      }

      // Save the fragments as they will be needed in the DB for corpus generation
      // Corpus entries are inserted via cascade
      await MarkovFragment.save(fragmentsToSave);
    }
  }

  /**
   * Remove a string and all its references from the database.
   * @param rawData A list of full strings
   */
  public async removeStrings(rawData: string[]): Promise<void> {
    await this.ensureSetup();
    await MarkovInputData.createQueryBuilder()
      .delete()
      .from(MarkovInputData)
      .where({
        string: rawData,
        markov: this.db,
      })
      .execute();
    await Markov.pruneDanglingCorpusEntries();
  }

  /**
   * Remove all data with a specific tag associated with it references from the database.
   * @param tags A list of tags
   */
  public async removeTags(tags: string[]): Promise<void> {
    await this.ensureSetup();
    let query = MarkovInputData.createQueryBuilder().delete().from(MarkovInputData);
    tags.forEach((tag) => {
      query = query.orWhere({ tags: Like(tag) });
      query = query.orWhere({ tags: Like(`%,${tag},%`) });
      query = query.orWhere({ tags: Like(`${tag},%`) });
      query = query.orWhere({ tags: Like(`%,${tag}`) });
    });
    await query.execute();
    await Markov.pruneDanglingCorpusEntries();
  }

  /**
   * Delete this instance's entire database. The primary ID will persist if provided in the constructor.
   */
  public async delete(): Promise<void> {
    await this.ensureSetup();

    if (this.options instanceof MarkovOptions) await MarkovOptions.delete({ id: this.options.id });
    await MarkovRoot.delete({ id: this.db.id });
    this.construct();
    this.db = undefined as unknown as MarkovRoot; // Required to ensure setup() runs again later to populate the DB
  }

  /**
   * Generates a result, that contains a string and its references.
   */
  public async generate<CustomData = any>( // eslint-disable-line @typescript-eslint/no-explicit-any
    options?: MarkovGenerateOptions<CustomData>
  ): Promise<MarkovResult<CustomData>> {
    await this.ensureSetup();
    const corpusSize = await MarkovCorpusEntry.countBy({ markov: { id: this.db.id } });
    if (corpusSize <= 0) {
      throw new Error(
        'Corpus is empty. There is either no data, or the data is not sufficient to create markov chains.'
      );
    }

    let startSeed: string | undefined;
    const splitStartSeed = options?.startSeed?.split(' ');
    if (splitStartSeed && splitStartSeed.length >= this.options.stateSize) {
      startSeed = splitStartSeed.slice(0, this.options.stateSize).join(' ');
    }

    const maxTries = options?.maxTries ? options.maxTries : 10;

    let tries: number;

    // We loop through fragments to create a complete sentence
    for (tries = 1; tries <= maxTries; tries += 1) {
      let ended = false;

      // Create an array of MarkovCorpusItems
      // The first item is a random startWords element
      let firstSample = await this.sampleFragment(startSeed);
      if (!firstSample && startSeed) firstSample = await this.sampleFragment(); // If start seed fails, try without it
      if (!firstSample)
        throw new Error(
          'Could not get a random fragment. There is either no data, or the data is not sufficient to create markov chains.'
        );
      const arr = [firstSample];

      let score = 0;

      // loop to build a complete sentence
      for (let innerTries = 0; innerTries < maxTries; innerTries += 1) {
        const block = arr[arr.length - 1]; // last value in array
        const entry = await MarkovCorpusEntry.findOne({ where: { block: block.words } });
        if (!entry) break;

        const state = await this.sampleFragment(entry); // Find a following item in the corpus

        // If a state cannot be found, the sentence can't be completed
        if (!state) break;

        // add new state to list
        arr.push(state);

        // increment score
        score += state.words.length - 1; // increment score

        // is sentence finished?
        const endWords = await MarkovFragment.findOneBy({
          endWordMarkov: { id: this.db.id },
          words: state.words,
        });
        if (endWords) {
          ended = true;
          break;
        }
      }

      const sentence = arr
        .map((o) => o.words)
        .join(' ')
        .trim();

      const uniqueRefs = arr.reduce(
        (refMap, elem) => refMap.set(elem.ref.id, elem.ref),
        new Map<number, MarkovInputData>()
      );

      const result = {
        string: sentence,
        score,
        refs: Array.from(uniqueRefs.values()),
        tries,
      };

      // sentence is not ended or incorrect
      if (!ended || (typeof options?.filter === 'function' && !options.filter(result))) {
        // eslint-disable-next-line no-continue
        continue;
      }

      return result;
    }
    if (startSeed) {
      // Retry the whole process witout a startSeed if it fails
      return this.generate({ ...options, startSeed: undefined });
    }
    throw new Error(
      `Failed to build a sentence after ${
        tries - 1
      } tries. Possible solutions: try a less restrictive filter(), give more raw data to the corpus builder, or increase the number of maximum tries.`
    );
  }

  /**
   * Remove any dangling corpus entries with 0 fragments pointing to them
   */
  private static async pruneDanglingCorpusEntries(): Promise<void> {
    const emptyCorpuses = await MarkovCorpusEntry.createQueryBuilder('corpusEntry')
      .leftJoin('corpusEntry.fragments', 'fragment')
      .where('fragment.corpusEntry IS NULL')
      .getMany();
    await MarkovCorpusEntry.remove(emptyCorpuses);
  }
}
