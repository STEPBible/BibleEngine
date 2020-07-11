import axios from 'axios';
import StrongsNumber from '../models/StrongsNumber';
import StrongsDefinition from '../models/StrongsDefinition';

const BASE_URL = 'https://stepbible2.herokuapp.com/rest/v1/bible';

export default class BibleApi {
    static async getBooks() {
        const url = `${BASE_URL}/versions/ESV/books`;
        const { data } = await axios.get(url);
        return data;
    }
    static async getChapter(bookOsisId: string, versionChapterNum: number) {
        const url = `${BASE_URL}/ref/ESV/${bookOsisId}/${versionChapterNum}`;
        const { data } = await axios.get(url);
        return data.content.contents;
    }
    static async getStrongsDefinitions(strongsTags: string[]) {
        const normalizedStrongs = strongsTags.map(strong => new StrongsNumber(strong));
        const isHebrewStrongs = normalizedStrongs[0].id.startsWith('H');
        const dictionaries = isHebrewStrongs
            ? ['@BdbMedDef']
            : ['@MounceShortDef', '@MounceMedDef'];
        const requests = await Promise.all(
            normalizedStrongs.map(strong =>
                Promise.all(
                    dictionaries.map(async dictionary => {
                        const url = `${BASE_URL}/definitions/${strong.id}/${dictionary}`;
                        const { data } = await axios.get(url);
                        return data;
                    })
                )
            )
        );
        const definitions = requests.map(request => StrongsDefinition.merge(request));
        return definitions;
    }
}
