/* eslint-disable import/no-cycle, @typescript-eslint/no-explicit-any */
import {
  AfterRemove,
  BaseEntity,
  Column,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { MarkovFragment } from './MarkovFragment';

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

  @ManyToOne(() => MarkovFragment, { nullable: true, onDelete: 'CASCADE' })
  fragment: MarkovFragment;

  @AfterRemove()
  async removeFragment() {
    if (this.fragment) await this.fragment.remove();
  }
}
