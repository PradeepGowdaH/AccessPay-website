require("dotenv").config();
const express = require("express");
const session = require("express-session");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const MongoClient = require("mongodb").MongoClient;
const path = require("path");

const app = express();

// Serve static files from the public directory
app.use(express.static("public"));

// Configure session middleware
app.use(
  session({
    secret: "cats", // Make sure SESSION_SECRET is defined in your .env file
    resave: false,
    saveUninitialized: false,
  })
);


// Initialize Passport and restore authentication state, if any, from the session.
app.use(passport.initialize());
app.use(passport.session());

// Connect to MongoDB
const connectToDatabase = async () => {
  const client = new MongoClient("mongodb://127.0.0.1:27017/AccessPay");
  await client.connect();
  return client.db("AccessPay");
};

// Configure Passport to use Google OAuth strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: "",
      clientSecret: "",
      callbackURL: "http://localhost:3000/auth/google/callback",
    },
    async function (accessToken, refreshToken, profile, cb) {
      const db = await connectToDatabase();
      const usersCollection = db.collection("Customers");

      // Check if the user already exists in the database
      const existingUser = await usersCollection.findOne({
        googleId: profile.id,
      });
      if (existingUser) {
        // If the user exists, return the user object
        return cb(null, existingUser);
      } else {
        // If the user does not exist, create a new user document
        const newUser = {
          googleId: profile.id,
          displayName: profile.displayName,
          email: profile.emails[0].value,
          username: profile.displayName, // Placeholder for Username
          password: "",
          aadhar_number: "", // Placeholder for Aadhar Number
          pan_number: "", // Placeholder for PAN Number
          first_name: "", // Placeholder for First Name
          second_name: "", // Placeholder for Second Name
          address: "", // Placeholder for Address
          phone_number: "",
          credit_score: 0,
          bank: [], // Placeholder for Bank Information
          reward_balance: 0, // Placeholder for Reward Balance
          rewards_history: [], // Placeholder for Rewards History
          loans: [], // Placeholder for Loans
          transactions: [], // Placeholder for Transactions
          budget: [], // Placeholder for Budget
        };
        await usersCollection.insertOne(newUser);
        // Return the new user object
        return cb(null, newUser);
      }
    }
  )
);

// Configure Passport to serialize and deserialize user instances to and from the session
passport.serializeUser(function (user, done) {
  done(null, user.googleId);
});

passport.deserializeUser(async function (googleId, done) {
  const db = await connectToDatabase();
  const usersCollection = db.collection("Customers");
  const user = await usersCollection.findOne({ googleId: googleId });
  done(null, user);
});

// Define routes
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "public", "login.html"));
});

app.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

app.get(
  "/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/login" }),
  function (req, res) {
    // Successful authentication, redirect to Homepage-logged-in.html.
    res.redirect("/Homepage-logged-in.html");
  }
);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});