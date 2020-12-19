export function parseStrongsNums(tagLemma: string) {
    const lemma = tagLemma.replace(/\!/g, '')
    const strongsNumbersString = lemma.split('strong:').join('')
    const strongsNumbers = strongsNumbersString
        .split(' ')
        .filter(element => element)
        .map(strongsNum => normalizeStrongsNum(strongsNum));
    return strongsNumbers
}

export function normalizeStrongsNum(strongsNum: string): string {
    const lastCharacter: any = strongsNum[strongsNum.length - 1];
    const startingletter = strongsNum[0].toUpperCase();
    const numberPortion = !isNaN(lastCharacter)
        ? strongsNum.substring(1)
        : strongsNum.substring(1, strongsNum.length - 1);
    const endingLetter = !isNaN(lastCharacter) ? '' : lastCharacter.toLowerCase();
    const paddedNumber = String('0000' + numberPortion).slice(-4);
    return startingletter + paddedNumber + endingLetter;
}
