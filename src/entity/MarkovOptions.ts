import { Entity, BaseEntity, Column, OneToOne, PrimaryColumn, Generated } from 'typeorm';
import { MarkovRoot } from './MarkovRoot';

@Entity()
export class MarkovOptions extends BaseEntity {
  @PrimaryColumn({ type: 'text' })
  @Generated('uuid')
  id: string;

  @Column()
  stateSize: number;

  @OneToOne(() => MarkovRoot)
  markov: MarkovRoot;
}
