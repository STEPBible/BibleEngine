import { generateBibleDocument } from './content.functions';
import { IBibleOutputRich } from '../models';
import { BibleParagraph, BiblePhrase } from '../entities';

const phrases: BiblePhrase[] = [];
const paragraphs: BibleParagraph[] = [];
const context: IBibleOutputRich['context'] = {};

const doc = generateBibleDocument(phrases, paragraphs, context);

test('generateBibleDocument should return a root output node', () => {
    expect(doc.type).toBe('root');
});
