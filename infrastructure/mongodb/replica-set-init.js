// MongoDB Replica Set Initialization Script
// Run this after starting all MongoDB instances

rs.initiate({
  _id: "rs0",
  version: 1,
  members: [
    {
      _id: 0,
      host: "mongodb-primary:27017",
      priority: 2
    },
    {
      _id: 1,
      host: "mongodb-secondary1:27017",
      priority: 1
    },
    {
      _id: 2,
      host: "mongodb-secondary2:27017",
      priority: 1
    }
  ]
});

// Wait for replica set to initialize
sleep(5000);

// Check replica set status
rs.status();

// Create admin user
db = db.getSiblingDB('admin');
db.createUser({
  user: 'admin',
  pwd: 'vib3admin',
  roles: [
    { role: 'root', db: 'admin' }
  ]
});

// Create application database and user
db = db.getSiblingDB('vib3');
db.createUser({
  user: 'vib3app',
  pwd: 'vib3appsecret',
  roles: [
    { role: 'readWrite', db: 'vib3' }
  ]
});

// Enable sharding on the database
sh.enableSharding("vib3");

// Shard collections for horizontal scaling
// Videos collection - shard by userId for even distribution
sh.shardCollection("vib3.videos", { userId: "hashed" });

// Users collection - shard by _id
sh.shardCollection("vib3.users", { _id: "hashed" });

// Analytics events - shard by timestamp for time-series data
sh.shardCollection("vib3.analytics_events", { timestamp: 1, userId: "hashed" });

// User interactions - shard by userId
sh.shardCollection("vib3.user_interactions", { userId: "hashed" });

// Create indexes for optimal performance
db = db.getSiblingDB('vib3');

// Users indexes
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ username: 1 }, { unique: true });
db.users.createIndex({ createdAt: -1 });
db.users.createIndex({ "stats.followers": -1 });

// Videos indexes
db.videos.createIndex({ userId: 1, createdAt: -1 });
db.videos.createIndex({ status: 1, privacy: 1, createdAt: -1 });
db.videos.createIndex({ hashtags: 1 });
db.videos.createIndex({ trendingScore: -1 });
db.videos.createIndex({ viewCount: -1 });
db.videos.createIndex({ createdAt: -1 });
db.videos.createIndex({ "location.coordinates": "2dsphere" });

// Follows indexes
db.follows.createIndex({ follower: 1, following: 1 }, { unique: true });
db.follows.createIndex({ following: 1, createdAt: -1 });
db.follows.createIndex({ follower: 1, createdAt: -1 });

// Likes indexes
db.likes.createIndex({ userId: 1, videoId: 1 }, { unique: true });
db.likes.createIndex({ videoId: 1, createdAt: -1 });
db.likes.createIndex({ userId: 1, createdAt: -1 });

// Comments indexes
db.comments.createIndex({ videoId: 1, createdAt: -1 });
db.comments.createIndex({ userId: 1, createdAt: -1 });
db.comments.createIndex({ parentId: 1 });

// Analytics indexes
db.analytics_events.createIndex({ timestamp: -1 });
db.analytics_events.createIndex({ userId: 1, timestamp: -1 });
db.analytics_events.createIndex({ eventType: 1, timestamp: -1 });
db.analytics_events.createIndex({ "data.videoId": 1, timestamp: -1 });

// User interactions indexes
db.user_interactions.createIndex({ userId: 1, timestamp: -1 });
db.user_interactions.createIndex({ videoId: 1, action: 1 });
db.user_interactions.createIndex({ timestamp: -1 }, { expireAfterSeconds: 7776000 }); // 90 days TTL

// Notifications indexes
db.notifications.createIndex({ userId: 1, createdAt: -1 });
db.notifications.createIndex({ userId: 1, read: 1 });
db.notifications.createIndex({ createdAt: -1 }, { expireAfterSeconds: 2592000 }); // 30 days TTL

print("MongoDB replica set and sharding configuration complete!");