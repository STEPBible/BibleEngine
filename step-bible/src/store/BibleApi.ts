import axios from 'axios';

const BASE_URL = `https://stepbible2.herokuapp.com/rest/v1/bible`;

export default class BibleApi {
    static async getBooks() {
        const url = `${BASE_URL}/versions/ESV/books`;
        const { data } = await axios.get(url);
        return data;
    }
    static async getChapter(bookOsisId: string, versionChapterNum: number) {
        const url = `${BASE_URL}/ref/ESV/${bookOsisId}/${versionChapterNum}`;
        const {
            data: { content }
        } = await axios.get(url);
        return content;
    }
}
