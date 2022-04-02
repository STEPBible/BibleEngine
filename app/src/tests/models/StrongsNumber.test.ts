import StrongsNumber from '../../models/StrongsNumber'

describe('StrongsNumber', () => {
  describe('normalization', () => {
    test('Strongs numbers are normalized to have same length', () => {
      const badStrongs = 'H002'
      const strongsNum = new StrongsNumber(badStrongs)
      expect(strongsNum.id).toEqual('H0002')
    })
    test('whitespace is trimmed', () => {
      const badStrongs = 'H002 '
      const strongsNum = new StrongsNumber(badStrongs)
      expect(strongsNum.id).toEqual('H0002')
    })
    test('extended strongs are supported', () => {
      const strongs = 'H1121a'
      const strongsNum = new StrongsNumber(strongs)
      expect(strongsNum.id).toEqual('H1121a')
    })
  })
})
