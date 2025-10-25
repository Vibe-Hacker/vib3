const { MongoClient, ObjectId } = require('mongodb');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

const TEST_DATABASE_URL = 'mongodb+srv://vibeadmin:P0pp0p25%21@cluster0.y06bp.mongodb.net/vib3-test?retryWrites=true&w=majority&appName=Cluster0';
const VIDEO_COLLECTION = 'test_videos';
const LIKES_COLLECTION = 'test_likes';
const COMMENTS_COLLECTION = 'test_comments';
const VIEWS_COLLECTION = 'test_views';

describe('delete-videos-by-id.js', () => {
    let client;
    let db;

    beforeAll(async () => {
        client = new MongoClient(TEST_DATABASE_URL);
        await client.connect();
        db = client.db();
    });

    afterAll(async () => {
        await client.close();
    });

    beforeEach(async () => {
        await db.collection(VIDEO_COLLECTION).deleteMany({});
        await db.collection(LIKES_COLLECTION).deleteMany({});
        await db.collection(COMMENTS_COLLECTION).deleteMany({});
        await db.collection(VIEWS_COLLECTION).deleteMany({});
    });

    it('should mark videos as deleted', async () => {
        // Insert some dummy videos
        const result = await db.collection(VIDEO_COLLECTION).insertMany([
            { title: 'Video 1', status: 'active', createdAt: new Date() },
            { title: 'Video 2', status: 'active', createdAt: new Date() },
        ]);
        const ids = Object.values(result.insertedIds).map(id => id.toString());

        // Execute the script
        const { stdout, stderr } = await execPromise(`node delete-videos-by-id.js ${ids.join(' ')}`, {
            env: {
                ...process.env,
                DATABASE_URL: TEST_DATABASE_URL,
                VIDEO_COLLECTION,
                LIKES_COLLECTION,
                COMMENTS_COLLECTION,
                VIEWS_COLLECTION,
            },
        });

        console.log(stdout);
        if (stderr) {
            console.error(stderr);
        }


        // Check if the videos are marked as deleted
        const videos = await db.collection(VIDEO_COLLECTION).find({ _id: { $in: Object.values(result.insertedIds) } }).toArray();
        expect(videos).toHaveLength(2);
        videos.forEach(video => {
            expect(video.status).toBe('deleted');
        });
    });

    it('should not fail with invalid video ids', async () => {
        const invalidId = new ObjectId().toString();
        // Execute the script
        const { stdout, stderr } = await execPromise(`node delete-videos-by-id.js ${invalidId}`, {
            env: {
                ...process.env,
                DATABASE_URL: TEST_DATABASE_URL,
                VIDEO_COLLECTION,
                LIKES_COLLECTION,
                COMMENTS_COLLECTION,
                VIEWS_COLLECTION,
            },
        });

        console.log(stdout);
        if (stderr) {
            console.error(stderr);
        }

        expect(stdout).toContain(`Video ${invalidId} not found in database`);
    });
});
