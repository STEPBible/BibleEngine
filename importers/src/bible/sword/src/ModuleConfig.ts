/**
 * Configuration settings for a specific module
 * Documentation: https://wiki.crosswire.org/DevTools:conf_Files
 */

enum SwordMetadataKey {
  DESCRIPTION = 'Description',
  ENCODING = 'Encoding',
  IN_DEPTH_DESCRIPTION = 'About',
  LANGUAGE = 'Lang',
  OPTION_FILTER = 'GlobalOptionFilter',
  SOURCE_TYPE = 'SourceType',
  VERSIFICATION = 'Versification'
}

export default class ModuleConfig {
  about: string
  description: string
  encoding: string;
  globalOptionFilters: string[];
  language: string
  license: string
  moduleName: string;
  versification: string;

  constructor(config: string) {
    const lines = config.split(/[\r\n]+/g);
    this.moduleName = lines[0].slice(1, -1);
    this.globalOptionFilters = [];

    lines.forEach((line: string) => {
      const splittedLine = line.split(/=(.+)/);
      const [key, value] = splittedLine
      if (key === '') {
        return;
      }
      switch (key) {
        case SwordMetadataKey.OPTION_FILTER: {
          this.globalOptionFilters.push(value);
          break;
        }
        case SwordMetadataKey.VERSIFICATION: {
          this.versification = value.toLowerCase();
          break;
        }
        case SwordMetadataKey.ENCODING: {
          this.encoding = value
          break;
        }
        case SwordMetadataKey.LANGUAGE: {
          this.language = value;
          break;
        }
        case SwordMetadataKey.IN_DEPTH_DESCRIPTION: {
          this.about = value
        }
      }
    });
  }
}
