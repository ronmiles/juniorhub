import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as FacebookStrategy } from 'passport-facebook';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import User from '../models/User';
import config from './config';

// Configure Passport to use JWT strategy for authentication
const jwtOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: config.jwtSecret,
};

// JWT strategy for protected routes
passport.use(
  new JwtStrategy(jwtOptions, async (payload, done) => {
    try {
      const user = await User.findById(payload.userId);
      if (user) {
        return done(null, {
          userId: user._id.toString(),
          id: user._id.toString(),
          role: user.role,
        });
      }
      return done(null, false);
    } catch (error) {
      return done(error, false);
    }
  })
);

// Google OAuth strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: config.googleClientId as string,
      clientSecret: config.googleClientSecret as string,
      callbackURL: `${config.apiUrl}/api/auth/google/callback`,
    },
    async (_accessToken, _refreshToken, profile, done) => {
      try {
        // Check if user already exists
        const email = profile.emails && profile.emails[0].value;
        
        if (!email) {
          return done(new Error('No email found from Google profile'), null);
        }
        
        // Find user by email
        const existingUser = await User.findOne({ email });
        
        if (existingUser) {
          // Update Google ID if not set
          if (!existingUser.googleId) {
            existingUser.googleId = profile.id;
            await existingUser.save();
          }
          
          // Transform Mongoose document to match Express.User interface
          return done(null, {
            userId: existingUser._id.toString(),
            id: existingUser._id.toString(),
            role: existingUser.role
          });
        }
        
        // If user doesn't exist, return profile data to prompt for role selection
        return done(null, {
          userId: '', // Placeholder to satisfy type
          id: '',     // Placeholder to satisfy type
          role: '',   // Placeholder to satisfy type
          needsRoleSelection: true,
          googleProfile: {
            id: profile.id,
            email,
            name: profile.displayName,
            picture: profile.photos && profile.photos[0] ? profile.photos[0].value : undefined,
          }
        });
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

// Facebook OAuth strategy
passport.use(
  new FacebookStrategy(
    {
      clientID: config.facebookAppId as string,
      clientSecret: config.facebookAppSecret as string,
      callbackURL: `${config.apiUrl}/api/auth/facebook/callback`,
      profileFields: ['id', 'emails', 'name', 'picture.type(large)'],
    },
    async (_accessToken, _refreshToken, profile, done) => {
      try {
        // Check if user already exists
        const email = profile.emails && profile.emails[0].value;
        
        if (!email) {
          return done(new Error('No email found from Facebook profile'), null);
        }
        
        // Find user by email
        const existingUser = await User.findOne({ email });
        
        if (existingUser) {
          // Update Facebook ID if not set
          if (!existingUser.facebookId) {
            existingUser.facebookId = profile.id;
            await existingUser.save();
          }
          
          // Transform Mongoose document to match Express.User interface
          return done(null, {
            userId: existingUser._id.toString(),
            id: existingUser._id.toString(),
            role: existingUser.role
          });
        }
        
        // If user doesn't exist, return profile data to prompt for role selection
        return done(null, {
          userId: '', // Placeholder to satisfy type
          id: '',     // Placeholder to satisfy type
          role: '',   // Placeholder to satisfy type
          needsRoleSelection: true,
          facebookProfile: {
            id: profile.id,
            email,
            name: `${profile.name?.givenName || ''} ${profile.name?.familyName || ''}`.trim(),
            picture: profile.photos && profile.photos[0] ? profile.photos[0].value : undefined,
          }
        });
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

// Passport serialization and deserialization
passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((obj, done) => {
  done(null, obj as Express.User);
});

export default passport; 