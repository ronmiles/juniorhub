import dotenv from 'dotenv';
import ms from 'ms';
// Load environment variables
dotenv.config();

const config = {
  // Server configuration
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // MongoDB configuration
  mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/juniorhub',
  
  // JWT configuration
  jwtSecret: process.env.JWT_SECRET || 'juniorhub_secret_key_change_in_production',
  jwtExpiresIn: (process.env.JWT_EXPIRES_IN || '1h') as ms.StringValue,
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'juniorhub_refresh_secret_key_change_in_production',
  jwtRefreshExpiresIn: (process.env.JWT_REFRESH_EXPIRES_IN || '7d') as ms.StringValue,
  
  // OAuth configuration
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    callbackUrl: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3000/api/auth/google/callback',
  },
  
  facebook: {
    appId: process.env.FACEBOOK_APP_ID || '',
    appSecret: process.env.FACEBOOK_APP_SECRET || '',
    callbackUrl: process.env.FACEBOOK_CALLBACK_URL || 'http://localhost:3000/api/auth/facebook/callback',
  },
  
  // Frontend URL for CORS
  clientUrl: process.env.CLIENT_URL || 'http://localhost:4200',
};

export default config; 