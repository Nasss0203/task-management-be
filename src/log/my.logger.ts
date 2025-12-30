import { LoggerService, LogLevel } from '@nestjs/common';
import chalk from 'chalk';
import dayjs from 'dayjs';
import { createLogger, format, Logger, transports } from 'winston';

const today = new Date();
const dateStr = today.toISOString().split('T')[0];

export class MyLogger implements LoggerService {
  private logger: Logger;

  constructor() {
    this.logger = createLogger({
      level: 'debug',
      transports: [
        new transports.Console({
          format: format.combine(
            format.colorize(),
            format.printf(({ context, message, level, time }) => {
              const strApp = chalk.green('[NEST-MY-APP]');
              const strContext = chalk.yellow(`[${context}]`);
              return `${strApp} - ${time} - ${level} - ${strContext} - ${message}`;
            }),
          ),
        }),

        new transports.File({
          format: format.combine(format.timestamp(), format.json()),
          dirname: 'log',
          filename: `log-${dateStr}.dev.log`,
        }),
      ],
    });
  }

  log(message: string, context: string) {
    const time = dayjs(Date.now()).format('DD/MM/YYYY HH:mm:ss');
    this.logger.log('info', message, { context, time });
  }
  error(message: string, context: string) {
    const time = dayjs(Date.now()).format('DD/MM/YYYY HH:mm:ss');
    this.logger.log('info', message, { context, time });
  }
  warn(message: string, context: string) {
    const time = dayjs(Date.now()).format('DD/MM/YYYY HH:mm:ss');
    this.logger.log('warn', message, { context, time });
  }
  debug?(message: string, context: string) {
    const time = dayjs(Date.now()).format('DD/MM/YYYY HH:mm:ss');
    this.logger.log('debug', message, { context, time });
  }
  verbose?(message: string, context: string) {
    const time = dayjs(Date.now()).format('DD/MM/YYYY HH:mm:ss');
    this.logger.log('verbose', message, { context, time });
  }
  fatal?(message: string, context: string) {
    const time = dayjs(Date.now()).format('DD/MM/YYYY HH:mm:ss');
    this.logger.log('fatal', message, { context, time });
  }
  setLogLevels?(levels: LogLevel[]) {}
}
