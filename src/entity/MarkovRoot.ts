/* eslint-disable import/no-cycle */
import { Entity, BaseEntity, OneToOne, PrimaryGeneratedColumn, OneToMany, JoinColumn } from 'typeorm';
import { CorpusEntry } from './CorpusEntry';
import { MarkovFragment } from './MarkovFragment';
import { MarkovOptions } from './MarkovOptions';

@Entity()
export class MarkovRoot extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: string;

  @OneToMany(() => CorpusEntry, (entry) => entry.markov, { nullable: true })
  corpus: CorpusEntry[];

  @OneToMany(() => MarkovFragment, (fragment) => fragment.startWordMarkov, { nullable: true })
  startWords: MarkovFragment[];

  @OneToMany(() => MarkovFragment, (fragment) => fragment.endWordMarkov, { nullable: true })
  endWords: MarkovFragment[];

  @OneToOne(() => MarkovOptions)
  @JoinColumn()
  options: MarkovOptions;
}
