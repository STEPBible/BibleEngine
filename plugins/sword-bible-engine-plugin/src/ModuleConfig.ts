/**
 * Configuration settings for a specific module
 * Documentation: https://wiki.crosswire.org/DevTools:conf_Files
 */
export default class ModuleConfig {
  globalOptionFilters: string[];
  features: string[];
  versification: string;
  encoding: string;
  moduleName: string;
  constructor(config: string) {
    const lines = config.split(/[\r\n]+/g);
    this.moduleName = lines[0].slice(1, -1);
    this.globalOptionFilters = [];
    this.features = [];

    lines.forEach((line: string) => {
      const splittedLine = line.split(/=(.+)/);
      if (splittedLine[0] !== '') {
        if (splittedLine[0] === 'GlobalOptionFilter') {
          this.globalOptionFilters.push(splittedLine[1]);
        } else if (splittedLine[0] === 'Feature') {
          this.features.push(splittedLine[1]);
        } else if (splittedLine[0] === 'Versification') {
          this.versification = splittedLine[1].toLowerCase();
        } else if (splittedLine[0] === 'Encoding') {
          [, this.encoding] = splittedLine;
        }
      }
    });
  }
}
