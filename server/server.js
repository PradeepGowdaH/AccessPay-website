require("dotenv").config();
const express = require("express");
const MongoClient = require("mongodb").MongoClient;
const app = express();
const multer = require("multer");
const XLSX = require("xlsx");
const upload = multer({ dest: "uploads/" });
const fs = require("fs");
const mongoose = require("mongoose");
const path = require("path");
const session = require("express-session");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const bcrypt = require("bcrypt");
const { v4: uuidv4 } = require("uuid"); // For generating unique transaction IDs
const nodemailer = require("nodemailer");
const cors = require("cors");
const bodyParser = require("body-parser");
const crypto = require("crypto");
const port = 3000;

const mongoURI = "mongodb://0.0.0.0:27017/AccessPay";
// let email = "pradeephgowda.pg@gmail.com";
//let email = "Peter.kevin@example.com";
let email = null;
const admin_email_address = "accesspay2024@gmail.com";
// Middleware to parse JSON bodies
app.use(express.json());

// Middleware to parse URL-encoded bodies
app.use(express.urlencoded({ extended: true }));

app.use(express.static("public"));

app.use(cors());

// OAuth Log-in & Sign-up

app.use(
  session({
    secret: process.env.SESSION_SECRET, // Make sure SESSION_SECRET is defined in your .env file
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
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "http://localhost:3000/auth/google/callback",
    },
    async function (accessToken, refreshToken, profile, cb) {
      const db = await connectToDatabase();
      const usersCollection = db.collection("Customers");

      const existingUser = await usersCollection.findOne({
        email: profile.emails[0].value,
      });
      if (existingUser) {
        email = existingUser.email; // Set the global variable
        console.log(`User email: ${email}`); // Log the user's email
        return cb(null, existingUser);
      } else {
        // Split the displayName into first_name and second_name
        const nameParts = profile.displayName.split(" ");
        const first_name = nameParts[0];
        const second_name =
          nameParts.length > 1 ? nameParts.slice(1).join(" ") : "";

        const newUser = {
          googleId: profile.id,
          googleName: profile.displayName,
          email: profile.emails[0].value,
          password: "",
          aadhar_number: "", // Placeholder for Aadhar Number
          pan_number: "", // Placeholder for PAN Number
          first_name: first_name, // Assign the first part of the name
          second_name: second_name, // Assign the rest of the name
          address: "", // Placeholder for Address
          phone_number: "",
          wallet_address: "",
          credit_score: 500,
          bank: [], // Placeholder for Bank Information
          reward_balance: 0,
          initial_balance: 0, // Placeholder for Reward Balance
          rewards_history: [], // Placeholder for Rewards History
          loans: [], // Placeholder for Loans
          transactions: [], // Placeholder for Transactions
          budget: [], // Placeholder for Budget
        };
        await usersCollection.insertOne(newUser);
        email = newUser.email; // Set the global variable
        console.log(`User email: ${email}`); // Log the user's email
        return cb(null, newUser);
      }
    }
  )
);

// Configure Passport to serialize and deserialize user instances to and from the session
passport.serializeUser(function (user, done) {
  done(null, user.email);
});

passport.deserializeUser(async function (email, done) {
  const db = await connectToDatabase();
  const usersCollection = db.collection("Customers");
  const user = await usersCollection.findOne({ email: email });
  done(null, user);
});

// Define routes
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "public", "login.html"));
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "public", "signup.html"));
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

//Credit score

// Function to calculate and update the user's credit score based on email
async function getCreditScoreByEmail(email) {
  const client = new MongoClient(mongoURI);

  try {
    await client.connect();
    const database = client.db(); // AccessPay is specified in the URI, so no need to specify it here
    const customersCollection = database.collection("Customers");

    // Fetch the user document by email
    const user = await customersCollection.findOne({ email: email });
    if (!user) {
      return { success: false, message: "User not found" };
    }

    // Calculate the new credit score
    let newCreditScore = user.credit_score;
    user.transactions.forEach((transaction) => {
      if (transaction.mode === "sent") {
        newCreditScore += 3;
      }
    });

    return { success: true, creditScore: newCreditScore };
  } catch (err) {
    console.error(err);
    return { success: false, message: "An error occurred" };
  } finally {
    await client.close();
  }
}

// New endpoint to expose the credit score
app.get("/credit-score", async (req, res) => {
  const result = await getCreditScoreByEmail(email);
  if (result.success) {
    res.json({ creditScore: result.creditScore });
  } else {
    res.status(500).json({ error: result.message });
  }
});

// Import transactions

let client;
MongoClient.connect(mongoURI)
  .then((connectedClient) => {
    client = connectedClient;
    console.log("Connected to MongoDB");
  })
  .catch((err) => console.error("Failed to connect to MongoDB", err));

async function insertDataToMongoDB(collectionName, data, email) {
  const collection = client.db("AccessPay").collection(collectionName);
  try {
    const result = await collection.findOneAndUpdate(
      { email: email },
      { $push: { transactions: { $each: data } } },
      { upsert: true, returnOriginal: false }
    );
    console.log(`Updated document for user ${email}`);
    return result.value;
  } catch (e) {
    console.error(`Error updating MongoDB: ${e.message}`);
    throw e;
  }
}

app.post("/upload", upload.single("file"), async (req, res) => {
  try {
    const collectionName = "Customers";
    const workbook = XLSX.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet);
    const updatedDocument = await insertDataToMongoDB(
      collectionName,
      data,
      email
    );
    res.send("Data uploaded and added to user document successfully");
  } catch (e) {
    console.error(`Error during upload: ${e.message}`);
    res.status(500).send("Error uploading data");
  }
});

// Export Transactions

mongoose.connect(mongoURI, {
  serverSelectionTimeoutMS: 90000, // Increase timeout to 5 seconds
  family: 4, // Force IPv4
});

// Define the Customer schema
const customerSchema = new mongoose.Schema({
  transactions: Array,
  pan_number: String,
});

// Create the Customer model
const Customer = mongoose.model("Customer", customerSchema, "Customers");

// Route to fetch transactions for a specific customer and send as Excel
app.get("/export-transactions", async (req, res) => {
  try {
    const panNumber = req.query.panNumber;
    if (!panNumber) {
      return res.status(400).send("PAN Number is required");
    }

    const customer = await Customer.findOne(
      { pan_number: panNumber },
      "transactions"
    );
    if (!customer) {
      return res.status(404).send("Customer not found");
    }

    const transactions = customer.transactions;

    // Create a new workbook and add a worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(transactions);
    XLSX.utils.book_append_sheet(wb, ws, "Transactions");

    // Write the workbook to a file
    const filename = "transactions.xlsx";
    const filePath = path.join(__dirname, filename);
    XLSX.writeFile(wb, filePath);

    // Send the file as a download
    res.download(filePath, (err) => {
      if (err) {
        console.error(err);
        res.status(500).send("Error sending file");
      } else {
        // Delete the file after sending
        fs.unlink(filePath, (err) => {
          if (err) console.error(err);
        });
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error fetching transactions");
  }
});

//Username

// Add this route to your Express server
app.get("/api/first-name", async (req, res) => {
  try {
    const client = await MongoClient.connect(mongoURI);
    const db = client.db();
    const customersCollection = db.collection("Customers");

    const customer = await customersCollection.findOne({
      email: email,
    });
    if (!customer) {
      return res.status(404).send("Customer not found.");
    }
    res.json({ firstName: customer.first_name });
    client.close();
  } catch (error) {
    console.error("Error fetching first name:", error);
    res.status(500).send("Error fetching first name.");
  }
});


// Redeem History (Admin only)
app.get("/api/redeem-history", async (req, res) => {
  try {
    const client = await MongoClient.connect(mongoURI);
    const db = client.db();
    const customersCollection = db.collection("Customers");

    // Assuming you have a way to identify the customer, e.g., through a query parameter or a session
    // For demonstration, let's use a hardcoded email
    // Replace this with the actual customer ID retrieval logic

    const customer = await customersCollection.findOne({
      email: admin_email_address,
    });

    if (!customer) {
      return res.status(404).send("Admin not found.");
    }

    // Assuming the rewards history is stored in a field named 'rewards_history'
    const redeemHistory = customer.redeem_history;

    res.json(redeemHistory);
    client.close();
  } catch (error) {
    console.error("Error fetching rewards history for customer:", error);
    res.status(500).send("Error fetching rewards history for customer.");
  }
});

// Pavan's Login, Signup and register

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(
  session({
    secret: process.env.SESSION_SECRET, // Replace with your own secret key
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 3000000 }, // 50 minutes
  })
);

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000);
}

async function sendOTP(email, otp) {
  let transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "accesspay2024@gmail.com",
      pass: "wgak pjic bevd sjwm",
    },
  });

  let mailOptions = {
    from: "accesspay2024@gmail.com",
    to: email,
    subject: "Your OTP",
    text: `Your OTP is ${otp}`,
  };

  await transporter.sendMail(mailOptions);
}

async function storeUser(Customers) {
  const CustomerCollection = db.collection("Customers");
  const result = await CustomerCollection.insertOne(Customers);
  console.log(`User stored with the following id: ${result.insertedId}`);
}

app.post("/signup", async (req, res) => {
  try {
    let { username, email: userEmail, password, phone_number } = req.body; // Renamed local email to userEmail
    console.log(userEmail);
    const nameParts = username.split(" ");
    const first_name = nameParts[0];
    const second_name = nameParts.slice(1).join(" ");
    console.log(first_name);
    const client = await MongoClient.connect(mongoURI);
    const db = client.db();
    const customersCollection = db.collection("Customers");

    const existingUser = await customersCollection.findOne({
      email: userEmail,
    });
    if (existingUser) {
      return res.status(400).json({
        message: "A user with this email already exists. Please log in.",
      });
    }

    // If no user with the same email exists, proceed with OTP generation and sending
    const otp = generateOTP();
    await sendOTP(userEmail, otp);
    req.session.otp = otp;
    req.session.email = userEmail; // Use the local userEmail variable
    const userData = {
      googleId: "",
      googleName: "",
      email: userEmail, // Use the local userEmail variable
      password: password,
      first_name: first_name,
      second_name: second_name,
      // Set default or placeholder values for additional fields
      aadhar_number: "",
      pan_number: "",
      wallet_address: "",
      address: "",
      phone_number: phone_number,
      credit_score: 500,
      bank: [],
      reward_balance: 0,
      initial_balance: 0,
      rewards_history: [],
      loans: [],
      transactions: [],
      budget: [],
    };
    req.session.user = userData;
    // Store user data in session
    res.json({ message: "OTP sent", otp });
    console.log(otp);
  } catch (error) {
    console.error("Error in /signup route:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.post("/verify-otp", async (req, res) => {
  try {
    // Extract OTP from req.body
    const { otp } = req.body;
    console.log(req.session.otp);
    console.log(otp);
    // Check if the OTP matches the one stored in the session
    if (req.session.otp == otp) {
      // OTP is correct, proceed with storing the user data in MongoDB
      const userData = req.session.user;
      // Assuming you have a function to hash the password before storing it

      // Connect to the database
      const client = await MongoClient.connect(mongoURI);
      const db = client.db();
      const customersCollection = db.collection("Customers");

      // Insert the user data into the database
      const result = await customersCollection.insertOne(userData);
      console.log(`User stored with the following id: ${result.insertedId}`);

      // Clear the OTP and user data from the session
      req.session.otp = null;

      res.status(200).json({ message: "User registered successfully" });
    } else {
      // OTP is incorrect
      res.status(400).json({ message: "Incorrect OTP" });
    }
  } catch (error) {
    console.error("Error in /verify-otp route:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Register

app.post("/register", async (req, res) => {
  try {
    const {
      BANK_ACCOUNT_NUMBER,
      CONFIRM_BANK_ACCOUNT_NUMBER,
      BANK_NAME,
      AADHAR_CARD_NUMBER,
      WALLET_ADDRESS,
      ADDRESS,
      BANK_BRANCH,
      IFSC_CODE,
      PAN_CARD_NUMBER,
      LOAN_TYPE,
      LOAN_AMOUNT,
      LOAN_DURATION,
    } = req.body;

    // Determine the email to use for updating user details
    let emailToUse = email; // Start with the global email variable
    if (!emailToUse) {
      // If the global email variable is null, use the email from the session
      emailToUse = req.session.email;
      if (!emailToUse) {
        return res.status(400).json({
          message:
            "Email not found in session or global variable. Please verify your email first.",
        });
      }
    }

    // Connect to the database
    const client = await MongoClient.connect(mongoURI);
    const db = client.db();
    const customersCollection = db.collection("Customers");

    // Prepare the update object with all fields from the form
    const update = {
      $set: {
        aadhar_number: AADHAR_CARD_NUMBER,
        address: ADDRESS,
        pan_number: PAN_CARD_NUMBER,
        email: emailToUse,
        wallet_address: WALLET_ADDRESS, // Use the determined email
        bank: [
          {
            bank_account_number: BANK_ACCOUNT_NUMBER,
            confirmBankAccountNumber: CONFIRM_BANK_ACCOUNT_NUMBER,
            bank_name: BANK_NAME,
            bank_branch: BANK_BRANCH,
            bank_ifsc: IFSC_CODE,
          },
        ],
        loans: [
          {
            loan_id : "LN123456789",
            bank_name : "ICICI",
            bank_branch : "Rajajinagar",
            bank_ifsc: "ICIC202404",
            tenure : 0,
            months_paid : 0,
            months_left : 0,
            rate_of_interest : 0,
            amount_paid : 0,
            emi: "",
            loan_type: "",
            loan_amount: 0,
            loan_duration: "",
            loan_payments : []
          },
        ],
      },
    };

    // Update the user document
    const result = await customersCollection.updateOne(
      { email: emailToUse },
      update
    );
    if (result.modifiedCount === 0) {
      return res
        .status(500)
        .json({ message: "Failed to update user information" });
    }

    res.json({ message: "register done successfully" });
  } catch (error) {
    console.error("Error in /register route:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.post("/login", async (req, res) => {
  try {
    const { email: userEmail, password } = req.body; // Renamed local email to userEmail
    // Connect to the database
    const client = await MongoClient.connect(mongoURI);
    const db = client.db();
    const customersCollection = db.collection("Customers");
    const user = await customersCollection.findOne({ email: userEmail });

    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    if (password != user.password) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    let responseMessage = "Login successful";
    if (userEmail === admin_email_address) {
      responseMessage = "Admin login";
    }
    email = userEmail;
    // Send a single response
    console.log(user.email);
    res.json({ message: responseMessage, email: user.email });
  } catch (error) {
    console.error("Error in /login route:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Serve the login page
app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "public", "login.html"));
});

// Serve the register page
app.get("/register", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "public", "register.html"));
});

// Serve the signup page
app.get("/signup", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "public", "signup.html"));
});

// Serve the OTP verification page
app.get("/verify-otp", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "public", "signup-otp.html"));
});

app.post("/wallet", async (req, res) => {
  try {
    const { cryptoAddress } = req.body;

    let emailToUse = email; // Start with the global email variable
    if (!emailToUse) {
      // If the global email variable is null, use the email from the session
      if (!emailToUse) {
        return res.status(400).json({
          message:
            "Email not found in session or global variable. Please verify your email first.",
        });
      }
    }

    // Connect to the database
    const client = await MongoClient.connect(mongoURI);
    const db = client.db();
    const customersCollection = db.collection("Customers");

    // Prepare the update object with the new crypto wallet address
    const update = {
      $set: {
        wallet_address: cryptoAddress,
      },
    };

    // Update the user document
    const result = await customersCollection.updateOne(
      { email: emailToUse },
      update
    );
    if (result.modifiedCount === 0) {
      return res
        .status(500)
        .json({
          success: true,
          message: "Failed to update crypto wallet address",
        });
    }

    res.json({
      success: true,
      message: "Crypto wallet address updated successfully",
    });
  } catch (error) {
    console.error("Error in /update-crypto-address route:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

//Chart code

// Transactions // Pradeep

Date.prototype.getWeek = function () {
  var oneJan = new Date(this.getFullYear(), 0, 1);
  var week = Math.ceil(((this - oneJan) / 86400000 + oneJan.getDay() + 1) / 7);
  return week;
};

app.get("/api/transactions", async (req, res) => {
  try {
    const client = await MongoClient.connect(mongoURI);
    const db = client.db();
    const customersCollection = db.collection("Customers");

    const customer = await customersCollection.findOne({
      email: email,
    });
    if (!customer) {
      return res.status(404).send("Customer not found.");
    }

    const currentDate = new Date();
    const oneYearAgo = new Date(
      currentDate.setFullYear(currentDate.getFullYear() - 1)
    );
    const recentTransactions = customer.transactions.filter(
      (transaction) => new Date(transaction.isoDate) >= oneYearAgo
    );

    // Return the raw transaction data instead of aggregated data
    res.json(recentTransactions);
    client.close();
  } catch (error) {
    console.error("Error fetching transactions for customer:", error);
    res.status(500).send("Error fetching transactions for customer.");
  }
});

app.get("/api/transactions-monthly", async (req, res) => {
  try {
    const client = await MongoClient.connect(mongoURI);
    const db = client.db();
    const customersCollection = db.collection("Customers");

    const customer = await customersCollection.findOne({
      email: email, // Replace with actual email or parameter
    });
    if (!customer) {
      return res.status(404).send("Customer not found.");
    }

    const transactions = await customersCollection
      .aggregate([
        { $match: { email: email } }, // Replace with actual email or parameter
        { $unwind: "$transactions" },
        {
          $group: {
            _id: {
              month: { $month: { $toDate: "$transactions.isoDate" } }, // Convert string to date
              year: { $year: { $toDate: "$transactions.isoDate" } }, // Convert string to date
            },
            totalAmount: { $sum: "$transactions.amount" },
          },
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } },
      ])
      .toArray();

    // Convert month numbers to names without "month" prefix
    const transactionsWithMonthNames = transactions.map((transaction) => ({
      ...transaction,
      _id: {
        month: new Date(0, transaction._id.month - 1).toLocaleString(
          "default",
          { month: "long" }
        ),
        year: transaction._id.year,
      },
    }));

    res.json(transactionsWithMonthNames);
    client.close();
  } catch (error) {
    console.error("Error fetching transactions for customer:", error);
    res.status(500).send("Error fetching transactions for customer.");
  }
});


app.get("/api/transactions-weekly", async (req, res) => {
  try {
    const client = await MongoClient.connect(mongoURI);
    const db = client.db();
    const customersCollection = db.collection("Customers");

    const customer = await customersCollection.findOne({
      email: email, // Replace with actual email or parameter
    });
    if (!customer) {
      return res.status(404).send("Customer not found.");
    }

    const transactions = await customersCollection
      .aggregate([
        { $match: { email: email } }, // Replace with actual email or parameter
        { $unwind: "$transactions" },
        {
          $group: {
            _id: {
              week: { $week: { $toDate: "$transactions.isoDate" } }, // Convert string to date
              year: { $year: { $toDate: "$transactions.isoDate" } }, // Convert string to date
            },
            totalAmount: { $sum: "$transactions.amount" },
          },
        },
        { $sort: { "_id.year": 1, "_id.week": 1 } },
      ])
      .toArray();

    res.json(transactions);
    client.close();
  } catch (error) {
    console.error("Error fetching transactions for customer:", error);
    res.status(500).send("Error fetching transactions for customer.");
  }
});

// Rewards history  // Nishanth

app.get("/api/rewards-history", async (req, res) => {
  try {
    const client = await MongoClient.connect(mongoURI);
    const db = client.db();
    const customersCollection = db.collection("Customers");

    // Assuming you have a way to identify the customer, e.g., through a query parameter or a session
    // For demonstration, let's use a hardcoded customerId
    // Replace this with the actual customer ID retrieval logic

    const customer = await customersCollection.findOne({
      email: email,
    });

    if (!customer) {
      return res.status(404).send("Customer not found.");
    }

    // Assuming the rewards history is stored in a field named 'rewards_history'
    const rewardsHistory = customer.rewards_history;

    res.json(rewardsHistory);
    client.close();
  } catch (error) {
    console.error("Error fetching rewards history for customer:", error);
    res.status(500).send("Error fetching rewards history for customer.");
  }
});

//Change Password

app.post("/changepassword", async (req, res) => {
  try {
    const client = await MongoClient.connect(mongoURI);
    const db = client.db();
    const customersCollection = db.collection("Customers");

    const { currentpassword, newpassword, confirmpassword } = req.body;

    // Assuming you have a way to identify the customer, e.g., through a session or a token
    // For demonstration, let's use a hardcoded customerId
    // Replace this with the actual customer ID retrieval logic

    const customer = await customersCollection.findOne({
      email: email,
    });

    if (!customer) {
      return res.status(404).send("Customer not found.");
    }

    // Fetch the current password from the database and compare it with the entered password
    if (currentpassword !== customer.password) {
      return res.status(400).send("Current password is incorrect.");
    }

    // Check if new password and confirmation match
    if (newpassword !== confirmpassword) {
      return res
        .status(400)
        .send("New password and confirmation do not match.");
    }

    // Update the password in the database
    await customersCollection.updateOne(
      { email: email },
      { $set: { password: newpassword } }
    );

    res.send("Password changed successfully.");
    client.close();
  } catch (error) {
    console.error("Error changing password:", error);
    res.status(500).send("Error changing password.");
  }
});

//Budget

app.post("/fetch-budget", async (req, res) => {
  const { monthYear } = req.body;
  const client = await MongoClient.connect(mongoURI);
  const db = client.db();
  const customersCollection = db.collection("Customers");

  const customer = await customersCollection.findOne({ email: email });
  if (!customer) {
    return res.status(404).send("Customer not found.");
  }

  const budget = customer.budget.find((b) => b.month_year === monthYear);
  if (!budget) {
    // Return a JSON response with a message indicating no budget found
    return res
      .status(404)
      .json({ message: "Budget not found for the specified month and year." });
  }

  const labels = Object.keys(budget).filter((key) => key !== "month_year");
  const data = Object.values(budget).slice(1);
  const colors = labels.map(
    () => "#" + Math.floor(Math.random() * 16777215).toString(16)
  );

  res.json({ labels, data, colors });
});

app.get("/fetch-months", async (req, res) => {
  const client = await MongoClient.connect(mongoURI);
  const db = client.db();
  const customersCollection = db.collection("Customers");

  const customer = await customersCollection.findOne({ email: email });
  if (!customer) {
    return res.status(404).send("Customer not found.");
  }

  const months = customer.budget.map((b) => b.month_year);
  res.json(months);
});

app.post("/add-budget-category", async (req, res) => {
  const { categoryName, categoryAmount } = req.body;
  // Format the current month and year to match the expected format in the database
  const currentMonthYear = new Date()
    .toLocaleString("default", {
      month: "long",
      year: "numeric",
    })
    .replace(/ /g, ", "); // Replace spaces with ', ' to match the expected format

  try {
    const client = await MongoClient.connect(mongoURI);
    const db = client.db();
    const customersCollection = db.collection("Customers");

    const customer = await customersCollection.findOne({
      email: email,
    });
    if (!customer) {
      return res.status(404).send("Customer not found.");
    }

    // Find the budget entry for the current month and year, case-insensitive
    let budgetEntry = customer.budget.find(
      (b) => b.month_year.toLowerCase() === currentMonthYear.toLowerCase()
    );

    if (!budgetEntry) {
      // If there's no budget entry for the current month, create a new one
      budgetEntry = { month_year: currentMonthYear };
      customer.budget.push(budgetEntry);
    }

    // Update the budget entry with the new category
    budgetEntry[categoryName] = parseInt(categoryAmount, 10);

    await customersCollection.updateOne(
      { email: email },
      { $set: { budget: customer.budget } }
    );

    res.json({ message: "Budget category added successfully." });
    client.close();
  } catch (error) {
    console.error("Error adding budget category:", error);
    res.status(500).send("Error adding budget category.");
  }
});

// Loan

app.get("/loan-data", async (req, res) => {
  const client = await MongoClient.connect(mongoURI);
  const db = client.db("AccessPay");
  const collection = db.collection("Customers");

  const customer = await collection.findOne({ email: email });
  if (!customer) {
    return res.status(404).send("Customer not found.");
  }

  const loanData = customer.loans[0]; // Assuming you want to plot the first loan
  const monthsPaid = loanData.months_paid;
  const monthsLeft = loanData.months_left;

  res.json({ monthsPaid, monthsLeft });
});

app.get("/api/loan-details", async (req, res) => {
  try {
    const client = await MongoClient.connect(mongoURI);
    const db = client.db();
    const customersCollection = db.collection("Customers");

    const customer = await customersCollection.findOne({
      email: email,
    });
    if (!customer) {
      return res.status(404).send("Customer not found.");
    }

    // Assuming the loan details are stored in a field named 'loans'
    const loanDetails = customer.loans[0]; // Assuming you want to display the first loan

    // Construct the loan object to send to the client
    const loanObject = {
      loan_amount: loanDetails.loan_amount,
      emi: parseFloat(loanDetails.emi),
      tenure: loanDetails.tenure,
      months_paid: loanDetails.months_paid,
      rate_of_interest: loanDetails.rate_of_interest,
      loan_payments: loanDetails.loan_payments,
      bank_name: loanDetails.bank_name, 
      bank_branch: loanDetails.bank_branch, 
      bank_ifsc: loanDetails.bank_ifsc,
    };

    res.json(loanObject);
    client.close();
  } catch (error) {
    console.error("Error fetching loan details for customer:", error);
    res.status(500).send("Error fetching loan details for customer.");
  }
});

// Add expense lol

app.post("/api/add-transaction", async (req, res) => {
  try {
     const client = await MongoClient.connect(mongoURI);
     const db = client.db();
     const customersCollection = db.collection("Customers");
 
     const transactionData = req.body;
     transactionData.transaction_id = uuidv4(); // Generate a unique transaction ID
 
     // Calculate 1% of the expenseAmount
     const rewardIncrement = transactionData.amount * 0.0001;
 
     // Update the reward_balance and initial_balance fields
     const updateResult = await customersCollection.updateOne(
       { email: email },
       {
         $push: { transactions: transactionData },
         $inc: { reward_balance: rewardIncrement, initial_balance: rewardIncrement },
       }
     );
 
     if (updateResult.modifiedCount === 0) {
       return res
         .status(404)
         .send("Customer not found or transaction not added.");
     }
 
     res.json({ message: "Transaction added successfully", transactionData });
     client.close();
  } catch (error) {
     console.error("Error adding transaction:", error);
     res.status(500).send("Error adding transaction.");
  }
 });
 

//loan-details

app.get("/api/loan-details", async (req, res) => {
  try {
    const client = await MongoClient.connect(mongoURI);
    const db = client.db();
    const customersCollection = db.collection("Customers");

    const customer = await customersCollection.findOne({
      email: email,
    });
    if (!customer) {
      return res.status(404).send("Customer not found.");
    }

    // Check if the customer has any loans
    if (customer.loans.length > 0) {
      // Assuming you want to display the first loan
      const loanDetails = customer.loans[0];
      const loanObject = {
        loan_id: loanDetails.loan_id, // Ensure this is not empty if the loan exists
        loan_amount: loanDetails.loan_amount,
        emi: parseFloat(loanDetails.emi),
        tenure: loanDetails.tenure,
        months_paid: loanDetails.months_paid,
        rate_of_interest: loanDetails.rate_of_interest,
        loan_payments: loanDetails.loan_payments,
        bank_name: loanDetails.bank_name, 
        bank_branch: loanDetails.bank_branch, 
        bank_ifsc: loanDetails.bank_ifsc,
      };
      res.json(loanObject);
    } else {
      // If no loans, return an object with an empty loan_id
      res.json({ loan_id: "" });
    }
    client.close();
  } catch (error) {
    console.error("Error fetching loan details for customer:", error);
    res.status(500).send("Error fetching loan details for customer.");
  }
});

// Add this route to your server.js file
app.post("/apply-loan", async (req, res) => {
  const { loan_type, loan_amount, tenure, emi, rate_of_interest } = req.body;

  try {
    const client = await MongoClient.connect(mongoURI);
    const db = client.db();
    const customersCollection = db.collection("Customers");

    // Assuming the first loan in the array is the one to be updated
    const customer = await customersCollection.findOne({ email: email });
    if (!customer) {
      return res.status(404).send("Customer not found.");
    }

    // Update the first loan in the array
    const loanIndex = 0; // Assuming you want to update the first loan
    if (customer.loans[loanIndex]) {
      customer.loans[loanIndex].loan_type = loan_type;
      customer.loans[loanIndex].loan_amount = loan_amount;
      customer.loans[loanIndex].tenure = parseInt(tenure);
      customer.loans[loanIndex].months_left = parseInt(tenure);
      customer.loans[loanIndex].emi = emi;
      customer.loans[loanIndex].rate_of_interest = parseFloat(rate_of_interest);

      // Update the customer document in the database
      await customersCollection.updateOne(
        { email: email },
        { $set: { loans: customer.loans } }
      );
      res.status(200).send("Loan application successful.");
    } else {
      res.status(400).send("No loan found to update.");
    }
  } catch (error) {
    console.error("Error applying for loan:", error);
    res.status(500).send("Error applying for loan.");
  }
});

app.post("/update-loan-details", async (req, res) => {
  const { loan_id, loan_amount, tenure, emi, rate_of_interest } = req.body;

  try {
    const client = await MongoClient.connect(mongoURI);
    const db = client.db();
    const customersCollection = db.collection("Customers");

    const customer = await customersCollection.findOne({ email: email });
    if (!customer) {
      return res.status(404).send("Customer not found.");
    }

    const loanIndex = customer.loans.findIndex(
      (loan) => loan.loan_id === loan_id
    );
    if (loanIndex !== -1) {
      customer.loans[loanIndex].loan_amount = loan_amount;
      customer.loans[loanIndex].tenure = tenure;
      customer.loans[loanIndex].emi = emi;
      customer.loans[loanIndex].rate_of_interest = rate_of_interest;

      await customersCollection.updateOne(
        { email: email },
        { $set: { loans: customer.loans } }
      );
      res.status(200).send("Loan details updated successfully.");
    } else {
      res.status(404).send("Loan not found.");
    }
  } catch (error) {
    console.error("Error updating loan details:", error);
    res.status(500).send("Error updating loan details.");
  }
});

app.post("/pay-loan", async (req, res) => {
  const { loan_id } = req.body;
  const currentDate = new Date()
     .toLocaleDateString("en-GB", {
       day: "2-digit",
       month: "2-digit",
       year: "numeric",
     })
     .replace(/\//g, "/"); // Format date as dd/mm/yyyy
 
  try {
     const client = await MongoClient.connect(mongoURI);
     const db = client.db();
     const customersCollection = db.collection("Customers");
 
     const customer = await customersCollection.findOne({ email: email });
     if (!customer) {
       return res.status(404).json({ success: false, message: "Customer not found." });
     }
 
     const loanIndex = customer.loans.findIndex(
       (loan) => loan.loan_id === loan_id
     );
     if (loanIndex !== -1) {
       customer.loans[loanIndex].months_paid += 1;
       customer.loans[loanIndex].months_left -= 1;
       const newPayment = {
         loan_payment_id: uuidv4(),
         amount_paid: parseFloat(customer.loans[loanIndex].emi),
         date_of_payment: currentDate,
       };
       customer.loans[loanIndex].loan_payments.push(newPayment);
 
       await customersCollection.updateOne(
         { email: email },
         { $set: { loans: customer.loans } }
       );
       res.status(200).json({ success: true });
     } else {
       res.status(404).json({ success: false, message: "Loan not found." });
     }
  } catch (error) {
     console.error("Error paying loan:", error);
     res.status(500).json({ success: false, message: "Error paying loan." });
  }
 });
 

app.get("/api/loan-details-and-calculate", async (req, res) => {
  try {
    const client = await MongoClient.connect(mongoURI);
    const db = client.db();
    const customersCollection = db.collection("Customers");

    const customer = await customersCollection.findOne({
      email: email,
    });
    if (!customer) {
      return res.status(404).send("Customer not found.");
    }

    // Check if the customer has any loans
    if (customer.loans.length > 0) {
      // Assuming you want to display the first loan
      const loanDetails = customer.loans[0];
      const loanObject = {
        loan_amount: loanDetails.loan_amount,
        emi: parseFloat(loanDetails.emi),
        months_paid: loanDetails.months_paid,
        months_left: loanDetails.months_left,
        toBePaid: (
          loanDetails.months_left * parseFloat(loanDetails.emi)
        ).toFixed(2),
      };
      res.json(loanObject);
    } else {
      // If no loans, return an object with empty values
      res.json({
        loan_amount: "",
        emi: "",
        months_paid: "",
        months_left: "",
        toBePaid: "",
      });
    }
    client.close();
  } catch (error) {
    console.error("Error fetching loan details for customer:", error);
    res.status(500).send("Error fetching loan details for customer.");
  }
});

// Crypto Rewards // Eshwar

app.get("/api/reward-balance", async (req, res) => {
  try {
    const client = await MongoClient.connect(mongoURI);
    const db = client.db();
    const customersCollection = db.collection("Customers");

    const customer = await customersCollection.findOne({
      email: email,
    });

    if (!customer) {
      return res.status(404).send("Customer not found.");
    }

    res.json({
      reward_balance: customer.reward_balance,
      initial_balance: customer.initial_balance,
    });
    client.close();
  } catch (error) {
    console.error("Error fetching reward balance for customer:", error);
    res.status(500).send("Error fetching reward balance for customer.");
  }
});

//code to update both r_b and i_b
// Function to update reward balance and initial balance
async function updateRewardAndInitialBalance(newRewardBalance) {
  try {
    const client = await MongoClient.connect(mongoURI);
    const db = client.db();
    const customersCollection = db.collection("Customers");

    // Assuming you have a way to identify the customer, e.g., through a query parameter or a session
    // For demonstration, let's use a hardcoded email
    // const email = "google_id_6"; // Replace this with the actual customer ID retrieval logic

    // Check if the new reward balance is not zero
    if (newRewardBalance !== 0) {
      // Update both reward_balance and initial_balance fields
      await customersCollection.updateOne(
        { email: email },
        {
          $set: {
            reward_balance: newRewardBalance,
            initial_balance: newRewardBalance, // Update initial_balance with the new reward balance
          },
        }
      );
    } else {
      // If the new reward balance is zero, only update reward_balance
      await customersCollection.updateOne(
        { email: email },
        { $set: { reward_balance: newRewardBalance } }
      );
    }
    console.log("Reward and initial balance updated successfully.");
    client.close();
  } catch (error) {
    console.error("Error updating reward and initial balance:", error);
  }
}

// Example usage of the function
// Call this function whenever you update the reward balance in your application
// updateRewardAndInitialBalance(150); // Example call with a new reward balance of 150

app.post("/api/update-reward-balance", async (req, res) => {
  try {
    const client = await MongoClient.connect(mongoURI);
    const db = client.db();
    const customersCollection = db.collection("Customers");

    // Assuming you have a way to identify the customer, e.g., through a session or a token
    // For demonstration, let's use a hardcoded email
    // const email = "google_id_6"; // Replace this with the actual customer ID retrieval logic

    await customersCollection.updateOne(
      { email: email },
      { $set: { reward_balance: 0 } }
    );

    res.sendStatus(200); // Send a 200 OK response
    client.close();
  } catch (error) {
    console.error("Error updating reward balance:", error);
    res.status(500).send("Error updating reward balance.");
  }
});

//generating history

app.post("/api/create-rewards-history-entry", async (req, res) => {
  try {
    const client = await MongoClient.connect(mongoURI);
    const db = client.db();
    const customersCollection = db.collection("Customers");

    // Fetch the user's document to get the initial_balance
    const user = await customersCollection.findOne({ email: email });
    if (!user) {
      return res.status(404).send("User not found.");
    }

    // Generate a random transaction ID
    const transactionId = crypto.randomBytes(16).toString("hex");

    // Get the current date and time
    const date = new Date();
    const istOffset = 5.5; // IST offset in hours
    const istDate = new Date(date.getTime() + istOffset * 60 * 60 * 1000);
    const formattedDate = istDate.toISOString().split("T")[0];
    const formattedTime = istDate.toISOString().split("T")[1].split(".")[0];
    const balance = user.initial_balance; // Use the fetched initial_balance

        await customersCollection.updateOne(
          { email: admin_email_address },
          {
            $push: {
              redeem_history: {
                wallet_address: user.wallet_address,
                transaction_id: transactionId,
                email: email,
                date: formattedDate,
                time: formattedTime,
                coins: balance,
              },
            },
          }
        );

    // Update the rewards_history array in the database
    await customersCollection.updateOne(
      { email: email },
      {
        $push: {
          rewards_history: {
            transaction_id: transactionId,
            date: formattedDate,
            time: formattedTime,
            coins: balance,
            mode: "Spent",
          },
        },
      }
    );

    res.sendStatus(200); // Send a 200 OK response
    client.close();
  } catch (error) {
    console.error("Error creating rewards history entry:", error);
    res.status(500).send("Error creating rewards history entry.");
  }
});

//resetting intitial balance to 0

app.post("/api/reset-initial-balance", async (req, res) => {
  try {
     const client = await MongoClient.connect(mongoURI);
     const db = client.db();
     const customersCollection = db.collection("Customers");
 
     // Assuming the email is available in the session or request
     const customer = await customersCollection.findOne({ email: email });
     if (!customer) {
       return res.status(404).send("Customer not found.");
     }
 
     // Update the initial_balance to 0
     await customersCollection.updateOne(
       { email: email },
       { $set: { initial_balance: 0 } }
     );
 
     res.json({ message: "Initial balance reset successfully." });
     client.close();
  } catch (error) {
     console.error("Error resetting initial balance:", error);
     res.status(500).send("Error resetting initial balance.");
  }
 });
 
 



app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});