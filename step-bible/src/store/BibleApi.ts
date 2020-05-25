import axios from 'axios';

const BASE_URL = `https://stepbible2.herokuapp.com/rest/v1/bible/versions/ESV`;

export default class BibleApi {
    static async getBooks() {
        const url = `${BASE_URL}/books`;
        const { data } = await axios.get(url);
        return data;
    }
}
