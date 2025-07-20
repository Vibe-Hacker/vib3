// Configure CORS for DigitalOcean Spaces
// This script sets up CORS rules to allow video playback from any origin

const AWS = require('aws-sdk');
require('dotenv').config();

// Configure the S3 client for DigitalOcean Spaces
const spacesEndpoint = new AWS.Endpoint('nyc3.digitaloceanspaces.com');
const s3 = new AWS.S3({
    endpoint: spacesEndpoint,
    accessKeyId: process.env.DO_SPACES_KEY,
    secretAccessKey: process.env.DO_SPACES_SECRET
});

const bucketName = 'vib3-videos';

// CORS configuration that allows all origins
const corsConfiguration = {
    CORSRules: [
        {
            AllowedHeaders: ['*'],
            AllowedMethods: ['GET', 'HEAD'],
            AllowedOrigins: ['*'], // Allow all origins
            ExposeHeaders: [
                'Content-Length',
                'Content-Type',
                'Content-Range',
                'Accept-Ranges',
                'ETag'
            ],
            MaxAgeSeconds: 3600
        }
    ]
};

async function configureCORS() {
    try {
        console.log('🔧 Configuring CORS for bucket:', bucketName);
        
        // Set CORS configuration
        await s3.putBucketCors({
            Bucket: bucketName,
            CORSConfiguration: corsConfiguration
        }).promise();
        
        console.log('✅ CORS configuration applied successfully!');
        
        // Verify the configuration
        const result = await s3.getBucketCors({ Bucket: bucketName }).promise();
        console.log('📋 Current CORS configuration:', JSON.stringify(result.CORSRules, null, 2));
        
    } catch (error) {
        console.error('❌ Error configuring CORS:', error);
    }
}

// Run the configuration
configureCORS();