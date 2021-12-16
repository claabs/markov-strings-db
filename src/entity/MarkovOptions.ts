import { Entity, BaseEntity, PrimaryGeneratedColumn, Column, OneToOne } from 'typeorm';
import { MarkovRoot } from './MarkovRoot';

@Entity()
export class MarkovOptions extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: string;

  @Column()
  stateSize: number;

  @OneToOne(() => MarkovRoot)
  markov: MarkovRoot;
}
