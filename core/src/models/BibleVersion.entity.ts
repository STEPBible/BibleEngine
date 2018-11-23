import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class BibleVersion {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    version: string;

    @Column()
    description: string;

    @Column({
        length: 5
    })
    language: string;

    @Column({ nullable: true })
    copyright: string;

    @Column({ nullable: true })
    hasStrongs: boolean;

    @Column({ nullable: true })
    hasMorphology: boolean;

    constructor(initializer: Partial<BibleVersion>) {
        if (initializer) Object.assign(this, initializer);
    }
}
