// Script to help identify test videos in production
// This will output MongoDB queries you can run in your production database

console.log('🔍 MongoDB Queries to Find Test Videos in Production\n');
console.log('Run these queries in your MongoDB production database console:\n');

console.log('1. Find all videos in the database:');
console.log('----------------------------------------');
console.log(`db.videos.find().pretty()`);
console.log('');

console.log('2. Count total videos:');
console.log('----------------------------------------');
console.log(`db.videos.countDocuments()`);
console.log('');

console.log('3. Find videos with test-like titles:');
console.log('----------------------------------------');
console.log(`db.videos.find({
  $or: [
    { title: /test/i },
    { title: /sample/i },
    { title: /demo/i },
    { title: /trending video/i },
    { title: /viral trending/i }
  ]
}).pretty()`);
console.log('');

console.log('4. Find videos with suspicious URLs:');
console.log('----------------------------------------');
console.log(`db.videos.find({
  $or: [
    { videoUrl: /sample/i },
    { videoUrl: /test/i },
    { videoUrl: /demo/i },
    { videoUrl: /example\.com/i },
    { videoUrl: /placeholder/i },
    { videoUrl: { $exists: false } },
    { videoUrl: null },
    { videoUrl: "" }
  ]
}).pretty()`);
console.log('');

console.log('5. Find videos without proper URLs (might cause 403 errors):');
console.log('----------------------------------------');
console.log(`db.videos.find({
  $or: [
    { videoUrl: { $not: /^https?:\/\// } },
    { videoUrl: { $exists: false } },
    { videoUrl: null },
    { videoUrl: "" }
  ]
}).pretty()`);
console.log('');

console.log('6. Show unique video URL domains:');
console.log('----------------------------------------');
console.log(`db.videos.aggregate([
  { $match: { videoUrl: { $exists: true, $ne: null, $ne: "" } } },
  { $project: { 
      domain: { 
        $substr: [ "$videoUrl", 0, { $indexOfCP: [ "$videoUrl", "/" , 8 ] } ] 
      } 
    } 
  },
  { $group: { _id: "$domain", count: { $sum: 1 } } },
  { $sort: { count: -1 } }
])`);
console.log('');

console.log('7. Delete all test videos (BE CAREFUL!):');
console.log('----------------------------------------');
console.log(`// First, review what will be deleted:
db.videos.find({
  $or: [
    { videoUrl: /sample|test|demo|example\.com|placeholder/i },
    { videoUrl: { $exists: false } },
    { videoUrl: null },
    { videoUrl: "" },
    { title: /test|sample|demo/i }
  ]
}).pretty()

// Then delete if you're sure:
db.videos.deleteMany({
  $or: [
    { videoUrl: /sample|test|demo|example\.com|placeholder/i },
    { videoUrl: { $exists: false } },
    { videoUrl: null },
    { videoUrl: "" },
    { title: /test|sample|demo/i }
  ]
})`);
console.log('');

console.log('8. Check for test users:');
console.log('----------------------------------------');
console.log(`db.users.find({
  $or: [
    { username: /test/i },
    { email: /test/i },
    { username: /demo/i },
    { email: /demo/i }
  ]
}).pretty()`);
console.log('');

console.log('\n📌 IMPORTANT FINDINGS:');
console.log('======================');
console.log('The issue is in server-full.js lines 504-556!');
console.log('');
console.log('The server is GENERATING fake "test" videos for infinite scroll by:');
console.log('1. Taking real videos from the database');
console.log('2. Duplicating them with generated titles like:');
console.log('   - "Trending Video #123" (for foryou feed)');
console.log('   - "Viral Trending #456" (for explore feed)');
console.log('3. These are created on-the-fly, not stored in the database');
console.log('');
console.log('To fix this, you need to modify the /api/videos endpoint in server-full.js');
console.log('to stop generating these duplicate videos with test-like titles.');
console.log('');
console.log('The 403 errors are likely from videos in the database that have');
console.log('invalid or non-existent video URLs.');