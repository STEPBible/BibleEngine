import { getErrorMessageWithContextStackTrace } from '../functions/logging.functions.js';
import { ParserContext } from './../entities/ParserContext.js';

export class OsisParseError extends Error {
    constructor(message: string, context: ParserContext) {
        super(getErrorMessageWithContextStackTrace(message, context));
        this.name = 'OsisParseError';
        Object.setPrototypeOf(this, OsisParseError.prototype);
    }
}
