import * as winston from 'winston'
type LogLevel = 'verbose' | 'info' | 'warning' | 'error'

class Logger {
    logger: winston.Logger

    constructor() {
        const level: LogLevel = (process.env.LOG as LogLevel) || 'warning'
        this.logger = winston.createLogger({
            level,
            transports: new winston.transports.Console()
        });
    }

    error(message: string, ...meta: any[]) {
        this.logger.error(message, meta)
    }

    warning(message: string, ...meta: any[]) {
        this.logger.warn(message, meta)
    }

    info(message: string, ...meta: any[]) {
        this.logger.info(message, meta)
    }

    verbose(message: string, ...meta: any[]) {
        this.logger.verbose(message, meta)
    }
}

export default new Logger()
