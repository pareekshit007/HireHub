const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

// Only init Google strategy if real credentials are provided
if (
  process.env.GOOGLE_CLIENT_ID !== 'skip_for_now' &&
  process.env.GOOGLE_CLIENT_SECRET !== 'skip_for_now'
) {
  passport.use(
    new GoogleStrategy(
      {
        clientID:     process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL:  process.env.GOOGLE_CALLBACK_URL,
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails[0].value;
          let user = await User.findOne({ email });

          if (user) {
            if (!user.googleId) {
              user.googleId   = profile.id;
              user.isVerified = true;
              user.avatar     = user.avatar || profile.photos[0]?.value;
              await user.save();
            }
            return done(null, user);
          }

          user = await User.create({
            googleId:     profile.id,
            name:         profile.displayName,
            email,
            avatar:       profile.photos[0]?.value,
            isVerified:   true,
            role:         'seeker',
            authProvider: 'google',
          });

          return done(null, user);
        } catch (err) {
          return done(err, null);
        }
      }
    )
  );
}

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id).select('-password -otp');
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

module.exports = passport;