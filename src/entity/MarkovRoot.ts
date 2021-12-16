
import {
  Entity,
  BaseEntity,
  OneToOne,
  PrimaryGeneratedColumn,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { MarkovCorpusEntry } from './MarkovCorpusEntry';
import { MarkovFragment } from './MarkovFragment';
import { MarkovOptions } from './MarkovOptions';

@Entity()
export class MarkovRoot extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: string;

  @OneToMany(() => MarkovCorpusEntry, (entry) => entry.markov, { nullable: true })
  corpus: MarkovCorpusEntry[];

  @OneToMany(() => MarkovFragment, (fragment) => fragment.startWordMarkov, { nullable: true })
  startWords: MarkovFragment[];

  @OneToMany(() => MarkovFragment, (fragment) => fragment.endWordMarkov, { nullable: true })
  endWords: MarkovFragment[];

  @OneToOne(() => MarkovOptions)
  @JoinColumn()
  options: MarkovOptions;
}
