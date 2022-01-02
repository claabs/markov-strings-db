import { Entity, BaseEntity, PrimaryGeneratedColumn, Column, ManyToOne, Index } from 'typeorm';
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

  @ManyToOne(() => MarkovInputData, { onDelete: 'CASCADE' })
  ref: MarkovInputData;

  @Index()
  @ManyToOne(() => MarkovRoot, { nullable: true, onDelete: 'CASCADE' })
  startWordMarkov?: MarkovRoot;

  @Index()
  @ManyToOne(() => MarkovRoot, { nullable: true, onDelete: 'CASCADE' })
  endWordMarkov?: MarkovRoot;

  @Index()
  @ManyToOne(() => MarkovCorpusEntry, {
    nullable: true,
    onDelete: 'CASCADE',
    cascade: ['update', 'insert'],
  })
  corpusEntry?: MarkovCorpusEntry;
}
