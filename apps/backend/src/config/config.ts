import dotenv from 'dotenv';
import ms from 'ms';
// Load environment variables
dotenv.config();

const config = {
  // Server configuration
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  apiUrl: process.env.API_URL || 'http://localhost:3000',
  
  // MongoDB configuration
  mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/juniorhub',
  
  // JWT configuration
  jwtSecret: process.env.JWT_SECRET || 'juniorhub_secret_key_change_in_production',
  jwtExpiresIn: (process.env.JWT_EXPIRES_IN || '1h') as ms.StringValue,
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'juniorhub_refresh_secret_key_change_in_production',
  jwtRefreshExpiresIn: (process.env.JWT_REFRESH_EXPIRES_IN || '7d') as ms.StringValue,
  
  // OAuth configuration - for direct use in controllers
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
  
  // OAuth configuration - direct properties for Passport.js
  googleClientId: process.env.GOOGLE_CLIENT_ID || '',
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
  googleCallbackUrl: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3000/api/auth/google/callback',
  
  facebookAppId: process.env.FACEBOOK_APP_ID || '',
  facebookAppSecret: process.env.FACEBOOK_APP_SECRET || '',
  facebookCallbackUrl: process.env.FACEBOOK_CALLBACK_URL || 'http://localhost:3000/api/auth/facebook/callback',
  
  // Frontend URLs
  clientUrl: process.env.CLIENT_URL || 'http://localhost:4200',
  roleSelectionUrl: process.env.ROLE_SELECTION_URL || 'http://localhost:4200/select-role',
  juniorDashboardUrl: process.env.JUNIOR_DASHBOARD_URL || 'http://localhost:4200/dashboard/junior',
  companyDashboardUrl: process.env.COMPANY_DASHBOARD_URL || 'http://localhost:4200/dashboard/company',
};

export default config; 