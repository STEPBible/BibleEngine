import * as winston from 'winston';
import { ParserContext } from '../bible/osis/entities/ParserContext';
import { getErrorMessageWithContext } from '../bible/osis/functions/logging.functions';
import { LogLevel } from './Importer.interface';

class Logger {
    logger: winston.Logger;

    constructor() {
        const level: LogLevel = (process.env.LOG as LogLevel) || 'warn';
        this.logger = winston.createLogger({
            level,
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.printf((info) => info.message)
            ),
            transports: new winston.transports.Console(),
        });
    }

    error(message: string, context: ParserContext, ...meta: any[]) {
        this.logger.error(getErrorMessageWithContext(message, context), meta);
    }

    warning(message: string, context: ParserContext, ...meta: any[]) {
        this.logger.warn(getErrorMessageWithContext(message, context), meta);
    }

    info(message: string, context: ParserContext, ...meta: any[]) {
        this.logger.info(getErrorMessageWithContext(message, context), meta);
    }

    verbose(message: string, context: ParserContext, ...meta: any[]) {
        this.logger.verbose(getErrorMessageWithContext(message, context), meta);
    }
}

export default new Logger();
