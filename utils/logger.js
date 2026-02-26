const fs = require('fs');
const path = require('path');

const LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3
};

const currentLevel = process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug');
const threshold = LEVELS[currentLevel] ?? LEVELS.info;
const shouldLogToFile = process.env.LOG_TO_FILE !== 'false';

const logDir = path.join(__dirname, '..', 'logs');
const logFile = path.join(logDir, 'app.log');

const serialize = (value) => {
  if (value === undefined || value === null) return null;
  if (value instanceof Error) {
    return {
      name: value.name,
      message: value.message,
      stack: value.stack
    };
  }
  return value;
};

const write = (level, message, meta) => {
  if ((LEVELS[level] ?? LEVELS.info) > threshold) return;

  const entry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...(meta ? { meta: serialize(meta) } : {})
  };

  if (level === 'error') {
    console.error(`[${entry.timestamp}] ${entry.level.toUpperCase()} ${entry.message}`, meta || '');
  } else if (level === 'warn') {
    console.warn(`[${entry.timestamp}] ${entry.level.toUpperCase()} ${entry.message}`, meta || '');
  } else {
    console.log(`[${entry.timestamp}] ${entry.level.toUpperCase()} ${entry.message}`, meta || '');
  }

  if (!shouldLogToFile) return;

  try {
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    fs.appendFileSync(logFile, `${JSON.stringify(entry)}\n`, { encoding: 'utf8' });
  } catch {
    // Avoid recursive logging loops if file writes fail.
  }
};

module.exports = {
  logger: {
    error: (message, meta) => write('error', message, meta),
    warn: (message, meta) => write('warn', message, meta),
    info: (message, meta) => write('info', message, meta),
    debug: (message, meta) => write('debug', message, meta)
  }
};
