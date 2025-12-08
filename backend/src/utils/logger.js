/**
 * Logging Utility
 * Winston-based logger với multiple transports
 */

const winston = require('winston');
const path = require('path');

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define log colors
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue',
};

winston.addColors(colors);

// Determine log level based on environment
const level = () => {
  const env = process.env.NODE_ENV || 'development';
  const isDevelopment = env === 'development';
  return isDevelopment ? 'debug' : 'info';
};

// Define log format
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.printf((info) => {
    const { timestamp, level, message, stack, ...meta } = info;
    
    let log = `${timestamp} [${level.toUpperCase()}]: ${message}`;
    
    // Add metadata if present
    if (Object.keys(meta).length > 0) {
      log += `\n${JSON.stringify(meta, null, 2)}`;
    }
    
    // Add stack trace for errors
    if (stack) {
      log += `\n${stack}`;
    }
    
    return log;
  })
);

// Define console format (with colors)
const consoleFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf((info) => {
    const { timestamp, level, message } = info;
    return `${timestamp} [${level}]: ${message}`;
  })
);

// Create transports
const transports = [
  // Console transport
  new winston.transports.Console({
    format: consoleFormat,
  }),
  
  // Error log file
  new winston.transports.File({
    filename: path.join('logs', 'error.log'),
    level: 'error',
    format,
  }),
  
  // Combined log file
  new winston.transports.File({
    filename: path.join('logs', 'combined.log'),
    format,
  }),
];

// Create logger instance
const logger = winston.createLogger({
  level: level(),
  levels,
  format,
  transports,
  exceptionHandlers: [
    new winston.transports.File({ 
      filename: path.join('logs', 'exceptions.log') 
    }),
  ],
  rejectionHandlers: [
    new winston.transports.File({ 
      filename: path.join('logs', 'rejections.log') 
    }),
  ],
  exitOnError: false,
});

/**
 * Stream for Morgan HTTP logger
 */
logger.stream = {
  write: (message) => {
    logger.http(message.trim());
  },
};

/**
 * Log request middleware
 */
const logRequest = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const log = {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('user-agent'),
    };
    
    if (res.statusCode >= 400) {
      logger.warn('Request failed', log);
    } else {
      logger.http('Request completed', log);
    }
  });
  
  next();
};

/**
 * Log error middleware
 */
const logError = (err, req, res, next) => {
  logger.error('Error occurred', {
    message: err.message,
    stack: err.stack,
    method: req.method,
    url: req.url,
    body: req.body,
    params: req.params,
    query: req.query,
    ip: req.ip || req.connection.remoteAddress,
  });
  
  next(err);
};

/**
 * Structured logging helpers
 */
const loggers = {
  // Authentication logs
  auth: {
    login: (userId, success, details = {}) => {
      logger.info('Authentication attempt', {
        event: 'login',
        userId,
        success,
        ...details,
      });
    },
    
    logout: (userId) => {
      logger.info('User logged out', {
        event: 'logout',
        userId,
      });
    },
    
    tokenRefresh: (userId) => {
      logger.info('Token refreshed', {
        event: 'token_refresh',
        userId,
      });
    },
  },
  
  // Cart operation logs
  cart: {
    addItem: (userId, productId, quantity) => {
      logger.info('Item added to cart', {
        event: 'cart_add',
        userId,
        productId,
        quantity,
      });
    },
    
    removeItem: (userId, itemId) => {
      logger.info('Item removed from cart', {
        event: 'cart_remove',
        userId,
        itemId,
      });
    },
    
    updateQuantity: (userId, itemId, quantity) => {
      logger.info('Cart quantity updated', {
        event: 'cart_update',
        userId,
        itemId,
        quantity,
      });
    },
    
    checkout: (userId, orderId, total) => {
      logger.info('Checkout completed', {
        event: 'checkout',
        userId,
        orderId,
        total,
      });
    },
  },
  
  // Discount logs
  discount: {
    applied: (userId, code, percentage) => {
      logger.info('Discount code applied', {
        event: 'discount_applied',
        userId,
        code,
        percentage,
      });
    },
    
    failed: (userId, code, reason) => {
      logger.warn('Discount code failed', {
        event: 'discount_failed',
        userId,
        code,
        reason,
      });
    },
  },
  
  // Security logs
  security: {
    rateLimitExceeded: (identifier, endpoint) => {
      logger.warn('Rate limit exceeded', {
        event: 'rate_limit',
        identifier,
        endpoint,
      });
    },
    
    invalidToken: (token) => {
      logger.warn('Invalid token attempt', {
        event: 'invalid_token',
        token: token ? token.substring(0, 10) + '...' : 'null',
      });
    },
    
    suspiciousActivity: (details) => {
      logger.error('Suspicious activity detected', {
        event: 'suspicious_activity',
        ...details,
      });
    },
  },
  
  // Database logs
  database: {
    queryError: (query, error) => {
      logger.error('Database query failed', {
        event: 'db_error',
        query,
        error: error.message,
      });
    },
    
    connectionError: (error) => {
      logger.error('Database connection failed', {
        event: 'db_connection_error',
        error: error.message,
      });
    },
  },
  
  // Performance logs
  performance: {
    slowQuery: (query, duration) => {
      logger.warn('Slow query detected', {
        event: 'slow_query',
        query,
        duration: `${duration}ms`,
      });
    },
    
    highMemory: (usage) => {
      logger.warn('High memory usage', {
        event: 'high_memory',
        usage,
      });
    },
  },
};

/**
 * Create child logger with default metadata
 */
const createChildLogger = (defaultMeta) => {
  return logger.child(defaultMeta);
};

/**
 * Log application startup
 */
const logStartup = (port, environment) => {
  logger.info('Application started', {
    event: 'startup',
    port,
    environment,
    nodeVersion: process.version,
    platform: process.platform,
  });
};

/**
 * Log application shutdown
 */
const logShutdown = (reason) => {
  logger.info('Application shutting down', {
    event: 'shutdown',
    reason,
  });
};

/**
 * Development helper - pretty print objects
 */
const dev = (label, data) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`\n=== ${label} ===`);
    console.log(JSON.stringify(data, null, 2));
    console.log('=================\n');
  }
};

module.exports = {
  logger,
  logRequest,
  logError,
  loggers,
  createChildLogger,
  logStartup,
  logShutdown,
  dev,
};