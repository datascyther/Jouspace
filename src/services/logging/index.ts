const IS_DEV = __DEV__ || process.env.NODE_ENV === 'development';

export type LogDomain = 'journey' | 'auth' | 'sync' | 'mood' | 'profile' | 'navigation' | 'general';

export interface LogEntry {
  domain: LogDomain;
  level: 'info' | 'warn' | 'error';
  message: string;
  data?: Record<string, unknown>;
  timestamp: number;
}

export type LogTransport = (entry: LogEntry) => void;

class Logger {
  private transports: LogTransport[] = [];

  addTransport(transport: LogTransport): void {
    this.transports.push(transport);
  }

  private log(level: LogEntry['level'], domain: LogDomain, message: string, data?: Record<string, unknown>): void {
    const entry: LogEntry = { domain, level, message, data, timestamp: Date.now() };

    for (const transport of this.transports) {
      try {
        transport(entry);
      } catch {
        // never let logging throw
      }
    }
  }

  info(domain: LogDomain, message: string, data?: Record<string, unknown>): void {
    this.log('info', domain, message, data);
  }

  warn(domain: LogDomain, message: string, data?: Record<string, unknown>): void {
    this.log('warn', domain, message, data);
  }

  error(domain: LogDomain, message: string, data?: Record<string, unknown>): void {
    this.log('error', domain, message, data);
  }
}

const defaultTransport: LogTransport = (entry) => {
  const prefix = `[${entry.domain}]`;
  const payload = entry.data ? entry.data : '';

  switch (entry.level) {
    case 'error':
      console.error(prefix, entry.message, payload);
      break;
    case 'warn':
      console.warn(prefix, entry.message, payload);
      break;
    default:
      if (IS_DEV) {
        console.log(prefix, entry.message, payload);
      }
  }
};

export const logger = new Logger();
logger.addTransport(defaultTransport);

export default logger;
