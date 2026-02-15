
/**
 * Structured logging service using Pino.
 * 
 * Provides structured, searchable logs with context (user ID, operation, etc.)
 * Replaces console.* calls throughout services for better observability.
 */

import pino from 'pino';

// Create logger instance
// In development: pretty print to console
// In production: JSON output for log aggregation
const isDev = import.meta.env.DEV;

export const logger = pino({
  level: isDev ? 'debug' : 'info',
  transport: isDev
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss.l',
          ignore: 'pid,hostname'
        }
      }
    : undefined,
  base: {
    env: import.meta.env.MODE,
    timestamp: Date.now()
  }
});

/**
 * Log enrichment operations with entity context
 */
export function logEnrichment(level: 'info' | 'warn' | 'error', message: string, context?: {
  entityId?: string;
  entityName?: string;
  stage?: string;
  duration?: number;
  error?: any;
}) {
  const logData = {
    operation: 'enrichment',
    ...context
  };

  if (level === 'error' && context?.error) {
    logger.error({ ...logData, err: context.error }, message);
  } else {
    logger[level](logData, message);
  }
}

/**
 * Log AI API calls with cost tracking context
 */
export function logAICall(level: 'info' | 'warn' | 'error', message: string, context?: {
  model?: string;
  operation?: string;
  duration?: number;
  tokens?: { input?: number; output?: number };
  cost?: number;
  error?: any;
}) {
  const logData = {
    operation: 'ai_call',
    ...context
  };

  if (level === 'error' && context?.error) {
    logger.error({ ...logData, err: context.error }, message);
  } else {
    logger[level](logData, message);
  }
}

/**
 * Log cache operations
 */
export function logCache(level: 'info' | 'debug', message: string, context?: {
  cacheType?: 'intent' | 'species' | 'vision';
  key?: string;
  hit?: boolean;
  size?: number;
}) {
  logger[level]({
    operation: 'cache',
    ...context
  }, message);
}

/**
 * Log Firestore operations
 */
export function logFirestore(level: 'info' | 'warn' | 'error', message: string, context?: {
  operation?: 'read' | 'write' | 'delete' | 'sync';
  collection?: string;
  documentId?: string;
  error?: any;
}) {
  const logData = {
    operation: 'firestore',
    ...context
  };

  if (level === 'error' && context?.error) {
    logger.error({ ...logData, err: context.error }, message);
  } else {
    logger[level](logData, message);
  }
}

/**
 * Log voice/vision operations
 */
export function logVoiceVision(level: 'info' | 'warn' | 'error', message: string, context?: {
  type?: 'voice' | 'vision';
  operation?: string;
  duration?: number;
  error?: any;
}) {
  const logData = {
    operation: context?.type || 'voice_vision',
    ...context
  };

  if (level === 'error' && context?.error) {
    logger.error({ ...logData, err: context.error }, message);
  } else {
    logger[level](logData, message);
  }
}
