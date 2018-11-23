import { Entity, Column, PrimaryColumn } from 'typeorm';

@Entity()
export class Strong {
    @PrimaryColumn()
    strong: string;

    @Column()
    lemma: string;

    @Column()
    gloss: string;

    constructor(initializer: Strong) {
        if (initializer) Object.assign(this, initializer);
    }
}
