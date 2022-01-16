import { IDictionaryEntry } from '@bible-engine/core';
import { StepLexiconImporter } from './../importer';

const HEBREW_LEXICON_ENTRY = `
$=H0001 ==============================
@StrNo=	H0001
@AltStrongTags=	H0002
@STEP_LexicalTag=
@StepGloss=	father
@STEPUnicodeAccented=	אָב
@BdbMedDef=	1) father of an individual<br>2) of God as father of his people<br>3) head or founder of a household, group, family, or clan<br>4) ancestor<br>4a) grandfather, forefathers - of person<br>4b) of people<br>5) originator or patron of a class, profession, or art<br>6) of producer, generator (fig.)<br>7) of benevolence and protection (fig.)<br>8) term of respect and honour<br>9) ruler or chief (spec.)<br>
@zh_Gloss=	父亲
@zh_tw_Gloss=	父親
@zh_Definition=	1) 个人的父亲<br>2) 神作为祂百姓的父<br>3) 一个家族, 群体, 家庭或宗族的首领或奠基者<br>4) 祖先<br>   4a) 祖父, 先祖 -- 个人的<br>   4b) 民族的<br>5) 一班人, 一个职业或艺术的创立者或支持者<br>6) 制造者或生产者 (比喻用法)<br>7) 慈祥或保护的人 (比喻用法)<br>8) 表尊敬与荣誉的称谓<br>9) (特指) 统治者或首领
@zh_tw_Definition=	1) 個人的父親<br>2) 神作為祂百姓的父<br>3) 一個家族, 群體, 家庭或宗族的首領或奠基者<br>4) 祖先<br>   4a) 祖父, 先祖 -- 個人的<br>   4b) 民族的<br>5) 一班人, 一個職業或藝術的創立者或支持者<br>6) 製造者或生產者 (比喻用法)<br>7) 慈祥或保護的人 (比喻用法)<br>8) 表尊敬與榮譽的稱謂<br>9) (特指) 統治者或首領
@sp_Gloss=	padre
@sp_Definition=	padre, antepasado, autor, hacedor de cualquier cosa, término de respeto y honor como maestro o maestro, consejero
@StrTranslit=	ʼâb
$=G0004=αβαρης============================
@StrNo=	G0004
@StepGloss=	not burdensome
@STEPUnicodeAccented=	ἀβαρής
@MounceShortDef=	not burdensome
@MounceMedDef=	not burdensome <br />literally: <b>weightless</b>; figuratively: <b>not burdensome,</b> <ref='2Co.11.9'>2Cor. 11:9</ref>*
@FLsjDefs=	<b> ἀβαρής</b>, ές, <br /> (βάρος) <b>without weight,</b> [<a href="javascript:void(0)" title=" 4th c.BC: Aristoteles Philosophus “de Caelo” 277b19; ἀβαρῆ εἶναι ἀέρα καὶ πῦρ 4th-3rd c.BC: Zeno Citieus Stoicus 1.27, compare 3rd c.BC: Chrysippus Stoicus 2.143, 3rd c.AD: Plotinus Philosophus 6.9.9, etc.">Refs 4th c.BC+</a>]; <b>light,</b> γῆ[<a href="javascript:void(0)" title=" “Anthologia Graeca” 7.461 (1st c.BC: Meleager Epigrammaticus): _metaphorically_, ἀ. χρῆμα">Refs 1st c.BC+</a>] a <b>light</b> matter, [<a href="javascript:void(0)" title=" “Comica Adespota” 158; παρρησία.. μαλακὴ καὶ ἀ. 1st-2nd c.AD: Plutarchus Biographus et Philosophus 2.59c ">Refs 1st c.AD+</a>]; of the pulse, [<a href="javascript:void(0)" title=" 2nd c.AD: Archigenes Medicus cited in 2nd c.AD: Galenus Medicus 8.651. ">Refs 2nd c.AD+</a>]<br /><Level2><b>__II</b></Level2> <b>not offensive,</b> ὀσμαί[<a href="javascript:void(0)" title=" 2nd c.AD: Aretaeus Medicus “ὀξέων νούσων θεραπευτικόν” 2.3 ">Refs 2nd c.AD+</a>]; of persons, <b>not burdensome,</b> ἀ. ἑαυτὸν τηρεῖν, παρέχειν, [<a href="javascript:void(0)" title=" NT.2Cor.11.9, “CIG” “Corpus Inscriptionum Graecarum” “Corpus Inscriptionum Graecarum” 5361.15 (from Berenice)">NT</a>]. <i>adverb</i> <b>-ρῶς</b> <b>without giving offence,</b> [<a href="javascript:void(0)" title=" 6th c.AD: Simplicius Philosophus “in Epictetum commentaria” p.85D.">Refs 6th c.AD+</a>]; <b>without taking offence,</b> [<a href="javascript:void(0)" title="[prev. work] p.88D.">Refs</a>]
@es_Gloss=	sin carga
@es_Definition=	sin carga (económica)
@zh_Gloss=	无重担
@zh_tw_Gloss=	無重擔
@zh_Definition=	(轻)无重担 (林后 11:9)
@zh_tw_Definition=	(輕)無重擔 (林後 11:9)
@StrTranslit=	abarḗs
`;

describe('parseStrongsDefinitions', () => {
    it('parses the strongs definition into a definition', () => {
        const definitions = StepLexiconImporter.parseStrongsDefinitions(HEBREW_LEXICON_ENTRY);
        const expected: IDictionaryEntry[] = [
            {
                strong: 'H0001',
                dictionary: '@BdbMedDef',
                lemma: 'אָב',
                transliteration: 'ʼâb',
                gloss: 'father',
                content:
                    '1) father of an individual<br>2) of God as father of his people<br>3) head or founder of a household, group, family, or clan<br>4) ancestor<br>4a) grandfather, forefathers - of person<br>4b) of people<br>5) originator or patron of a class, profession, or art<br>6) of producer, generator (fig.)<br>7) of benevolence and protection (fig.)<br>8) term of respect and honour<br>9) ruler or chief (spec.)<br>',
            },
            {
                strong: 'H0001',
                dictionary: '@zh_Definition',
                lemma: 'אָב',
                transliteration: 'ʼâb',
                gloss: '父亲',
                content:
                    '1) 个人的父亲<br>2) 神作为祂百姓的父<br>3) 一个家族, 群体, 家庭或宗族的首领或奠基者<br>4) 祖先<br>   4a) 祖父, 先祖 -- 个人的<br>   4b) 民族的<br>5) 一班人, 一个职业或艺术的创立者或支持者<br>6) 制造者或生产者 (比喻用法)<br>7) 慈祥或保护的人 (比喻用法)<br>8) 表尊敬与荣誉的称谓<br>9) (特指) 统治者或首领',
            },
            {
                strong: 'H0001',
                dictionary: '@zh_tw_Definition',
                lemma: 'אָב',
                transliteration: 'ʼâb',
                gloss: '父親',
                content:
                    '1) 個人的父親<br>2) 神作為祂百姓的父<br>3) 一個家族, 群體, 家庭或宗族的首領或奠基者<br>4) 祖先<br>   4a) 祖父, 先祖 -- 個人的<br>   4b) 民族的<br>5) 一班人, 一個職業或藝術的創立者或支持者<br>6) 製造者或生產者 (比喻用法)<br>7) 慈祥或保護的人 (比喻用法)<br>8) 表尊敬與榮譽的稱謂<br>9) (特指) 統治者或首領',
            },
            {
                strong: 'H0001',
                dictionary: '@es_Definition',
                lemma: 'אָב',
                transliteration: 'ʼâb',
                gloss: 'padre',
                content:
                    'padre, antepasado, autor, hacedor de cualquier cosa, término de respeto y honor como maestro o maestro, consejero',
            },
            {
                strong: 'G0004',
                dictionary: '@MounceShortDef',
                lemma: 'ἀβαρής',
                transliteration: 'abarḗs',
                gloss: 'not burdensome',
                content: 'not burdensome',
            },
            {
                strong: 'G0004',
                dictionary: '@MounceMedDef',
                lemma: 'ἀβαρής',
                transliteration: 'abarḗs',
                gloss: 'not burdensome',
                content:
                    "not burdensome <br />literally: <b>weightless</b>; figuratively: <b>not burdensome,</b> <ref='2Co.11.9'>2Cor. 11:9</ref>*",
            },
            {
                strong: 'G0004',
                dictionary: '@FLsjDefs',
                lemma: 'ἀβαρής',
                transliteration: 'abarḗs',
                gloss: 'not burdensome',
                content:
                    '<b> ἀβαρής</b>, ές, <br /> (βάρος) <b>without weight,</b> [<a href="javascript:void(0)" title=" 4th c.BC: Aristoteles Philosophus “de Caelo” 277b19; ἀβαρῆ εἶναι ἀέρα καὶ πῦρ 4th-3rd c.BC: Zeno Citieus Stoicus 1.27, compare 3rd c.BC: Chrysippus Stoicus 2.143, 3rd c.AD: Plotinus Philosophus 6.9.9, etc.">Refs 4th c.BC+</a>]; <b>light,</b> γῆ[<a href="javascript:void(0)" title=" “Anthologia Graeca” 7.461 (1st c.BC: Meleager Epigrammaticus): _metaphorically_, ἀ. χρῆμα">Refs 1st c.BC+</a>] a <b>light</b> matter, [<a href="javascript:void(0)" title=" “Comica Adespota” 158; παρρησία.. μαλακὴ καὶ ἀ. 1st-2nd c.AD: Plutarchus Biographus et Philosophus 2.59c ">Refs 1st c.AD+</a>]; of the pulse, [<a href="javascript:void(0)" title=" 2nd c.AD: Archigenes Medicus cited in 2nd c.AD: Galenus Medicus 8.651. ">Refs 2nd c.AD+</a>]<br /><Level2><b>__II</b></Level2> <b>not offensive,</b> ὀσμαί[<a href="javascript:void(0)" title=" 2nd c.AD: Aretaeus Medicus “ὀξέων νούσων θεραπευτικόν” 2.3 ">Refs 2nd c.AD+</a>]; of persons, <b>not burdensome,</b> ἀ. ἑαυτὸν τηρεῖν, παρέχειν, [<a href="javascript:void(0)" title=" NT.2Cor.11.9, “CIG” “Corpus Inscriptionum Graecarum” “Corpus Inscriptionum Graecarum” 5361.15 (from Berenice)">NT</a>]. <i>adverb</i> <b>-ρῶς</b> <b>without giving offence,</b> [<a href="javascript:void(0)" title=" 6th c.AD: Simplicius Philosophus “in Epictetum commentaria” p.85D.">Refs 6th c.AD+</a>]; <b>without taking offence,</b> [<a href="javascript:void(0)" title="[prev. work] p.88D.">Refs</a>]',
            },
            {
                strong: 'G0004',
                dictionary: '@es_Definition',
                lemma: 'ἀβαρής',
                transliteration: 'abarḗs',
                gloss: 'sin carga',
                content: 'sin carga (económica)',
            },
            {
                strong: 'G0004',
                dictionary: '@zh_Definition',
                lemma: 'ἀβαρής',
                transliteration: 'abarḗs',
                gloss: '无重担',
                content: '(轻)无重担 (林后 11:9)',
            },
            {
                strong: 'G0004',
                dictionary: '@zh_tw_Definition',
                lemma: 'ἀβαρής',
                transliteration: 'abarḗs',
                gloss: '無重擔',
                content: '(輕)無重擔 (林後 11:9)',
            },
        ];
        expect(definitions).toStrictEqual(expected);
    });
});
