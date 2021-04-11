import { getErrorMessageWithContextStackTrace } from '../functions/helpers.functions';
import { ParserContext } from './../types';

export class OsisParseError extends Error {
    constructor(message: string, context: ParserContext) {
        super(getErrorMessageWithContextStackTrace(message, context))
        this.name = 'OsisParseError'
        Object.setPrototypeOf(this, OsisParseError.prototype)
    }
  }
