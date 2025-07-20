const tf = require('@tensorflow/tfjs-node');
const _ = require('lodash');

class RecommendationEngine {
  constructor(db, cache) {
    this.db = db;
    this.cache = cache;
    this.userSegments = new Map();
    this.contentFeatures = new Map();
    this.collaborativeModel = null;
    this.contentModel = null;
    this.hybridWeights = {
      collaborative: 0.6,
      content: 0.3,
      trending: 0.1,
    };
  }

  async initialize() {
    // Load user segments
    await this.loadUserSegments();
    
    // Load content features
    await this.loadContentFeatures();
    
    // Initialize models
    await this.initializeModels();
  }

  async loadUserSegments() {
    const segments = await this.db.collection('user_segments').find({}).toArray();
    segments.forEach(segment => {
      this.userSegments.set(segment.userId, segment);
    });
  }

  async loadContentFeatures() {
    const features = await this.db.collection('video_features')
      .find({})
      .limit(10000)
      .toArray();
    
    features.forEach(feature => {
      this.contentFeatures.set(feature.videoId, feature);
    });
  }

  async initializeModels() {
    // Initialize collaborative filtering model
    this.collaborativeModel = await this.createCollaborativeModel();
    
    // Initialize content-based model
    this.contentModel = await this.createContentModel();
  }

  async createCollaborativeModel() {
    // Simple matrix factorization model
    const model = tf.sequential({
      layers: [
        tf.layers.embedding({
          inputDim: 100000, // Max user/item IDs
          outputDim: 50,
          inputLength: 1,
        }),
        tf.layers.flatten(),
        tf.layers.dense({
          units: 128,
          activation: 'relu',
        }),
        tf.layers.dropout({ rate: 0.2 }),
        tf.layers.dense({
          units: 64,
          activation: 'relu',
        }),
        tf.layers.dense({
          units: 1,
          activation: 'sigmoid',
        }),
      ],
    });

    model.compile({
      optimizer: 'adam',
      loss: 'binaryCrossentropy',
      metrics: ['accuracy'],
    });

    return model;
  }

  async createContentModel() {
    // Content-based neural network
    const model = tf.sequential({
      layers: [
        tf.layers.dense({
          inputShape: [100], // Feature vector size
          units: 64,
          activation: 'relu',
        }),
        tf.layers.dropout({ rate: 0.3 }),
        tf.layers.dense({
          units: 32,
          activation: 'relu',
        }),
        tf.layers.dense({
          units: 16,
          activation: 'relu',
        }),
        tf.layers.dense({
          units: 1,
          activation: 'sigmoid',
        }),
      ],
    });

    model.compile({
      optimizer: 'adam',
      loss: 'meanSquaredError',
      metrics: ['mae'],
    });

    return model;
  }

  async getPersonalizedRecommendations(userId, limit = 20, excludeViewed = true) {
    try {
      // Get user interaction history
      const userHistory = await this.getUserHistory(userId);
      
      // Get user preferences
      const preferences = await this.getUserPreferences(userId);
      
      // Get collaborative filtering candidates
      const collaborativeCandidates = await this.getCollaborativeFilteringCandidates(
        userId, userHistory, limit * 3
      );
      
      // Get content-based candidates
      const contentCandidates = await this.getContentBasedCandidates(
        userId, userHistory, preferences, limit * 3
      );
      
      // Get trending candidates
      const trendingCandidates = await this.getTrendingCandidates(
        preferences, limit
      );
      
      // Merge and score all candidates
      const allCandidates = this.mergeCandidates([
        ...collaborativeCandidates.map(c => ({ ...c, source: 'collaborative' })),
        ...contentCandidates.map(c => ({ ...c, source: 'content' })),
        ...trendingCandidates.map(c => ({ ...c, source: 'trending' })),
      ]);
      
      // Apply hybrid scoring
      const scoredCandidates = await this.applyHybridScoring(
        allCandidates, userId, preferences
      );
      
      // Filter out viewed videos if requested
      let finalCandidates = scoredCandidates;
      if (excludeViewed) {
        const viewedVideos = new Set(userHistory.map(h => h.videoId));
        finalCandidates = scoredCandidates.filter(c => !viewedVideos.has(c.videoId));
      }
      
      // Apply diversity
      const diverseRecommendations = this.applyDiversity(finalCandidates, limit);
      
      // Fetch full video data
      const recommendations = await this.enrichRecommendations(diverseRecommendations);
      
      return recommendations;
      
    } catch (error) {
      console.error('Error generating personalized recommendations:', error);
      // Fallback to trending
      return this.getTrendingRecommendations(userId, limit);
    }
  }

  async getCollaborativeFilteringCandidates(userId, userHistory, limit) {
    // Find similar users
    const similarUsers = await this.findSimilarUsers(userId, 50);
    
    // Get videos liked by similar users
    const candidateVideos = new Map();
    
    for (const similarUser of similarUsers) {
      const likedVideos = await this.db.collection('likes')
        .find({ 
          userId: similarUser.userId,
          createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Last 30 days
        })
        .limit(20)
        .toArray();
      
      likedVideos.forEach(like => {
        if (!candidateVideos.has(like.videoId)) {
          candidateVideos.set(like.videoId, {
            videoId: like.videoId,
            score: 0,
            supporters: [],
          });
        }
        
        const candidate = candidateVideos.get(like.videoId);
        candidate.score += similarUser.similarity;
        candidate.supporters.push(similarUser.userId);
      });
    }
    
    // Sort by score and return top candidates
    const sortedCandidates = Array.from(candidateVideos.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
    
    return sortedCandidates;
  }

  async getContentBasedCandidates(userId, userHistory, preferences, limit) {
    // Get feature vectors of user's liked videos
    const likedVideoFeatures = [];
    
    for (const interaction of userHistory.filter(h => h.action === 'like')) {
      const features = this.contentFeatures.get(interaction.videoId);
      if (features) {
        likedVideoFeatures.push(features.vector);
      }
    }
    
    if (likedVideoFeatures.length === 0) {
      return [];
    }
    
    // Calculate average feature vector (user profile)
    const userProfile = this.calculateAverageVector(likedVideoFeatures);
    
    // Find similar videos
    const candidates = [];
    
    for (const [videoId, features] of this.contentFeatures) {
      const similarity = this.cosineSimilarity(userProfile, features.vector);
      
      candidates.push({
        videoId,
        score: similarity,
        features: features.categories,
      });
    }
    
    // Apply preference filters
    let filteredCandidates = candidates;
    if (preferences.categories && preferences.categories.length > 0) {
      filteredCandidates = candidates.filter(c => 
        c.features.some(f => preferences.categories.includes(f))
      );
    }
    
    // Sort and return top candidates
    return filteredCandidates
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  async getTrendingCandidates(preferences, limit) {
    const query = {};
    
    // Apply category filter if preferences exist
    if (preferences.categories && preferences.categories.length > 0) {
      query.categories = { $in: preferences.categories };
    }
    
    const trendingVideos = await this.db.collection('videos')
      .find(query)
      .sort({ trendingScore: -1, viewCount: -1 })
      .limit(limit)
      .toArray();
    
    return trendingVideos.map(video => ({
      videoId: video._id,
      score: video.trendingScore || 0,
      viewCount: video.viewCount,
    }));
  }

  mergeCandidates(candidateArrays) {
    const merged = new Map();
    
    candidateArrays.forEach(candidate => {
      if (!merged.has(candidate.videoId)) {
        merged.set(candidate.videoId, {
          videoId: candidate.videoId,
          scores: {},
          sources: [],
        });
      }
      
      const entry = merged.get(candidate.videoId);
      entry.scores[candidate.source] = candidate.score;
      entry.sources.push(candidate.source);
    });
    
    return Array.from(merged.values());
  }

  async applyHybridScoring(candidates, userId, preferences) {
    const scoredCandidates = [];
    
    for (const candidate of candidates) {
      let finalScore = 0;
      
      // Collaborative score
      if (candidate.scores.collaborative) {
        finalScore += candidate.scores.collaborative * this.hybridWeights.collaborative;
      }
      
      // Content score
      if (candidate.scores.content) {
        finalScore += candidate.scores.content * this.hybridWeights.content;
      }
      
      // Trending score (normalized)
      if (candidate.scores.trending) {
        const normalizedTrending = Math.min(candidate.scores.trending / 100, 1);
        finalScore += normalizedTrending * this.hybridWeights.trending;
      }
      
      // Apply user segment boost
      const segment = this.userSegments.get(userId);
      if (segment) {
        finalScore *= this.getSegmentBoost(segment, candidate);
      }
      
      // Recency boost
      const recencyBoost = await this.getRecencyBoost(candidate.videoId);
      finalScore *= recencyBoost;
      
      scoredCandidates.push({
        ...candidate,
        finalScore,
      });
    }
    
    return scoredCandidates.sort((a, b) => b.finalScore - a.finalScore);
  }

  applyDiversity(candidates, limit) {
    const selected = [];
    const usedCategories = new Set();
    const usedCreators = new Set();
    
    for (const candidate of candidates) {
      if (selected.length >= limit) break;
      
      // Get video metadata
      const features = this.contentFeatures.get(candidate.videoId);
      if (!features) continue;
      
      // Check diversity constraints
      const category = features.primaryCategory;
      const creator = features.creatorId;
      
      // Avoid too many videos from same category/creator
      const categoryCount = Array.from(usedCategories).filter(c => c === category).length;
      const creatorCount = Array.from(usedCreators).filter(c => c === creator).length;
      
      if (categoryCount < 3 && creatorCount < 2) {
        selected.push(candidate);
        usedCategories.add(category);
        usedCreators.add(creator);
      }
    }
    
    // Fill remaining slots if needed
    if (selected.length < limit) {
      const remaining = candidates.filter(c => !selected.includes(c));
      selected.push(...remaining.slice(0, limit - selected.length));
    }
    
    return selected;
  }

  async enrichRecommendations(candidates) {
    const videoIds = candidates.map(c => c.videoId);
    
    const videos = await this.db.collection('videos')
      .find({ _id: { $in: videoIds } })
      .toArray();
    
    const videoMap = new Map(videos.map(v => [v._id, v]));
    
    return candidates.map(candidate => {
      const video = videoMap.get(candidate.videoId);
      if (!video) return null;
      
      return {
        videoId: candidate.videoId,
        score: candidate.finalScore,
        sources: candidate.sources,
        video: {
          id: video._id,
          title: video.title,
          thumbnailUrl: video.thumbnailUrl,
          duration: video.duration,
          viewCount: video.viewCount,
          likeCount: video.likeCount,
          creatorId: video.userId,
          creatorName: video.userName,
          createdAt: video.createdAt,
        },
        reason: this.getRecommendationReason(candidate),
      };
    }).filter(r => r !== null);
  }

  getRecommendationReason(candidate) {
    const reasons = [];
    
    if (candidate.sources.includes('collaborative')) {
      reasons.push('Users like you enjoyed this');
    }
    
    if (candidate.sources.includes('content')) {
      reasons.push('Similar to videos you like');
    }
    
    if (candidate.sources.includes('trending')) {
      reasons.push('Trending now');
    }
    
    return reasons[0] || 'Recommended for you';
  }

  async findSimilarUsers(userId, limit = 10) {
    // Get user's interaction vector
    const userVector = await this.getUserInteractionVector(userId);
    
    // Find users with similar interaction patterns
    const similarUsers = [];
    
    // Sample random users for comparison (in production, use LSH or similar)
    const sampleUsers = await this.db.collection('users')
      .aggregate([
        { $match: { _id: { $ne: userId } } },
        { $sample: { size: 1000 } },
      ])
      .toArray();
    
    for (const otherUser of sampleUsers) {
      const otherVector = await this.getUserInteractionVector(otherUser._id);
      const similarity = this.cosineSimilarity(userVector, otherVector);
      
      if (similarity > 0.5) {
        similarUsers.push({
          userId: otherUser._id,
          similarity,
        });
      }
    }
    
    return similarUsers
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);
  }

  async getUserInteractionVector(userId) {
    // Create a sparse vector of user interactions
    const interactions = await this.db.collection('user_interactions')
      .find({ 
        userId,
        timestamp: { $gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) } // Last 90 days
      })
      .toArray();
    
    const vector = {};
    
    interactions.forEach(interaction => {
      const weight = this.getInteractionWeight(interaction.action);
      vector[interaction.videoId] = (vector[interaction.videoId] || 0) + weight;
    });
    
    return vector;
  }

  getInteractionWeight(action) {
    const weights = {
      view: 1,
      like: 3,
      comment: 4,
      share: 5,
      complete: 2,
    };
    
    return weights[action] || 1;
  }

  cosineSimilarity(vectorA, vectorB) {
    const keys = new Set([...Object.keys(vectorA), ...Object.keys(vectorB)]);
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (const key of keys) {
      const a = vectorA[key] || 0;
      const b = vectorB[key] || 0;
      
      dotProduct += a * b;
      normA += a * a;
      normB += b * b;
    }
    
    if (normA === 0 || normB === 0) return 0;
    
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  calculateAverageVector(vectors) {
    if (vectors.length === 0) return [];
    
    const avgVector = new Array(vectors[0].length).fill(0);
    
    vectors.forEach(vector => {
      vector.forEach((value, index) => {
        avgVector[index] += value;
      });
    });
    
    return avgVector.map(v => v / vectors.length);
  }

  async getUserHistory(userId) {
    return this.db.collection('user_interactions')
      .find({ userId })
      .sort({ timestamp: -1 })
      .limit(100)
      .toArray();
  }

  async getUserPreferences(userId) {
    const preferences = await this.db.collection('user_preferences')
      .findOne({ userId });
    
    if (preferences) return preferences;
    
    // Infer preferences from history
    const inferredPreferences = await this.inferUserPreferences(userId);
    
    // Store for future use
    await this.db.collection('user_preferences').insertOne({
      userId,
      ...inferredPreferences,
      createdAt: new Date(),
    });
    
    return inferredPreferences;
  }

  async inferUserPreferences(userId) {
    const interactions = await this.getUserHistory(userId);
    
    const categories = {};
    const hashtags = {};
    const creators = {};
    const durations = [];
    
    for (const interaction of interactions) {
      const video = await this.db.collection('videos')
        .findOne({ _id: interaction.videoId });
      
      if (!video) continue;
      
      // Count categories
      if (video.category) {
        categories[video.category] = (categories[video.category] || 0) + 1;
      }
      
      // Count hashtags
      if (video.hashtags) {
        video.hashtags.forEach(tag => {
          hashtags[tag] = (hashtags[tag] || 0) + 1;
        });
      }
      
      // Count creators
      creators[video.userId] = (creators[video.userId] || 0) + 1;
      
      // Track durations
      if (video.duration) {
        durations.push(video.duration);
      }
    }
    
    return {
      categories: Object.entries(categories)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([cat]) => cat),
      hashtags: Object.entries(hashtags)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([tag]) => tag),
      favoriteCreators: Object.entries(creators)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([creator]) => creator),
      avgDuration: durations.length > 0 
        ? durations.reduce((a, b) => a + b) / durations.length 
        : 30,
    };
  }

  async getUserSegment(userId) {
    const segment = this.userSegments.get(userId);
    return segment?.segment || 'general';
  }

  getSegmentBoost(segment, candidate) {
    // Apply different boosts based on user segment
    const boosts = {
      'power_user': {
        trending: 0.8,
        fresh: 1.2,
        niche: 1.1,
      },
      'casual': {
        trending: 1.2,
        fresh: 0.9,
        popular: 1.1,
      },
      'creator': {
        tools: 1.3,
        educational: 1.2,
        trending: 0.9,
      },
    };
    
    const segmentBoosts = boosts[segment.segment] || {};
    let boost = 1.0;
    
    // Apply relevant boosts
    Object.entries(segmentBoosts).forEach(([type, value]) => {
      if (this.candidateMatchesType(candidate, type)) {
        boost *= value;
      }
    });
    
    return boost;
  }

  candidateMatchesType(candidate, type) {
    // Simple type matching logic
    const features = this.contentFeatures.get(candidate.videoId);
    if (!features) return false;
    
    switch (type) {
      case 'trending':
        return candidate.scores.trending > 50;
      case 'fresh':
        return features.ageInDays < 2;
      case 'niche':
        return features.viewCount < 10000;
      case 'popular':
        return features.viewCount > 100000;
      case 'tools':
        return features.categories.includes('tools');
      case 'educational':
        return features.categories.includes('educational');
      default:
        return false;
    }
  }

  async getRecencyBoost(videoId) {
    const video = await this.db.collection('videos')
      .findOne({ _id: videoId }, { projection: { createdAt: 1 } });
    
    if (!video) return 1.0;
    
    const ageInDays = (Date.now() - video.createdAt.getTime()) / (1000 * 60 * 60 * 24);
    
    // Exponential decay with half-life of 7 days
    return Math.pow(0.5, ageInDays / 7) + 0.5;
  }

  async getTrendingRecommendations(userId, limit, userSegment) {
    const trendingVideos = await this.cache.getTrendingVideos('all', limit * 2);
    
    // Filter based on user segment
    let filtered = trendingVideos;
    if (userSegment === 'power_user') {
      // Power users might want fresher content
      filtered = trendingVideos.filter(v => {
        const ageInDays = (Date.now() - new Date(v.createdAt).getTime()) / (1000 * 60 * 60 * 24);
        return ageInDays < 3;
      });
    }
    
    return filtered.slice(0, limit).map(video => ({
      videoId: video._id,
      score: video.trendingScore || 0,
      sources: ['trending'],
      video: {
        id: video._id,
        title: video.title,
        thumbnailUrl: video.thumbnailUrl,
        duration: video.duration,
        viewCount: video.viewCount,
        likeCount: video.likeCount,
        creatorId: video.userId,
        creatorName: video.userName,
        createdAt: video.createdAt,
      },
      reason: 'Trending now',
    }));
  }

  async getSimilarVideos(videoId, userId, limit) {
    const targetFeatures = this.contentFeatures.get(videoId);
    if (!targetFeatures) {
      return [];
    }
    
    const candidates = [];
    
    for (const [candidateId, features] of this.contentFeatures) {
      if (candidateId === videoId) continue;
      
      const similarity = this.cosineSimilarity(
        targetFeatures.vector,
        features.vector
      );
      
      if (similarity > 0.7) {
        candidates.push({
          videoId: candidateId,
          score: similarity,
        });
      }
    }
    
    const sorted = candidates
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
    
    return this.enrichRecommendations(sorted.map(c => ({
      ...c,
      finalScore: c.score,
      sources: ['similar'],
    })));
  }

  async getDiscoveryRecommendations(userId, limit) {
    // Get user's typical categories
    const preferences = await this.getUserPreferences(userId);
    const userCategories = new Set(preferences.categories);
    
    // Find videos from different categories
    const discoveryVideos = await this.db.collection('videos')
      .find({
        category: { $nin: Array.from(userCategories) },
        viewCount: { $gte: 1000 }, // Some popularity threshold
        createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }, // Last week
      })
      .sort({ qualityScore: -1 })
      .limit(limit)
      .toArray();
    
    return discoveryVideos.map(video => ({
      videoId: video._id,
      score: video.qualityScore || 0.5,
      sources: ['discovery'],
      video: {
        id: video._id,
        title: video.title,
        thumbnailUrl: video.thumbnailUrl,
        duration: video.duration,
        viewCount: video.viewCount,
        likeCount: video.likeCount,
        creatorId: video.userId,
        creatorName: video.userName,
        createdAt: video.createdAt,
      },
      reason: 'Explore something new',
    }));
  }

  async getAnonymousRecommendations(sessionId, limit) {
    // For anonymous users, return popular/trending content
    const trending = await this.getTrendingRecommendations(null, limit, 'general');
    
    // Mix in some viral content
    const viral = await this.db.collection('videos')
      .find({
        viewCount: { $gte: 100000 },
        createdAt: { $gte: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) },
      })
      .sort({ shareCount: -1 })
      .limit(limit / 2)
      .toArray();
    
    const viralRecommendations = viral.map(video => ({
      videoId: video._id,
      score: video.shareCount / 1000,
      sources: ['viral'],
      video: {
        id: video._id,
        title: video.title,
        thumbnailUrl: video.thumbnailUrl,
        duration: video.duration,
        viewCount: video.viewCount,
        likeCount: video.likeCount,
        creatorId: video.userId,
        creatorName: video.userName,
        createdAt: video.createdAt,
      },
      reason: 'Popular right now',
    }));
    
    // Merge and deduplicate
    const merged = [...trending, ...viralRecommendations];
    const seen = new Set();
    
    return merged.filter(rec => {
      if (seen.has(rec.videoId)) return false;
      seen.add(rec.videoId);
      return true;
    }).slice(0, limit);
  }

  async updateUserPreferences(userId, updates) {
    await this.db.collection('user_preferences').updateOne(
      { userId },
      { 
        $set: {
          ...updates,
          updatedAt: new Date(),
        }
      },
      { upsert: true }
    );
  }

  async updateTrendingScores() {
    // Calculate trending scores based on recent engagement
    const pipeline = [
      {
        $match: {
          timestamp: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
        }
      },
      {
        $group: {
          _id: '$videoId',
          viewCount: { $sum: { $cond: [{ $eq: ['$action', 'view'] }, 1, 0] } },
          likeCount: { $sum: { $cond: [{ $eq: ['$action', 'like'] }, 1, 0] } },
          commentCount: { $sum: { $cond: [{ $eq: ['$action', 'comment'] }, 1, 0] } },
          shareCount: { $sum: { $cond: [{ $eq: ['$action', 'share'] }, 1, 0] } },
        }
      },
      {
        $project: {
          trendingScore: {
            $add: [
              '$viewCount',
              { $multiply: ['$likeCount', 3] },
              { $multiply: ['$commentCount', 5] },
              { $multiply: ['$shareCount', 10] },
            ]
          }
        }
      }
    ];
    
    const trendingScores = await this.db.collection('user_interactions')
      .aggregate(pipeline)
      .toArray();
    
    // Update videos with trending scores
    for (const score of trendingScores) {
      await this.db.collection('videos').updateOne(
        { _id: score._id },
        { $set: { trendingScore: score.trendingScore } }
      );
      
      // Update cache
      await this.cache.updateTrendingScore(score._id, 'all', score.trendingScore);
    }
  }

  async updateUserSegments() {
    // Segment users based on behavior patterns
    const users = await this.db.collection('users')
      .find({})
      .limit(10000)
      .toArray();
    
    for (const user of users) {
      const segment = await this.calculateUserSegment(user._id);
      
      await this.db.collection('user_segments').updateOne(
        { userId: user._id },
        { 
          $set: {
            userId: user._id,
            segment,
            updatedAt: new Date(),
          }
        },
        { upsert: true }
      );
      
      this.userSegments.set(user._id, { userId: user._id, segment });
    }
  }

  async calculateUserSegment(userId) {
    const recentActivity = await this.db.collection('user_interactions')
      .find({ 
        userId,
        timestamp: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
      })
      .toArray();
    
    const dailyAverage = recentActivity.length / 30;
    const hasUploaded = await this.db.collection('videos')
      .findOne({ userId });
    
    if (hasUploaded) {
      return 'creator';
    } else if (dailyAverage > 50) {
      return 'power_user';
    } else if (dailyAverage < 5) {
      return 'casual';
    } else {
      return 'regular';
    }
  }

  async warmCache() {
    // Get top active users
    const activeUsers = await this.db.collection('user_interactions')
      .aggregate([
        {
          $match: {
            timestamp: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
          }
        },
        { $group: { _id: '$userId', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 100 }
      ])
      .toArray();
    
    // Pre-generate recommendations for active users
    for (const user of activeUsers) {
      try {
        const recommendations = await this.getPersonalizedRecommendations(
          user._id, 50, true
        );
        
        await this.cache.setUserRecommendations(
          user._id,
          recommendations.map(r => r.videoId)
        );
      } catch (error) {
        console.error(`Error warming cache for user ${user._id}:`, error);
      }
    }
  }

  async getABTestVariant(userId, experiment) {
    // Simple hash-based A/B test assignment
    const hash = this.hashString(`${userId}-${experiment}`);
    const bucket = hash % 100;
    
    const experiments = {
      'recommendation_algorithm': {
        variants: [
          { name: 'control', allocation: 50 },
          { name: 'ml_enhanced', allocation: 50 },
        ]
      },
      'diversity_level': {
        variants: [
          { name: 'low', allocation: 33 },
          { name: 'medium', allocation: 34 },
          { name: 'high', allocation: 33 },
        ]
      }
    };
    
    const config = experiments[experiment];
    if (!config) return 'control';
    
    let cumulative = 0;
    for (const variant of config.variants) {
      cumulative += variant.allocation;
      if (bucket < cumulative) {
        return variant.name;
      }
    }
    
    return 'control';
  }

  hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }
}

module.exports = RecommendationEngine;