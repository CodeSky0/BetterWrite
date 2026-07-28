/**
 * Distributed Session Management
 * Supports session persistence across multiple instances using Redis
 */

import type { CacheManager } from '../cache';

export interface SessionData {
  userId: string;
  role: string;
  schoolId?: string;
  classId?: string;
  createdAt: Date;
  lastAccessed: Date;
  data: Record<string, any>;
}

export class SessionManager {
  private cache: CacheManager;
  private sessionTTL: number; // in seconds

  constructor(cache: CacheManager, sessionTTL = 3600) {
    this.cache = cache;
    this.sessionTTL = sessionTTL;
  }

  async createSession(sessionId: string, data: SessionData): Promise<void> {
    const sessionKey = this.getSessionKey(sessionId);
    await this.cache.set(sessionKey, JSON.stringify(data), { ttl: this.sessionTTL });
  }

  async getSession(sessionId: string): Promise<SessionData | null> {
    const sessionKey = this.getSessionKey(sessionId);
    const sessionData = await this.cache.get<string>(sessionKey);

    if (!sessionData) {
      return null;
    }

    try {
      const parsed = JSON.parse(sessionData) as SessionData;

      // Update last accessed time
      parsed.lastAccessed = new Date();
      await this.cache.set(sessionKey, JSON.stringify(parsed), { ttl: this.sessionTTL });

      return parsed;
    } catch (_error) {
      return null;
    }
  }

  async updateSession(sessionId: string, updates: Partial<SessionData>): Promise<void> {
    const current = await this.getSession(sessionId);
    if (!current) {
      throw new Error('Session not found');
    }

    const updated = { ...current, ...updates };
    await this.createSession(sessionId, updated);
  }

  async deleteSession(sessionId: string): Promise<void> {
    const sessionKey = this.getSessionKey(sessionId);
    await this.cache.delete(sessionKey);
  }

  async refreshSession(sessionId: string): Promise<void> {
    const sessionKey = this.getSessionKey(sessionId);
    await this.cache.expire(sessionKey, this.sessionTTL);
  }

  async getUserSessions(_userId: string): Promise<string[]> {
    // In a real implementation, this would use Redis SCAN to find all session keys for a user
    // For now, return empty array
    return [];
  }

  async deleteUserSessions(userId: string): Promise<void> {
    const sessionIds = await this.getUserSessions(userId);
    await Promise.all(sessionIds.map((id) => this.deleteSession(id)));
  }

  private getSessionKey(sessionId: string): string {
    return `session:${sessionId}`;
  }

  async getSessionStats(): Promise<{
    totalSessions: number;
    activeSessions: number;
  }> {
    // In a real implementation, this would use Redis INFO or SCAN
    return {
      totalSessions: 0,
      activeSessions: 0,
    };
  }
}
