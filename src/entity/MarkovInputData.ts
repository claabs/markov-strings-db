/* eslint-disable import/no-cycle */
import { BaseEntity, Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { MarkovFragment } from './MarkovFragment';

@Entity()
export class MarkovInputData extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: string;

  @Column()
  string: string;

  @Column("simple-json", { nullable: true })
  custom?: Record<string, boolean | string | number>;

  @ManyToOne(() => MarkovFragment, { nullable: true })
  fragment: MarkovFragment;
}
