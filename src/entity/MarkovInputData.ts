/* eslint-disable import/no-cycle, @typescript-eslint/no-explicit-any */
import { BaseEntity, Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { MarkovFragment } from './MarkovFragment';

@Entity()
export class MarkovInputData<CustomData = any> extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  string: string;

  @Column('simple-json', { nullable: true })
  custom: CustomData;

  @ManyToOne(() => MarkovFragment, { nullable: true, onDelete: 'CASCADE' })
  fragment: MarkovFragment;
}
