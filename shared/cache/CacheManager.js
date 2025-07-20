const RedisCache = require('./RedisCache');

class CacheManager {
  constructor() {
    this.redis = new RedisCache();
    this.ttls = {
      user: 300, // 5 minutes
      video: 3600, // 1 hour
      feed: 60, // 1 minute
      trending: 300, // 5 minutes
      recommendation: 180, // 3 minutes
      analytics: 600, // 10 minutes
      session: 1800, // 30 minutes
    };
  }

  // User cache methods
  async getUserById(userId) {
    return this.redis.get(`user:${userId}`);
  }

  async setUser(userId, userData) {
    return this.redis.set(`user:${userId}`, userData, this.ttls.user);
  }

  async invalidateUser(userId) {
    return this.redis.del(`user:${userId}`);
  }

  // Video cache methods
  async getVideo(videoId) {
    return this.redis.get(`video:${videoId}`);
  }

  async setVideo(videoId, videoData) {
    return this.redis.set(`video:${videoId}`, videoData, this.ttls.video);
  }

  async getVideoBatch(videoIds) {
    const keys = videoIds.map(id => `video:${id}`);
    return this.redis.mget(keys);
  }

  async setVideoBatch(videos) {
    const keyValuePairs = {};
    videos.forEach(video => {
      keyValuePairs[`video:${video._id}`] = video;
    });
    return this.redis.mset(keyValuePairs, this.ttls.video);
  }

  async invalidateVideo(videoId) {
    return this.redis.del(`video:${videoId}`);
  }

  // Feed cache methods
  async getUserFeed(userId, page = 1, limit = 10) {
    const start = (page - 1) * limit;
    const stop = start + limit - 1;
    return this.redis.lrange(`feed:${userId}`, start, stop);
  }

  async setUserFeed(userId, videos) {
    const key = `feed:${userId}`;
    await this.redis.del(key);
    if (videos.length > 0) {
      await this.redis.lpush(key, ...videos.reverse());
      await this.redis.expire(key, this.ttls.feed);
    }
    return true;
  }

  async appendToUserFeed(userId, videos) {
    const key = `feed:${userId}`;
    if (videos.length > 0) {
      await this.redis.lpush(key, ...videos.reverse());
      // Keep only the latest 100 videos
      await this.redis.ltrim(key, 0, 99);
      await this.redis.expire(key, this.ttls.feed);
    }
    return true;
  }

  // Trending cache methods
  async getTrending(category = 'all', limit = 50) {
    return this.redis.zrevrange(`trending:${category}`, 0, limit - 1, true);
  }

  async updateTrendingScore(videoId, category = 'all', score) {
    return this.redis.zadd(`trending:${category}`, score, videoId);
  }

  async getTrendingVideos(category = 'all', limit = 50) {
    const videoIds = await this.redis.zrevrange(`trending:${category}`, 0, limit - 1);
    if (videoIds.length === 0) return [];
    
    const videos = await this.getVideoBatch(videoIds);
    return videos.filter(v => v !== null);
  }

  // Recommendation cache methods
  async getUserRecommendations(userId, page = 1, limit = 20) {
    const key = `recommendations:${userId}`;
    const start = (page - 1) * limit;
    const stop = start + limit - 1;
    return this.redis.lrange(key, start, stop);
  }

  async setUserRecommendations(userId, videoIds) {
    const key = `recommendations:${userId}`;
    await this.redis.del(key);
    if (videoIds.length > 0) {
      await this.redis.lpush(key, ...videoIds.reverse());
      await this.redis.expire(key, this.ttls.recommendation);
    }
    return true;
  }

  // View history cache
  async addToViewHistory(userId, videoId) {
    const key = `history:${userId}`;
    await this.redis.zadd(key, Date.now(), videoId);
    // Keep only last 100 viewed videos
    await this.redis.zremrangebyrank(key, 0, -101);
    await this.redis.expire(key, 86400); // 24 hours
    return true;
  }

  async getViewHistory(userId, limit = 50) {
    const key = `history:${userId}`;
    return this.redis.zrevrange(key, 0, limit - 1);
  }

  async hasUserViewedVideo(userId, videoId) {
    const key = `history:${userId}`;
    const score = await this.redis.zscore(key, videoId);
    return score !== null;
  }

  // Like cache
  async addLike(userId, videoId) {
    const userKey = `likes:user:${userId}`;
    const videoKey = `likes:video:${videoId}`;
    
    await this.redis.sadd(userKey, videoId);
    await this.redis.sadd(videoKey, userId);
    await this.redis.hincrby('video:stats', videoId, 1);
    
    return true;
  }

  async removeLike(userId, videoId) {
    const userKey = `likes:user:${userId}`;
    const videoKey = `likes:video:${videoId}`;
    
    await this.redis.srem(userKey, videoId);
    await this.redis.srem(videoKey, userId);
    await this.redis.hincrby('video:stats', videoId, -1);
    
    return true;
  }

  async hasUserLikedVideo(userId, videoId) {
    const key = `likes:user:${userId}`;
    return this.redis.sismember(key, videoId);
  }

  async getVideoLikeCount(videoId) {
    const count = await this.redis.hget('video:stats', videoId);
    return count || 0;
  }

  // Analytics cache
  async incrementVideoView(videoId) {
    const dayKey = `views:${new Date().toISOString().split('T')[0]}`;
    await this.redis.hincrby(dayKey, videoId, 1);
    await this.redis.expire(dayKey, 86400 * 7); // Keep for 7 days
    
    // Update total views
    await this.redis.hincrby('video:views:total', videoId, 1);
    
    return true;
  }

  async getVideoViews(videoId) {
    const views = await this.redis.hget('video:views:total', videoId);
    return parseInt(views) || 0;
  }

  async getDailyViews(date) {
    const dayKey = `views:${date}`;
    return this.redis.hgetall(dayKey);
  }

  // Session cache
  async getSession(sessionId) {
    return this.redis.get(`session:${sessionId}`);
  }

  async setSession(sessionId, sessionData) {
    return this.redis.set(`session:${sessionId}`, sessionData, this.ttls.session);
  }

  async deleteSession(sessionId) {
    return this.redis.del(`session:${sessionId}`);
  }

  async extendSession(sessionId) {
    return this.redis.expire(`session:${sessionId}`, this.ttls.session);
  }

  // Search cache
  async getSearchResults(query, page = 1) {
    const key = `search:${query}:${page}`;
    return this.redis.get(key);
  }

  async setSearchResults(query, page, results) {
    const key = `search:${query}:${page}`;
    return this.redis.set(key, results, 300); // 5 minutes
  }

  // Hashtag cache
  async getTrendingHashtags(limit = 20) {
    return this.redis.zrevrange('hashtags:trending', 0, limit - 1, true);
  }

  async incrementHashtagScore(hashtag) {
    return this.redis.zincrby('hashtags:trending', 1, hashtag.toLowerCase());
  }

  async getHashtagVideos(hashtag, page = 1, limit = 20) {
    const key = `hashtag:videos:${hashtag.toLowerCase()}`;
    const start = (page - 1) * limit;
    const stop = start + limit - 1;
    return this.redis.lrange(key, start, stop);
  }

  async addVideoToHashtag(hashtag, videoId) {
    const key = `hashtag:videos:${hashtag.toLowerCase()}`;
    await this.redis.lpush(key, videoId);
    await this.redis.ltrim(key, 0, 999); // Keep latest 1000
    await this.redis.expire(key, 3600); // 1 hour
    return true;
  }

  // Rate limiting cache
  async checkRateLimit(identifier, limit, window) {
    const key = `ratelimit:${identifier}`;
    const count = await this.redis.incr(key);
    
    if (count === 1) {
      await this.redis.expire(key, window);
    }
    
    return {
      allowed: count <= limit,
      remaining: Math.max(0, limit - count),
      reset: await this.redis.ttl(key),
    };
  }

  // Notification cache
  async addNotification(userId, notification) {
    const key = `notifications:${userId}`;
    await this.redis.lpush(key, notification);
    await this.redis.ltrim(key, 0, 99); // Keep latest 100
    await this.redis.expire(key, 86400); // 24 hours
    return true;
  }

  async getNotifications(userId, limit = 20) {
    const key = `notifications:${userId}`;
    return this.redis.lrange(key, 0, limit - 1);
  }

  async markNotificationsRead(userId) {
    const key = `notifications:read:${userId}`;
    return this.redis.set(key, Date.now(), 86400);
  }

  // Cache warming
  async warmCache(type, data) {
    switch (type) {
      case 'trending':
        // Warm trending videos cache
        const trendingVideos = data.videos || [];
        await this.setVideoBatch(trendingVideos);
        break;
        
      case 'popular-users':
        // Warm popular users cache
        const users = data.users || [];
        for (const user of users) {
          await this.setUser(user._id, user);
        }
        break;
        
      case 'hashtags':
        // Warm hashtag cache
        const hashtags = data.hashtags || [];
        for (const tag of hashtags) {
          await this.incrementHashtagScore(tag.name);
        }
        break;
    }
  }

  // Cache statistics and monitoring
  async getCacheStats() {
    const stats = this.redis.getStats();
    const info = await this.redis.client.info();
    
    return {
      ...stats,
      memory: this.parseRedisInfo(info, 'used_memory_human'),
      connectedClients: this.parseRedisInfo(info, 'connected_clients'),
      totalCommands: this.parseRedisInfo(info, 'total_commands_processed'),
      instantaneousOps: this.parseRedisInfo(info, 'instantaneous_ops_per_sec'),
    };
  }

  parseRedisInfo(info, key) {
    const regex = new RegExp(`${key}:(.+)`);
    const match = info.match(regex);
    return match ? match[1].trim() : null;
  }

  // Cleanup methods
  async clearUserCache(userId) {
    const patterns = [
      `user:${userId}`,
      `feed:${userId}`,
      `recommendations:${userId}`,
      `history:${userId}`,
      `likes:user:${userId}`,
      `notifications:${userId}`,
    ];
    
    for (const pattern of patterns) {
      await this.redis.del(pattern);
    }
    
    return true;
  }

  async clearAllCache() {
    // Use with caution!
    return this.redis.client.flushdb();
  }

  // Get the Redis instance for advanced operations
  getRedis() {
    return this.redis;
  }
}

// Singleton instance
let instance;

module.exports = {
  getCacheManager: () => {
    if (!instance) {
      instance = new CacheManager();
    }
    return instance;
  },
  CacheManager,
};