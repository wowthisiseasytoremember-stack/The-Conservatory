
/**
 * Cost tracking service for AI API calls.
 * 
 * Tracks token usage and estimated costs for Gemini API calls,
 * storing them in Firestore for monitoring and analysis.
 */

import { collection, addDoc, serverTimestamp, query, orderBy, limit, getDocs } from './firebase';
import { db } from './firebase';
import { logger } from './logger';

export interface CostRecord {
  id?: string;
  timestamp: Date;
  model: string;
  operation: string;
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
  estimatedCost: number; // USD
  duration?: number; // milliseconds
  success: boolean;
  error?: string;
}

/**
 * Gemini pricing (as of 2024, approximate - update as needed)
 * Prices per 1M tokens
 */
const GEMINI_PRICING: Record<string, { input: number; output: number }> = {
  'gemini-flash-lite-latest': { input: 0.075, output: 0.30 }, // $0.075/$0.30 per 1M tokens
  'gemini-pro-latest': { input: 0.50, output: 1.50 }, // $0.50/$1.50 per 1M tokens
  'gemini-1.5-pro-latest': { input: 1.25, output: 5.00 }, // $1.25/$5.00 per 1M tokens
  'gemini-pro': { input: 0.50, output: 1.50 }, // Legacy pricing
  'gemini-1.5-flash-latest': { input: 0.075, output: 0.30 },
  'gemini-1.5-pro': { input: 1.25, output: 5.00 },
};

/**
 * Calculate estimated cost for a Gemini API call
 */
export function calculateCost(
  model: string,
  inputTokens?: number,
  outputTokens?: number
): number {
  const pricing = GEMINI_PRICING[model] || GEMINI_PRICING['gemini-pro-latest'];
  
  const inputCost = inputTokens ? (inputTokens / 1_000_000) * pricing.input : 0;
  const outputCost = outputTokens ? (outputTokens / 1_000_000) * pricing.output : 0;
  
  return inputCost + outputCost;
}

/**
 * Track an AI API call cost
 */
export async function trackCost(record: Omit<CostRecord, 'id' | 'timestamp'>): Promise<void> {
  try {
    // Only track in production or if explicitly enabled
    const isDev = (import.meta as any).env?.DEV || process.env.NODE_ENV === 'development' || process.env.DEV === 'true';
    const isEnabled = (import.meta as any).env?.VITE_ENABLE_COST_TRACKING === 'true' || process.env.VITE_ENABLE_COST_TRACKING === 'true';
    
    if (isDev && !isEnabled) {
      logger.debug({ ...record }, 'Cost tracking skipped (dev mode)');
      return;
    }
    



    const costRecord: Omit<CostRecord, 'id'> = {
      ...record,
      timestamp: new Date(),
    };

    await addDoc(collection(db, 'cost_tracking'), {
      ...costRecord,
      timestamp: serverTimestamp(),
    });

    logger.info({
      model: record.model,
      operation: record.operation,
      cost: record.estimatedCost,
      tokens: record.totalTokens
    }, 'Cost tracked');
  } catch (error: any) {
    // Non-fatal - don't break the app if cost tracking fails
    logger.warn({ err: error }, 'Failed to track cost');
  }
}

/**
 * Get cost summary for a time period
 */
export async function getCostSummary(
  startDate: Date,
  endDate: Date
): Promise<{
  totalCost: number;
  totalCalls: number;
  byModel: Record<string, { cost: number; calls: number }>;
  byOperation: Record<string, { cost: number; calls: number }>;
}> {
  try {
    const q = query(
      collection(db, 'cost_tracking'),
      orderBy('timestamp', 'desc')
      // Note: Firestore doesn't support date range queries directly
      // Would need to filter client-side or use a different approach
    );

    const snapshot = await getDocs(q);
    const records: CostRecord[] = [];
    
    snapshot.forEach(doc => {
      const data = doc.data();
      records.push({
        id: doc.id,
        ...data,
        timestamp: data.timestamp?.toDate() || new Date(),
      } as CostRecord);

    });

    // Filter by date range
    const filtered = records.filter(r => 
      r.timestamp >= startDate && r.timestamp <= endDate
    );

    const summary = {
      totalCost: 0,
      totalCalls: filtered.length,
      byModel: {} as Record<string, { cost: number; calls: number }>,
      byOperation: {} as Record<string, { cost: number; calls: number }>,
    };

    filtered.forEach(record => {
      summary.totalCost += record.estimatedCost;
      
      // By model
      if (!summary.byModel[record.model]) {
        summary.byModel[record.model] = { cost: 0, calls: 0 };
      }
      summary.byModel[record.model].cost += record.estimatedCost;
      summary.byModel[record.model].calls += 1;

      // By operation
      if (!summary.byOperation[record.operation]) {
        summary.byOperation[record.operation] = { cost: 0, calls: 0 };
      }
      summary.byOperation[record.operation].cost += record.estimatedCost;
      summary.byOperation[record.operation].calls += 1;
    });

    return summary;
  } catch (error: any) {
    logger.error({ err: error }, 'Failed to get cost summary');
    throw error;
  }
}
