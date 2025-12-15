import { db } from "../db";
import { rateLimitRecords } from "@shared/v0ToolsSchema";
import { sql } from "drizzle-orm";

// Rate limit configuration
const RATE_LIMIT_WINDOW = 12 * 60 * 60 * 1000; // 12 hours in milliseconds
const RATE_LIMIT_MAX_REQUESTS = 3;

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
  retryAfter?: number; // seconds until next available request
}

/**
 * Check if a request should be rate limited
 * Uses a sliding window algorithm with database storage
 * 
 * @param identifier - IP address or user ID to track
 * @param action - Type of action being rate limited (default: 'generation')
 * @returns RateLimitResult indicating if request is allowed
 */
export async function checkRateLimit(
  identifier: string,
  action: string = 'generation'
): Promise<RateLimitResult> {
  try {
    // Calculate the window start time
    const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW);

    // Clean up old records outside the window
    await db
      .delete(rateLimitRecords)
      .where(sql`${rateLimitRecords.timestamp} < ${windowStart} AND ${rateLimitRecords.identifier} = ${identifier} AND ${rateLimitRecords.action} = ${action}`);

    // Count requests in current window
    const recentRecords = await db
      .select()
      .from(rateLimitRecords)
      .where(
        sql`${rateLimitRecords.identifier} = ${identifier} 
        AND ${rateLimitRecords.action} = ${action} 
        AND ${rateLimitRecords.timestamp} >= ${windowStart}`
      );

    const requestCount = recentRecords.length;
    const remaining = Math.max(0, RATE_LIMIT_MAX_REQUESTS - requestCount);
    const allowed = requestCount < RATE_LIMIT_MAX_REQUESTS;

    // Calculate reset time based on oldest request in window
    let resetAt = new Date(Date.now() + RATE_LIMIT_WINDOW);
    let retryAfter: number | undefined;

    if (recentRecords.length > 0) {
      // Find the oldest request
      const oldestRequest = recentRecords.reduce((oldest, record) => {
        return record.timestamp < oldest.timestamp ? record : oldest;
      });
      
      // Reset time is when the oldest request expires from the window
      resetAt = new Date(oldestRequest.timestamp.getTime() + RATE_LIMIT_WINDOW);
      
      if (!allowed) {
        retryAfter = Math.ceil((resetAt.getTime() - Date.now()) / 1000);
      }
    }

    // If allowed, record this request
    if (allowed) {
      await db.insert(rateLimitRecords).values({
        identifier,
        action,
        timestamp: new Date(),
        metadata: {}
      });
    }

    return {
      allowed,
      remaining: allowed ? remaining - 1 : remaining,
      resetAt,
      retryAfter
    };
  } catch (error) {
    // Fail open: if rate limiting fails, allow the request
    console.error('Rate limiting error:', error);
    return {
      allowed: true,
      remaining: RATE_LIMIT_MAX_REQUESTS,
      resetAt: new Date(Date.now() + RATE_LIMIT_WINDOW)
    };
  }
}

/**
 * Get rate limit status without consuming a request
 * 
 * @param identifier - IP address or user ID to check
 * @param action - Type of action being checked (default: 'generation')
 * @returns RateLimitResult with current status
 */
export async function getRateLimitStatus(
  identifier: string,
  action: string = 'generation'
): Promise<RateLimitResult> {
  try {
    const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW);

    // Count requests in current window
    const recentRecords = await db
      .select()
      .from(rateLimitRecords)
      .where(
        sql`${rateLimitRecords.identifier} = ${identifier} 
        AND ${rateLimitRecords.action} = ${action} 
        AND ${rateLimitRecords.timestamp} >= ${windowStart}`
      );

    const requestCount = recentRecords.length;
    const remaining = Math.max(0, RATE_LIMIT_MAX_REQUESTS - requestCount);
    const allowed = requestCount < RATE_LIMIT_MAX_REQUESTS;

    let resetAt = new Date(Date.now() + RATE_LIMIT_WINDOW);
    let retryAfter: number | undefined;

    if (recentRecords.length > 0) {
      const oldestRequest = recentRecords.reduce((oldest, record) => {
        return record.timestamp < oldest.timestamp ? record : oldest;
      });
      
      resetAt = new Date(oldestRequest.timestamp.getTime() + RATE_LIMIT_WINDOW);
      
      if (!allowed) {
        retryAfter = Math.ceil((resetAt.getTime() - Date.now()) / 1000);
      }
    }

    return {
      allowed,
      remaining,
      resetAt,
      retryAfter
    };
  } catch (error) {
    console.error('Rate limit status check error:', error);
    return {
      allowed: true,
      remaining: RATE_LIMIT_MAX_REQUESTS,
      resetAt: new Date(Date.now() + RATE_LIMIT_WINDOW)
    };
  }
}
