import {
  Entity,
  BaseEntity,
  ManyToOne,
  PrimaryGeneratedColumn,
  Index,
  OneToMany,
  Column,
} from 'typeorm';
import { MarkovFragment } from './MarkovFragment';
import { MarkovRoot } from './MarkovRoot';

@Entity()
export class MarkovCorpusEntry extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: string;

  @Index()
  @Column()
  block: string;

  @OneToMany(() => MarkovFragment, (fragment) => fragment.corpusEntry, { nullable: true })
  fragments: MarkovFragment[];

  @ManyToOne(() => MarkovRoot, { nullable: true })
  markov: MarkovRoot;
}
