require('dotenv').config(); // Load .env variables early

function validateEnv() {
    const requiredEnvVars = [
        'MONGO_URI',
        'JWT_SECRET',
        'GOOGLE_CLIENT_ID',
        'GOOGLE_CLIENT_SECRET',
    ];

    const missingVars = requiredEnvVars.filter((key) => !process.env[key]);

    if (missingVars.length > 0) {
        console.error(`❌ Missing required environment variables: ${missingVars.join(', ')}`);
        console.error('Please check your .env file or environment variables.');
        console.error('If you have any questions, please refer to the documentation or contact Tsz Hin Yee (Teddy).');
        console.error('Exiting process...');
        process.exit(1);
    }

    console.log('✅ All required environment variables are set.');
}

module.exports = validateEnv;

