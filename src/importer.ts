import { CorpusEntry } from './entity/CorpusEntry';
import { MarkovFragment } from './entity/MarkovFragment';
import { MarkovInputData } from './entity/MarkovInputData';
import { MarkovRoot } from './entity/MarkovRoot';
import { MarkovFragment as MarkovV3Fragment, Corpus as MarkovV3Corpus } from './v3-types';

export interface ImportFragmentExtract {
  refs: MarkovInputData[];
  fragments: MarkovFragment[];
}

/**
 * A place to hold the bulky code for importing exported data structures
 */
export class Importer {
  public db: MarkovRoot;

  constructor(db: MarkovRoot) {
    this.db = db;
  }

  private extractImportFragments(
    importFragments: MarkovFragment[],
    foreignKey: 'corpusEntry',
    corpusEntry: CorpusEntry
  ): ImportFragmentExtract;

  private extractImportFragments(
    importFragments: MarkovFragment[],
    foreignKey: 'startWordMarkov' | 'endWordMarkov'
  ): ImportFragmentExtract;

  private extractImportFragments(
    importFragments: MarkovFragment[],
    foreignKey: 'startWordMarkov' | 'endWordMarkov' | 'corpusEntry',
    corpusEntry?: CorpusEntry
  ): ImportFragmentExtract {
    const allRefs: MarkovInputData[] = [];
    const fragments = importFragments.map((importFragment) => {
      const fragment = MarkovFragment.create(importFragment);
      if (foreignKey === 'corpusEntry') {
        fragment[foreignKey] = corpusEntry;
      } else {
        fragment[foreignKey] = this.db;
      }
      const refs = importFragment.refs.map((ref) => {
        const markovInputData = MarkovInputData.create(ref);
        markovInputData.fragment = fragment;
        return markovInputData;
      });
      // Push refs to array so we can save them all at once later
      allRefs.push(...refs);
      return fragment;
    });
    return {
      refs: allRefs,
      fragments,
    };
  }

  public async saveImportFragments(
    importFragments: MarkovFragment[],
    foreignKey: 'startWordMarkov' | 'endWordMarkov'
  ): Promise<MarkovFragment[]> {
    const { refs, fragments } = this.extractImportFragments(importFragments, foreignKey);

    await MarkovFragment.save(fragments);
    await MarkovInputData.save(refs);

    return fragments;
  }

  public async saveImportCorpus(importCorpus: CorpusEntry[]): Promise<CorpusEntry[]> {
    const allFragments: MarkovFragment[] = [];
    const allRefs: MarkovInputData[] = [];
    const corpusEntries = importCorpus.map((importCorpusEntry) => {
      const corpusEntry = CorpusEntry.create(importCorpusEntry);
      const { fragments, refs } = this.extractImportFragments(
        importCorpusEntry.fragments,
        'corpusEntry',
        corpusEntry
      );
      allFragments.push(...fragments);
      allRefs.push(...refs);
      corpusEntry.markov = this.db;
      corpusEntry.fragments = fragments;
      return corpusEntry;
    });

    await CorpusEntry.save(corpusEntries);
    await MarkovFragment.save(allFragments);
    await MarkovInputData.save(allRefs);
    return corpusEntries;
  }

  private extractImportV3Fragments(
    importFragments: MarkovV3Fragment[],
    foreignKey: 'corpusEntry',
    corpusEntry: CorpusEntry
  ): ImportFragmentExtract;

  private extractImportV3Fragments(
    importFragments: MarkovV3Fragment[],
    foreignKey: 'startWordMarkov' | 'endWordMarkov'
  ): ImportFragmentExtract;

  private extractImportV3Fragments(
    importFragments: MarkovV3Fragment[],
    foreignKey: 'startWordMarkov' | 'endWordMarkov' | 'corpusEntry',
    corpusEntry?: CorpusEntry
  ): ImportFragmentExtract {
    const allRefs: MarkovInputData[] = [];
    const fragments = importFragments.map((importFragment) => {
      const fragment = new MarkovFragment();
      if (foreignKey === 'corpusEntry') {
        fragment[foreignKey] = corpusEntry;
      } else {
        fragment[foreignKey] = this.db;
      }
      fragment.words = importFragment.words;
      // Push refs to array so we can save them all at once later
      const refs = importFragment.refs.map((ref) => {
        const { string } = ref; // Save string as the following delete will delete ref.string as well
        const customData: Record<string, any> = ref;
        delete customData.string; // Only keep custom data
        const markovInputData = new MarkovInputData();
        markovInputData.fragment = fragment;
        markovInputData.string = string;
        if (Object.keys(customData).length) markovInputData.custom = customData;
        return markovInputData;
      });
      allRefs.push(...refs);

      return fragment;
    });
    return {
      refs: allRefs,
      fragments,
    };
  }

  public async saveImportV3Fragments(
    importFragments: MarkovV3Fragment[],
    foreignKey: 'startWordMarkov' | 'endWordMarkov'
  ): Promise<MarkovFragment[]> {
    const { refs, fragments } = this.extractImportV3Fragments(importFragments, foreignKey);

    await MarkovFragment.save(fragments);
    await MarkovInputData.save(refs);

    return fragments;
  }

  public async saveImportV3Corpus(importCorpus: MarkovV3Corpus): Promise<CorpusEntry[]> {
    const allFragments: MarkovFragment[] = [];
    const allRefs: MarkovInputData[] = [];
    const corpusEntries = Object.entries(importCorpus).map(([key, importFragments]) => {
      const corpusEntry = new CorpusEntry();
      const { fragments, refs } = this.extractImportV3Fragments(
        importFragments,
        'corpusEntry',
        corpusEntry
      );
      allFragments.push(...fragments);
      allRefs.push(...refs);
      corpusEntry.markov = this.db;
      corpusEntry.block = key;
      corpusEntry.fragments = fragments;
      return corpusEntry;
    });

    await CorpusEntry.save(corpusEntries);
    await MarkovFragment.save(allFragments);
    await MarkovInputData.save(allRefs);
    return corpusEntries;
  }
}
