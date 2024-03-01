const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
require("dotenv").config();

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

passport.use(
  new GoogleStrategy(
    {
      clientID: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
      callbackURL: "http://localhost:5000/google/callback",
      // Remove passReqToCallback unless you need access to the request object
    },
    function (accessToken, refreshToken, profile, done) {
      try {
        // No error occurred in the function
        return done(null, profile);
      } catch (error) {
        // If an error occurs, pass it to the done callback
        return done(error, null);
      }
    }
  )
);

passport.serializeUser(function (user, done) {
  try {
    // No error occurred in the function
    done(undefined, user);
  } catch (error) {
    // If an error occurs, pass it to the done callback
    done(error, null);
  }
});

passport.deserializeUser(function (user, done) {
  try {
    // No error occurred in the function
    done(undefined, user);
  } catch (error) {
    // If an error occurs, pass it to the done callback
    done(error, null);
  }
});