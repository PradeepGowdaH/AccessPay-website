const express = require("express");
const session = require("express-session");
const passport = require("passport");
const mongoose = require("mongoose"); // Import mongoose
require("dotenv").config();

require("./auth");

// Define a MongoDB connection URL (replace 'your_database_url' with your actual database URL)
const mongoDBUrl = process.env.MONGODB_URL;
mongoose.connect(mongoDBUrl);

const db = mongoose.connection;
db.on("error", console.error.bind(console, "MongoDB connection error:"));
db.once("open", () => {
  console.log("Connected to MongoDB");
});

// Define a User model for MongoDB
const User = mongoose.model("User", {
  googleId: String,
  displayName: String,
  // Add other fields as needed
});

function isLoggedIn(req, res, next) {
  req.user ? next() : res.sendStatus(401);
}

const app = express();
app.use(session({ secret: process.env.SESSION_SECRET }));
app.use(passport.initialize());
app.use(passport.session());

app.get("/", (req, res) => {
  res.send('<a href="/auth/google">Authenticate with Google</a>');
});

app.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["email", "profile"] })
);

app.get(
  "/google/callback",
  passport.authenticate("google", {
    successRedirect: "/protected",
    failureRedirect: "/auth/failure",
  })
);

app.get("/auth/failure", (req, res) => {
  res.send("Something went wrong");
});

app.get("/protected", isLoggedIn, (req, res) => {
  res.send(`Hello ${req.user.displayName}`);
  saveUserToDatabase(req.user); // Save user to MongoDB
});

app.get("/logout", (req, res) => {
  req.logout();
  req.session.destroy();
  res.send("Goodbye");
});

function saveUserToDatabase(user) {
  // Check if the user already exists in the database
  User.findOne({ googleId: user.id })
    .then((existingUser) => {
      if (!existingUser) {
        // If the user doesn't exist, save them to the database
        const newUser = new User({
          googleId: user.id,
          displayName: user.displayName,
          // Add other fields as needed
        });

        return newUser.save();
      }
    })
    .then(() => {
      console.log("User saved to MongoDB");
    })
    .catch((err) => {
      console.error("Error saving user to MongoDB:", err);
    });
}

app.listen(5000, () => console.log("listening to port 5000"));