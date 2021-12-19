import {
  Entity,
  BaseEntity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  Index,
  OneToMany,
} from 'typeorm';
import { MarkovCorpusEntry } from './MarkovCorpusEntry';
import { MarkovInputData } from './MarkovInputData';
import { MarkovRoot } from './MarkovRoot';

@Entity()
export class MarkovFragment extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column()
  words: string;

  @OneToMany(() => MarkovInputData, (ref) => ref.fragment, { nullable: true })
  refs: MarkovInputData[];

  @ManyToOne(() => MarkovRoot, { nullable: true })
  startWordMarkov?: MarkovRoot;

  @ManyToOne(() => MarkovRoot, { nullable: true })
  endWordMarkov?: MarkovRoot;

  @ManyToOne(() => MarkovCorpusEntry, { nullable: true, onDelete: 'CASCADE' })
  corpusEntry?: MarkovCorpusEntry;
}
