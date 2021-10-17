/* eslint-disable import/no-cycle */
import { Entity, BaseEntity, PrimaryGeneratedColumn, Column, ManyToOne, Index, OneToMany } from 'typeorm';
import { CorpusEntry } from './CorpusEntry';
import { MarkovInputData } from './MarkovInputData';
import { MarkovRoot } from './MarkovRoot';

@Entity()
export class MarkovFragment extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: string;

  @Index()
  @Column()
  words: string;

  @OneToMany(() => MarkovInputData, (ref) => ref.fragment, { nullable: true })
  refs: MarkovInputData[];

  @ManyToOne(() => MarkovRoot, { nullable: true })
  startWordMarkov?: MarkovRoot

  @ManyToOne(() => MarkovRoot, { nullable: true })
  endWordMarkov?: MarkovRoot

  @ManyToOne(() => CorpusEntry, { nullable: true })
  corpusEntry?: CorpusEntry
}
