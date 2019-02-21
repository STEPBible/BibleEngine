import { DocumentRoot } from '@bible-engine/core';

export default <DocumentRoot>{
    type: 'root',
    contents: [
        {
            type: 'section',
            title: 'Neue evangelistische Übersetzung (NeÜ)',
            subTitle: 'eine Übertragung der Bibel ins heutige Deutsch',
            contents: [
                {
                    type: 'group',
                    groupType: 'paragraph',
                    contents: [{ type: 'phrase', content: 'Quelle: www.derbibelvertrauen.de' }]
                },
                {
                    type: 'group',
                    groupType: 'paragraph',
                    contents: [{ type: 'phrase', content: 'Textstand: September 2018' }]
                },
                {
                    type: 'group',
                    groupType: 'paragraph',
                    contents: [
                        {
                            type: 'phrase',
                            content:
                                'Das © Copyright für alle gedruckten Ausgaben liegt bei der ' +
                                'Christlichen Verlagsgesellschaft mbH, Dillenburg, Moltkestr. 1, ' +
                                '35683 Dillenburg, Tel. 02771/83020 info@cv-dillenburg.de'
                        }
                    ]
                },
                {
                    type: 'group',
                    groupType: 'paragraph',
                    contents: [
                        {
                            type: 'phrase',
                            content:
                                'Das © Copyright für elektronischen Ausgaben (auch für die ' +
                                'kostenfreien) bedarf der Genehmigung des Verfassers Karl-Heinz ' +
                                'Vanheiden, Ahornweg 3, 07926 Gefell.'
                        }
                    ]
                },
                {
                    type: 'group',
                    groupType: 'paragraph',
                    contents: [
                        {
                            type: 'phrase',
                            content:
                                'Kopien einzelner Teile der NeÜ für den privaten oder ' +
                                'innergemeindlichen Gebrauch sind erlaubt.'
                        }
                    ]
                }
            ]
        }
    ]
};
