import { Entity, Column, PrimaryColumn } from 'typeorm';

@Entity()
export class BibleVersion {
    @PrimaryColumn()
    id: number;

    @Column()
    version: string;

    @Column()
    description: string;

    @Column({
        length: 5
    })
    language: string;

    @Column()
    copyright: string;

    @Column()
    hasStrongs: boolean;

    @Column()
    hasMorphology: boolean;

    constructor(initializer: Partial<BibleVersion>) {
        if (initializer) Object.assign(this, initializer);
    }
}
