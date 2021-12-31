import {
  Entity,
  BaseEntity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  Index,
  OneToMany,
  AfterRemove,
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

  @OneToMany(() => MarkovInputData, (ref) => ref.fragment, { nullable: true, onDelete: 'CASCADE' })
  refs: MarkovInputData[];

  @ManyToOne(() => MarkovRoot, { nullable: true, onDelete: 'CASCADE' })
  startWordMarkov?: MarkovRoot;

  @ManyToOne(() => MarkovRoot, { nullable: true, onDelete: 'CASCADE' })
  endWordMarkov?: MarkovRoot;

  @ManyToOne(() => MarkovCorpusEntry, { nullable: true, onDelete: 'CASCADE' })
  corpusEntry?: MarkovCorpusEntry;

  @AfterRemove()
  async removeRelations() {
    if (this.startWordMarkov) await this.startWordMarkov.remove();
    if (this.endWordMarkov) await this.endWordMarkov.remove();
    if (this.corpusEntry) await this.corpusEntry.remove();
  }
}
