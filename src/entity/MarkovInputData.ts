/* eslint-disable import/no-cycle, @typescript-eslint/no-explicit-any */
import {
  BaseEntity,
  Column,
  Entity,
  Index,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { MarkovFragment } from './MarkovFragment';
import { MarkovRoot } from './MarkovRoot';

@Entity()
export class MarkovInputData<CustomData = any> extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column()
  string: string;

  @Index()
  @Column('simple-array', { nullable: true })
  tags?: string[];

  @Column('simple-json', { nullable: true })
  custom?: CustomData;

  @Index()
  @ManyToOne(() => MarkovRoot, { nullable: true, onDelete: 'CASCADE' })
  markov: MarkovRoot;

  @OneToMany(() => MarkovFragment, (fragment) => fragment.ref)
  fragments: MarkovFragment[];
}
