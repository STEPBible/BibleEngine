import {
    IDictionaryEntry
} from '@bible-engine/core';
import { StepLexiconImporter } from './../importer';

const HEBREW_LEXICON_ENTRY = `
$=H0001 ==============================
@StrNo=	H0001
@AltStrongTags=	H0002
@STEP_LexicalTag=	H0001
@StepGloss=	father
@STEPUnicodeAccented=	אָב
@2llUnaccented=	AB
@AcadTransAccented=	'ab
@AcadTransUnaccented=	'b
@BdbMedDef=	1) father of an individual<br>2) of God as father of his people<br>3) head or founder of a household, group, family, or clan<br>4) ancestor<br>4a) grandfather, forefathers - of person<br>4b) of people<br>5) originator or patron of a class, profession, or art<br>6) of producer, generator (fig.)<br>7) of benevolence and protection (fig.)<br>8) term of respect and honour<br>9) ruler or chief (spec.)<br>
@zh_Gloss=	父亲
@zh_tw_Gloss=	父親
@zh_Definition=	1) 个人的父亲<br>2) 神作为祂百姓的父<br>3) 一个家族, 群体, 家庭或宗族的首领或奠基者<br>4) 祖先<br>   4a) 祖父, 先祖 -- 个人的<br>   4b) 民族的<br>5) 一班人, 一个职业或艺术的创立者或支持者<br>6) 制造者或生产者 (比喻用法)<br>7) 慈祥或保护的人 (比喻用法)<br>8) 表尊敬与荣誉的称谓<br>9) (特指) 统治者或首领
@zh_tw_Definition=	1) 個人的父親<br>2) 神作為祂百姓的父<br>3) 一個家族, 群體, 家庭或宗族的首領或奠基者<br>4) 祖先<br>   4a) 祖父, 先祖 -- 個人的<br>   4b) 民族的<br>5) 一班人, 一個職業或藝術的創立者或支持者<br>6) 製造者或生產者 (比喻用法)<br>7) 慈祥或保護的人 (比喻用法)<br>8) 表尊敬與榮譽的稱謂<br>9) (特指) 統治者或首領
@Translations=	father, fathers, fathered
@STEPAramEquiv=	H0002=אַב
@StrTranslit=	ʼâb
@StrPronunc=	awb
@StrFreq=	1060
@StepRelatedNos2=	H0002, H0001, H0045, H0022, H0023, H0043, H0026, H0027, H0028, H0021, H0038, H0030, H0031, H0032, H0036, H0037, H0039, H0040, H0041, H0042, H0074, H0044, H0372, H0373, H0048, H0087, H0085, H0049, H0050, H0051, H0052, H0053, H0054
$=H0002 ==============================
`

describe('parseStrongsDefinitions', () => {
    it('parses the strongs definition into a definition', () => {
        const definitions = StepLexiconImporter.parseStrongsDefinitions(HEBREW_LEXICON_ENTRY)
        const expected: IDictionaryEntry[] = [
            {
                strong: 'H0001',
                dictionary: '@BdbMedDef',
                lemma: 'אָב',
                transliteration: '\'ab',
                gloss: 'father',
                content: '1) father of an individual<br>2) of God as father of his people<br>3) head or founder of a household, group, family, or clan<br>4) ancestor<br>4a) grandfather, forefathers - of person<br>4b) of people<br>5) originator or patron of a class, profession, or art<br>6) of producer, generator (fig.)<br>7) of benevolence and protection (fig.)<br>8) term of respect and honour<br>9) ruler or chief (spec.)<br>',
            },
            {
                strong: 'H0001',
                dictionary: '@zh_Definition',
                lemma: 'אָב',
                transliteration: '\'ab',
                gloss: '父亲',
                content: '1) 个人的父亲<br>2) 神作为祂百姓的父<br>3) 一个家族, 群体, 家庭或宗族的首领或奠基者<br>4) 祖先<br>   4a) 祖父, 先祖 -- 个人的<br>   4b) 民族的<br>5) 一班人, 一个职业或艺术的创立者或支持者<br>6) 制造者或生产者 (比喻用法)<br>7) 慈祥或保护的人 (比喻用法)<br>8) 表尊敬与荣誉的称谓<br>9) (特指) 统治者或首领',
            },
            {
                strong: 'H0001',
                dictionary: '@zh_tw_Definition',
                lemma: 'אָב',
                transliteration: '\'ab',
                gloss: '父親',
                content: '1) 個人的父親<br>2) 神作為祂百姓的父<br>3) 一個家族, 群體, 家庭或宗族的首領或奠基者<br>4) 祖先<br>   4a) 祖父, 先祖 -- 個人的<br>   4b) 民族的<br>5) 一班人, 一個職業或藝術的創立者或支持者<br>6) 製造者或生產者 (比喻用法)<br>7) 慈祥或保護的人 (比喻用法)<br>8) 表尊敬與榮譽的稱謂<br>9) (特指) 統治者或首領',
            },
        ]
        expect(definitions).toStrictEqual(expected)
    })
})