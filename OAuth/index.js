const express = require("express");
const session = require("express-session");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const mongoose = require("mongoose");
const flash = require("connect-flash");
require("dotenv").config();

const app = express();

// Configure MongoDB
mongoose.connect("mongodb://0.0.0.0:27017/OAuth", {
  // No options needed for the MongoDB driver version 4.0.0 and above
});
const db = mongoose.connection;

// Create a user schema
const userSchema = new mongoose.Schema({
  googleId: String,
  name: String,
  email: String,
});

const User = mongoose.model("User", userSchema);

// Configure Passport
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "http://localhost:3000/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({ googleId: profile.id });

        if (user) {
          return done(null, user);
        }

        const newUser = new User({
          googleId: profile.id,
          name: profile.displayName,
          email: profile.emails[0].value,
        });

        await newUser.save();
        return done(null, newUser);
      } catch (err) {
        console.error(err);
        return done(err, null);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  User.findById(id)
    .then((user) => done(null, user))
    .catch((err) => done(err, null));
});


// Configure Express
app.use(
  session({
    secret: process.env.SESSION_SECRET, // Use a dynamic session secret
    resave: true,
    saveUninitialized: true,
  })
);
app.use(passport.initialize());
app.use(passport.session());
app.use(flash()); // Initialize flash messages

// Routes
app.get("/", (req, res) => {
  res.send("Welcome to OAuth with Google and MongoDB!");
});

app.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

app.get(
  "/auth/google/callback",
  passport.authenticate("google", {
    failureRedirect: "/login",
    failureFlash: true,
  }),
  (req, res) => {
    // Handle successful authentication here
    res.redirect("/");
  }
);

// Logout route
app.get("/logout", function (req, res, next) {
  req.logout(function (err) {
    if (err) {
      return next(err); // Pass the error to the next middleware if any error occurs
    }
    res.redirect("/"); // Redirect to the home page after logout
    console.log("Logged out!");
  });
});

// Login route with flash messages
app.get("/login", (req, res) => {
  const errorMessage = req.flash("error")[0];
  res.send(`Login failed. ${errorMessage || ""}`);
});

// Dashboard route protected by authentication middleware
const ensureAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect("/login");
};

app.get("/dashboard", ensureAuthenticated, (req, res) => {
  res.send("Welcome to your dashboard!");
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send(`Something broke! ${err.message}`);
});


const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});