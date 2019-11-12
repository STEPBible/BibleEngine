/**
 * Entry point for NPM package.
 */
import SwordModule from './src/SwordModule';
import ModuleIndex from './src/ModuleIndex';
import { SwordImporter } from './src/importer';

const VerseMetadata = require('./src/VerseMetadata');

export { SwordImporter, SwordModule, ModuleIndex, VerseMetadata };
