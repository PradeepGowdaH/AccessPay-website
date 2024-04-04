const express = require("express");
const nodemailer = require('nodemailer');
const MongoClient = require("mongodb").MongoClient;
const session = require('express-session');
const path = require('path'); // Import the path module
const app = express();
const port = 5500;

app.use(express.static(path.join(__dirname)));

app.use(session({
  secret: process.env.SESSION_SECRET || 'default_secret', // Use environment variable or fallback
  resave: false,
  saveUninitialized: false
}));

app.use(express.json());
const cors = require('cors');
app.use(cors());


const mongoURI = "mongodb://0.0.0.0:27017/AccessPay";
const customerId = "google_id_6";


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
      googleId: customerId,
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

    const transactions = recentTransactions.reduce((acc, transaction) => {
      const date = new Date(transaction.isoDate);
      const monthNumber = date.getMonth() + 1; // JavaScript months are 0-indexed

      if (!acc[monthNumber]) {
        acc[monthNumber] = { amount: 0 };
      }
      acc[monthNumber].amount += transaction.amount;
      return acc;
    }, {});

    const transactionsData = Object.entries(transactions).map(
      ([monthNumber, { amount }]) => ({
        monthNumber,
        amount,
      })
    );

    res.json(transactionsData);
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
      googleId: customerId,
    });
    if (!customer) {
      return res.status(404).send("Customer not found.");
    }

    const currentDate = new Date();
    const fiveWeeksAgo = new Date(
      currentDate.setDate(currentDate.getDate() - 35)
    );
    const recentTransactions = customer.transactions.filter(
      (transaction) => new Date(transaction.isoDate) >= fiveWeeksAgo
    );

    const transactions = recentTransactions.reduce((acc, transaction) => {
      const date = new Date(transaction.isoDate);
      const weekNumber = date.getWeek();

      if (!acc[weekNumber]) {
        acc[weekNumber] = { amount: 0 };
      }
      acc[weekNumber].amount += transaction.amount;
      return acc;
    }, {});

    const transactionsData = Object.entries(transactions).map(
      ([weekNumber, { amount }]) => ({
        weekNumber,
        amount,
      })
    );

    res.json(transactionsData);
    client.close();
  } catch (error) {
    console.error("Error fetching transactions for customer:", error);
    res.status(500).send("Error fetching transactions for customer.");
  }
});
// Generate OTP
function generateOTP() {
  const length = 6;
  const characters = '0123456789';
  let otp = '';

  for (let i = 0; i < length; i++) {
    otp += characters[Math.floor(Math.random() * characters.length)];
  }

  return otp;
}

// Create Nodemailer transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'accesspay2024@gmail.com',
    pass: 'wgak pjic bevd sjwm'
  }
});

app.post('/signup', (req, res) => {
  const otp = generateOTP();
  req.session.OTP = otp;
  console.log(`Stored OTP in session: ${req.session.OTP}`);
  const mailOptions = {
    from: 'accesspay2024@gmail.com',
    to: 'pavannagu2002@gmail.com',
    subject: 'OTP Verification',
    html: `<p>Your OTP is: ${otp}</p>`
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log(error);
      res.json({
        success: false,
        message: 'Error sending OTP email.'
      });
    } else {
      console.log(`Email sent: ${info.response}`);
      console.log(otp);
      res.json({
        success: true,
        message: `OTP sent to ${req.body.email}`,
        otp
      });
    }
  });
});

app.post('/verify-otp', (req, res) => {
  const userOTP = req.body.otp;
  const userEmail = req.body.email;
  const storedOTP = req.session.OTP;
  console.log(`User OTP: ${userOTP}`); // Debugging line
  console.log(`Stored OTP: ${storedOTP}`); // Debugging line

  if (userOTP === storedOTP) {
    // OTP is valid, proceed with registration
    res.json({
      success: true,
      message: 'OTP is valid.'
    });
  } else {
    // OTP is invalid
    console.log('Invalid OTP');
    res.json({
      success: false,
      message: 'Invalid OTP. Please try again.'
    });
  }
});
app.post('/store-signup-data', (req, res) => {
  const { name, email, phoneNumber, password } = req.body;
  // Connect to MongoDB and insert the signup data
  MongoClient.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true }, (err, client) => {
     if (err) {
       console.error(err);
       res.status(500).send("Error connecting to MongoDB.");
       return;
     }
     const db = client.db("AccessPay");
     const usersCollection = db.collection("Users");
 
     usersCollection.insertOne({ name, email, phoneNumber, password }, (err, result) => {
       if (err) {
         console.error(err);
         res.status(500).send("Error inserting signup data.");
         return;
       }
       res.json({ success: true, message: "Signup data stored successfully." });
       client.close();
     });
  });
 });

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
