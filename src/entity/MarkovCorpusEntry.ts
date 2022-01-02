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
  id: number;

  @Index()
  @Column()
  block: string;

  @OneToMany(() => MarkovFragment, (fragment) => fragment.corpusEntry, { nullable: true })
  fragments: MarkovFragment[];

  @Index()
  @ManyToOne(() => MarkovRoot, { nullable: true, onDelete: 'CASCADE' })
  markov: MarkovRoot;
}
