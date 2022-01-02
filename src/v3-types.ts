export type MarkovInputDatum = {
  string: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
};

export type MarkovInputData = MarkovInputDatum[];

/**
 * Data to build the Markov instance
 */
export interface MarkovConstructorOptions {
  stateSize?: number;
}

export interface MarkovDataMembers {
  stateSize: number;
}

export interface MarkovResult {
  string: string;
  score: number;
  refs: MarkovInputData;
  tries: number;
}

export interface MarkovFragment {
  words: string;
  refs: MarkovInputData;
}

export interface Corpus {
  [key: string]: MarkovFragment[];
}

export interface MarkovImportExport {
  corpus: Corpus;
  startWords: MarkovFragment[];
  endWords: MarkovFragment[];
  options: MarkovDataMembers;
}
