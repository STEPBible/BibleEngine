export default class StrongsNumber {
    id: string;
    constructor(strongsNum: string) {
        this.id = StrongsNumber.getNormalizedStrongsNum(strongsNum);
    }

    static getNormalizedStrongsNum(strongsNum: string) {
        let newStrongsNum = strongsNum.replace(/ /g, '');
        if (newStrongsNum.length < 5) {
            while (newStrongsNum.length < 5) {
                newStrongsNum = `${newStrongsNum.slice(0, 1)}0${newStrongsNum.slice(1)}`;
            }
        }
        return newStrongsNum;
    }
}
