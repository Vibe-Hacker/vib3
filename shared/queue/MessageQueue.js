const Bull = require('bull');
const Redis = require('ioredis');
const winston = require('winston');

class MessageQueue {
  constructor(config = {}) {
    this.config = {
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
        maxRetriesPerRequest: 3,
      },
      defaultJobOptions: {
        removeOnComplete: 100,
        removeOnFail: 50,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      },
      ...config,
    };

    this.queues = new Map();
    this.redis = new Redis(this.config.redis);
    
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.json(),
      defaultMeta: { service: 'message-queue' },
      transports: [
        new winston.transports.Console({
          format: winston.format.simple(),
        }),
      ],
    });
  }

  // Get or create a queue
  getQueue(queueName) {
    if (!this.queues.has(queueName)) {
      const queue = new Bull(queueName, {
        redis: this.config.redis,
        defaultJobOptions: this.config.defaultJobOptions,
      });

      // Set up error handling
      queue.on('error', (error) => {
        this.logger.error(`Queue ${queueName} error:`, error);
      });

      queue.on('failed', (job, err) => {
        this.logger.error(`Job ${job.id} in ${queueName} failed:`, err);
      });

      this.queues.set(queueName, queue);
    }

    return this.queues.get(queueName);
  }

  // Video processing queue
  async addVideoProcessingJob(videoData) {
    const queue = this.getQueue('video-processing');
    
    const job = await queue.add('process-video', {
      videoId: videoData.videoId,
      userId: videoData.userId,
      filePath: videoData.filePath,
      originalUrl: videoData.originalUrl,
      timestamp: new Date(),
    }, {
      priority: videoData.priority || 0,
      delay: videoData.delay || 0,
    });

    this.logger.info(`Video processing job ${job.id} added for video ${videoData.videoId}`);
    return job;
  }

  // Thumbnail generation queue
  async addThumbnailJob(videoData) {
    const queue = this.getQueue('thumbnail-generation');
    
    const job = await queue.add('generate-thumbnail', {
      videoId: videoData.videoId,
      videoUrl: videoData.videoUrl,
      timestamp: new Date(),
    }, {
      priority: 1,
    });

    return job;
  }

  // Notification queue
  async addNotificationJob(notificationData) {
    const queue = this.getQueue('notifications');
    
    const job = await queue.add('send-notification', {
      userId: notificationData.userId,
      type: notificationData.type,
      title: notificationData.title,
      message: notificationData.message,
      data: notificationData.data,
      timestamp: new Date(),
    }, {
      attempts: 5,
      backoff: {
        type: 'fixed',
        delay: 5000,
      },
    });

    return job;
  }

  // Analytics event queue
  async addAnalyticsEvent(eventData) {
    const queue = this.getQueue('analytics-events');
    
    const job = await queue.add('track-event', {
      userId: eventData.userId,
      eventType: eventData.eventType,
      eventData: eventData.data,
      timestamp: eventData.timestamp || new Date(),
    }, {
      removeOnComplete: 1000, // Keep last 1000 for debugging
    });

    return job;
  }

  // Email queue
  async addEmailJob(emailData) {
    const queue = this.getQueue('emails');
    
    const job = await queue.add('send-email', {
      to: emailData.to,
      subject: emailData.subject,
      template: emailData.template,
      data: emailData.data,
      timestamp: new Date(),
    }, {
      attempts: 3,
      delay: emailData.delay || 0,
    });

    return job;
  }

  // Recommendation update queue
  async addRecommendationUpdateJob(userId) {
    const queue = this.getQueue('recommendation-updates');
    
    const job = await queue.add('update-recommendations', {
      userId,
      timestamp: new Date(),
    }, {
      delay: 5000, // Delay to batch updates
      removeOnComplete: 50,
    });

    return job;
  }

  // ML training queue
  async addMLTrainingJob(modelType, data) {
    const queue = this.getQueue('ml-training');
    
    const job = await queue.add('train-model', {
      modelType,
      trainingData: data,
      timestamp: new Date(),
    }, {
      priority: -1, // Low priority
      attempts: 1,
    });

    return job;
  }

  // Cache warming queue
  async addCacheWarmingJob(cacheType, data) {
    const queue = this.getQueue('cache-warming');
    
    const job = await queue.add('warm-cache', {
      cacheType,
      data,
      timestamp: new Date(),
    }, {
      priority: -2, // Very low priority
    });

    return job;
  }

  // Bulk operations queue
  async addBulkJob(operation, items) {
    const queue = this.getQueue('bulk-operations');
    
    const job = await queue.add('bulk-process', {
      operation,
      items,
      timestamp: new Date(),
    }, {
      attempts: 1,
    });

    return job;
  }

  // Create a worker for processing jobs
  createWorker(queueName, processor, concurrency = 1) {
    const queue = this.getQueue(queueName);
    
    queue.process(concurrency, async (job) => {
      this.logger.info(`Processing job ${job.id} from ${queueName}`);
      
      try {
        const result = await processor(job);
        this.logger.info(`Job ${job.id} completed successfully`);
        return result;
      } catch (error) {
        this.logger.error(`Job ${job.id} failed:`, error);
        throw error;
      }
    });

    return queue;
  }

  // Get queue statistics
  async getQueueStats(queueName) {
    const queue = this.getQueue(queueName);
    
    const [
      waitingCount,
      activeCount,
      completedCount,
      failedCount,
      delayedCount,
    ] = await Promise.all([
      queue.getWaitingCount(),
      queue.getActiveCount(),
      queue.getCompletedCount(),
      queue.getFailedCount(),
      queue.getDelayedCount(),
    ]);

    return {
      queue: queueName,
      waiting: waitingCount,
      active: activeCount,
      completed: completedCount,
      failed: failedCount,
      delayed: delayedCount,
      total: waitingCount + activeCount + delayedCount,
    };
  }

  // Get all queue statistics
  async getAllQueueStats() {
    const stats = {};
    
    for (const [name, queue] of this.queues) {
      stats[name] = await this.getQueueStats(name);
    }
    
    return stats;
  }

  // Clear a queue
  async clearQueue(queueName) {
    const queue = this.getQueue(queueName);
    await queue.empty();
    this.logger.info(`Queue ${queueName} cleared`);
  }

  // Pause/resume queue
  async pauseQueue(queueName) {
    const queue = this.getQueue(queueName);
    await queue.pause();
    this.logger.info(`Queue ${queueName} paused`);
  }

  async resumeQueue(queueName) {
    const queue = this.getQueue(queueName);
    await queue.resume();
    this.logger.info(`Queue ${queueName} resumed`);
  }

  // Retry failed jobs
  async retryFailedJobs(queueName, limit = 100) {
    const queue = this.getQueue(queueName);
    const failedJobs = await queue.getFailed(0, limit);
    
    let retried = 0;
    for (const job of failedJobs) {
      await job.retry();
      retried++;
    }
    
    this.logger.info(`Retried ${retried} failed jobs in ${queueName}`);
    return retried;
  }

  // Clean old jobs
  async cleanOldJobs(queueName, grace = 3600000) { // 1 hour default
    const queue = this.getQueue(queueName);
    
    const cleaned = await queue.clean(grace, 'completed');
    const cleanedFailed = await queue.clean(grace, 'failed');
    
    this.logger.info(`Cleaned ${cleaned} completed and ${cleanedFailed} failed jobs from ${queueName}`);
    return { completed: cleaned, failed: cleanedFailed };
  }

  // Graceful shutdown
  async shutdown() {
    this.logger.info('Shutting down message queues...');
    
    for (const [name, queue] of this.queues) {
      await queue.close();
      this.logger.info(`Queue ${name} closed`);
    }
    
    await this.redis.quit();
    this.logger.info('Message queue shutdown complete');
  }
}

// Singleton instance
let instance;

module.exports = {
  getMessageQueue: (config) => {
    if (!instance) {
      instance = new MessageQueue(config);
    }
    return instance;
  },
  MessageQueue,
};