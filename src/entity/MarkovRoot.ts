import {
  Entity,
  BaseEntity,
  OneToOne,
  OneToMany,
  JoinColumn,
  PrimaryColumn,
  Generated,
} from 'typeorm';
import { MarkovCorpusEntry } from './MarkovCorpusEntry';
import { MarkovFragment } from './MarkovFragment';
import { MarkovInputData } from './MarkovInputData';
import { MarkovOptions } from './MarkovOptions';

@Entity()
export class MarkovRoot extends BaseEntity {
  @PrimaryColumn({ type: 'text' })
  @Generated('uuid')
  id: string;

  @OneToMany(() => MarkovInputData, (inputData) => inputData.markov, { nullable: true })
  inputData: MarkovInputData[];

  @OneToMany(() => MarkovCorpusEntry, (entry) => entry.markov, { nullable: true })
  corpus: MarkovCorpusEntry[];

  @OneToMany(() => MarkovFragment, (fragment) => fragment.startWordMarkov, { nullable: true })
  startWords: MarkovFragment[];

  @OneToMany(() => MarkovFragment, (fragment) => fragment.endWordMarkov, { nullable: true })
  endWords: MarkovFragment[];

  @OneToOne(() => MarkovOptions, { onDelete: 'CASCADE' })
  @JoinColumn()
  options: MarkovOptions;
}
