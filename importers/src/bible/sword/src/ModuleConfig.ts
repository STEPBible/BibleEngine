/**
 * Configuration settings for a specific module
 * Documentation: https://wiki.crosswire.org/DevTools:conf_Files
 */

import { SwordFilterOptions, SwordMetadataKey } from './types';

export default class ModuleConfig {
    about: string;
    description: string;
    encoding: BufferEncoding;
    globalOptionFilters: string[];
    hasStrongs: boolean;
    language: string;
    license: string;
    moduleName: string;
    shortCopyright: string;
    versification: string;

    constructor(config: string) {
        const lines = config.split(/[\r\n]+/g);
        this.moduleName = lines[0]!.slice(1, -1);
        this.globalOptionFilters = [];

        lines.forEach((line: string) => {
            const splittedLine = line.split(/=(.+)/);
            const [key, value] = splittedLine;
            if (key === '') {
                return;
            }
            switch (key) {
                case SwordMetadataKey.OPTION_FILTER: {
                    this.globalOptionFilters.push(value || '');
                    if (value === SwordFilterOptions.OSIS_STRONGS) {
                        this.hasStrongs = true;
                    }
                    break;
                }
                case SwordMetadataKey.VERSIFICATION: {
                    this.versification = (value || '').toLowerCase();
                    break;
                }
                case SwordMetadataKey.ENCODING: {
                    this.encoding =
                        value &&
                        [
                            'ascii',
                            'utf8',
                            'utf-8',
                            'utf16le',
                            'ucs2',
                            'ucs-2',
                            'base64',
                            'base64url',
                            'latin1',
                            'binary',
                            'hex',
                        ].indexOf(value) !== -1
                            ? (value as BufferEncoding)
                            : 'utf8';
                    break;
                }
                case SwordMetadataKey.LANGUAGE: {
                    this.language = value || '';
                    break;
                }
                case SwordMetadataKey.IN_DEPTH_DESCRIPTION: {
                    this.about = value || '';
                    break;
                }
                case SwordMetadataKey.SHORT_COPYRIGHT: {
                    this.shortCopyright = value || '';
                    break;
                }
                case SwordMetadataKey.DESCRIPTION: {
                    this.description = value || '';
                }
            }
        });
    }
}
