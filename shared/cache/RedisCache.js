const Redis = require('ioredis');
const winston = require('winston');

class RedisCache {
  constructor(config = {}) {
    this.config = {
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      ...config,
    };

    this.client = new Redis(this.config);
    this.subscriber = new Redis(this.config);
    this.publisher = new Redis(this.config);

    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.json(),
      defaultMeta: { service: 'redis-cache' },
      transports: [
        new winston.transports.Console({
          format: winston.format.simple(),
        }),
      ],
    });

    this.setupEventHandlers();
    this.cacheStats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      errors: 0,
    };
  }

  setupEventHandlers() {
    this.client.on('connect', () => {
      this.logger.info('Redis client connected');
    });

    this.client.on('error', (err) => {
      this.logger.error('Redis client error:', err);
      this.cacheStats.errors++;
    });

    this.client.on('ready', () => {
      this.logger.info('Redis client ready');
    });

    this.subscriber.on('message', (channel, message) => {
      this.handleCacheInvalidation(channel, message);
    });
  }

  // Basic cache operations
  async get(key) {
    try {
      const value = await this.client.get(key);
      if (value) {
        this.cacheStats.hits++;
        return JSON.parse(value);
      }
      this.cacheStats.misses++;
      return null;
    } catch (error) {
      this.logger.error(`Error getting key ${key}:`, error);
      this.cacheStats.errors++;
      return null;
    }
  }

  async set(key, value, ttl = 3600) {
    try {
      const serialized = JSON.stringify(value);
      if (ttl) {
        await this.client.setex(key, ttl, serialized);
      } else {
        await this.client.set(key, serialized);
      }
      this.cacheStats.sets++;
      return true;
    } catch (error) {
      this.logger.error(`Error setting key ${key}:`, error);
      this.cacheStats.errors++;
      return false;
    }
  }

  async del(key) {
    try {
      await this.client.del(key);
      this.cacheStats.deletes++;
      return true;
    } catch (error) {
      this.logger.error(`Error deleting key ${key}:`, error);
      this.cacheStats.errors++;
      return false;
    }
  }

  // Batch operations
  async mget(keys) {
    try {
      const values = await this.client.mget(keys);
      return values.map(value => value ? JSON.parse(value) : null);
    } catch (error) {
      this.logger.error('Error in mget:', error);
      return keys.map(() => null);
    }
  }

  async mset(keyValuePairs, ttl = 3600) {
    try {
      const pipeline = this.client.pipeline();
      
      for (const [key, value] of Object.entries(keyValuePairs)) {
        const serialized = JSON.stringify(value);
        if (ttl) {
          pipeline.setex(key, ttl, serialized);
        } else {
          pipeline.set(key, serialized);
        }
      }
      
      await pipeline.exec();
      this.cacheStats.sets += Object.keys(keyValuePairs).length;
      return true;
    } catch (error) {
      this.logger.error('Error in mset:', error);
      return false;
    }
  }

  // Pattern-based operations
  async delPattern(pattern) {
    try {
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(...keys);
        this.cacheStats.deletes += keys.length;
      }
      return keys.length;
    } catch (error) {
      this.logger.error(`Error deleting pattern ${pattern}:`, error);
      return 0;
    }
  }

  // Cache aside pattern with callback
  async getOrSet(key, fetchCallback, ttl = 3600) {
    try {
      // Try to get from cache
      const cached = await this.get(key);
      if (cached !== null) {
        return cached;
      }

      // Fetch from source
      const value = await fetchCallback();
      
      // Store in cache
      if (value !== null && value !== undefined) {
        await this.set(key, value, ttl);
      }
      
      return value;
    } catch (error) {
      this.logger.error(`Error in getOrSet for key ${key}:`, error);
      throw error;
    }
  }

  // List operations for feeds
  async lpush(key, ...values) {
    try {
      const serialized = values.map(v => JSON.stringify(v));
      return await this.client.lpush(key, ...serialized);
    } catch (error) {
      this.logger.error(`Error in lpush for key ${key}:`, error);
      return 0;
    }
  }

  async lrange(key, start, stop) {
    try {
      const values = await this.client.lrange(key, start, stop);
      return values.map(v => JSON.parse(v));
    } catch (error) {
      this.logger.error(`Error in lrange for key ${key}:`, error);
      return [];
    }
  }

  async ltrim(key, start, stop) {
    try {
      return await this.client.ltrim(key, start, stop);
    } catch (error) {
      this.logger.error(`Error in ltrim for key ${key}:`, error);
      return false;
    }
  }

  // Set operations for unique collections
  async sadd(key, ...members) {
    try {
      return await this.client.sadd(key, ...members);
    } catch (error) {
      this.logger.error(`Error in sadd for key ${key}:`, error);
      return 0;
    }
  }

  async smembers(key) {
    try {
      return await this.client.smembers(key);
    } catch (error) {
      this.logger.error(`Error in smembers for key ${key}:`, error);
      return [];
    }
  }

  async sismember(key, member) {
    try {
      return await this.client.sismember(key, member) === 1;
    } catch (error) {
      this.logger.error(`Error in sismember for key ${key}:`, error);
      return false;
    }
  }

  // Sorted set operations for rankings
  async zadd(key, score, member) {
    try {
      return await this.client.zadd(key, score, member);
    } catch (error) {
      this.logger.error(`Error in zadd for key ${key}:`, error);
      return 0;
    }
  }

  async zrange(key, start, stop, withScores = false) {
    try {
      if (withScores) {
        return await this.client.zrange(key, start, stop, 'WITHSCORES');
      }
      return await this.client.zrange(key, start, stop);
    } catch (error) {
      this.logger.error(`Error in zrange for key ${key}:`, error);
      return [];
    }
  }

  async zrevrange(key, start, stop, withScores = false) {
    try {
      if (withScores) {
        return await this.client.zrevrange(key, start, stop, 'WITHSCORES');
      }
      return await this.client.zrevrange(key, start, stop);
    } catch (error) {
      this.logger.error(`Error in zrevrange for key ${key}:`, error);
      return [];
    }
  }

  async zincrby(key, increment, member) {
    try {
      return await this.client.zincrby(key, increment, member);
    } catch (error) {
      this.logger.error(`Error in zincrby for key ${key}:`, error);
      return 0;
    }
  }

  // Hash operations for objects
  async hset(key, field, value) {
    try {
      const serialized = JSON.stringify(value);
      return await this.client.hset(key, field, serialized);
    } catch (error) {
      this.logger.error(`Error in hset for key ${key}:`, error);
      return 0;
    }
  }

  async hget(key, field) {
    try {
      const value = await this.client.hget(key, field);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      this.logger.error(`Error in hget for key ${key}:`, error);
      return null;
    }
  }

  async hgetall(key) {
    try {
      const hash = await this.client.hgetall(key);
      const result = {};
      for (const [field, value] of Object.entries(hash)) {
        result[field] = JSON.parse(value);
      }
      return result;
    } catch (error) {
      this.logger.error(`Error in hgetall for key ${key}:`, error);
      return {};
    }
  }

  async hincrby(key, field, increment) {
    try {
      return await this.client.hincrby(key, field, increment);
    } catch (error) {
      this.logger.error(`Error in hincrby for key ${key}:`, error);
      return 0;
    }
  }

  // Pub/Sub for cache invalidation
  async publish(channel, message) {
    try {
      return await this.publisher.publish(channel, JSON.stringify(message));
    } catch (error) {
      this.logger.error(`Error publishing to channel ${channel}:`, error);
      return 0;
    }
  }

  async subscribe(channel, callback) {
    try {
      await this.subscriber.subscribe(channel);
      this.subscriber.on('message', (ch, message) => {
        if (ch === channel) {
          callback(JSON.parse(message));
        }
      });
      return true;
    } catch (error) {
      this.logger.error(`Error subscribing to channel ${channel}:`, error);
      return false;
    }
  }

  // Cache invalidation
  async invalidate(keys) {
    try {
      if (Array.isArray(keys)) {
        await this.client.del(...keys);
      } else {
        await this.client.del(keys);
      }
      
      // Publish invalidation event
      await this.publish('cache:invalidation', { keys });
      
      return true;
    } catch (error) {
      this.logger.error('Error invalidating cache:', error);
      return false;
    }
  }

  handleCacheInvalidation(channel, message) {
    try {
      const data = JSON.parse(message);
      this.logger.info(`Cache invalidation received:`, data);
      // Handle distributed cache invalidation
    } catch (error) {
      this.logger.error('Error handling cache invalidation:', error);
    }
  }

  // Atomic operations
  async incr(key) {
    try {
      return await this.client.incr(key);
    } catch (error) {
      this.logger.error(`Error incrementing key ${key}:`, error);
      return 0;
    }
  }

  async decr(key) {
    try {
      return await this.client.decr(key);
    } catch (error) {
      this.logger.error(`Error decrementing key ${key}:`, error);
      return 0;
    }
  }

  // Expiration management
  async expire(key, seconds) {
    try {
      return await this.client.expire(key, seconds);
    } catch (error) {
      this.logger.error(`Error setting expiration for key ${key}:`, error);
      return false;
    }
  }

  async ttl(key) {
    try {
      return await this.client.ttl(key);
    } catch (error) {
      this.logger.error(`Error getting TTL for key ${key}:`, error);
      return -1;
    }
  }

  // Lock mechanism for distributed systems
  async acquireLock(lockKey, ttl = 10) {
    try {
      const lockId = Math.random().toString(36).substring(7);
      const result = await this.client.set(
        `lock:${lockKey}`,
        lockId,
        'EX', ttl,
        'NX'
      );
      
      return result === 'OK' ? lockId : null;
    } catch (error) {
      this.logger.error(`Error acquiring lock for ${lockKey}:`, error);
      return null;
    }
  }

  async releaseLock(lockKey, lockId) {
    try {
      const script = `
        if redis.call("get", KEYS[1]) == ARGV[1] then
          return redis.call("del", KEYS[1])
        else
          return 0
        end
      `;
      
      const result = await this.client.eval(script, 1, `lock:${lockKey}`, lockId);
      return result === 1;
    } catch (error) {
      this.logger.error(`Error releasing lock for ${lockKey}:`, error);
      return false;
    }
  }

  // Statistics
  getStats() {
    const total = this.cacheStats.hits + this.cacheStats.misses;
    const hitRate = total > 0 ? (this.cacheStats.hits / total) * 100 : 0;
    
    return {
      ...this.cacheStats,
      hitRate: hitRate.toFixed(2) + '%',
      totalRequests: total,
    };
  }

  resetStats() {
    this.cacheStats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      errors: 0,
    };
  }

  // Cleanup
  async disconnect() {
    await this.client.quit();
    await this.subscriber.quit();
    await this.publisher.quit();
    this.logger.info('Redis connections closed');
  }
}

module.exports = RedisCache;