import { IBibleBook, IBibleContent } from '.';

export type BookWithContent = {
    book: IBibleBook;
    contents: IBibleContent[];
};
