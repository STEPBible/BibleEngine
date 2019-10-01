export default class Network {
  static async internetIsAvailable() {
    const timeout = 3000
    try {
      await Promise.race([
        fetch('https://www.google.com'),
        new Promise((_, reject) =>
          setTimeout(() => {
            reject(new Error('timeout'))
          }, timeout)
        ),
      ])
      return true
    } catch (e) {
      return false
    }
  }
}
