import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, Index } from 'typeorm';
import { BiblePhrase } from './BiblePhrase.entity';

@Entity()
export class BiblePhraseOriginalWord {
    @PrimaryGeneratedColumn()
    id?: number;

    @Column({ nullable: true })
    @Index()
    strong: string;
    @Column({ nullable: true })
    type?: string;
    @Column({ nullable: true })
    tense?: string;
    @Column({ nullable: true })
    voice?: string;
    @Column({ nullable: true })
    mood?: string;
    @Column({ nullable: true })
    case?: string;
    @Column({ nullable: true })
    person?: string;
    @Column({ nullable: true })
    number?: string;
    @Column({ nullable: true })
    gender?: string;
    @Column({ nullable: true })
    extra?: string;
    @Column({ nullable: true })
    stem?: string;
    @Column({ nullable: true })
    action?: string;
    @Column({ nullable: true })
    aspect?: string;

    @Column({ nullable: true })
    @Index()
    phraseId?: number;
    @ManyToOne(() => BiblePhrase, phrase => phrase.originalWords)
    phrase?: BiblePhrase;

    constructor(initializer: BiblePhraseOriginalWord) {
        if (initializer) Object.assign(this, initializer);
    }
}
