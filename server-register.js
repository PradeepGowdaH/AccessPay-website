const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const cors = require('cors');
const nodemailer = require('nodemailer');
const MongoClient = require('mongodb').MongoClient;
const bcrypt = require('bcrypt');
const app = express();
const path = require("path");
const port = 5500;

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(session({
    secret: 'your-secret-key', // Replace with your own secret key
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 300000 } // 5 minutes
}));



const uri = "mongodb://0.0.0.0:27017/AccessPay";

let db;

MongoClient.connect(uri, (err, client) => {
    if (err) {
        console.error('Failed to connect to MongoDB', err);
        return;
    }
    console.log('Connected to MongoDB');
    const db = client.db('AccessPay'); // Move db initialization inside the callback
    setupRoutes(db); // Call the function to set up routes and pass the db object
});

app.use('/static', express.static(path.join(__dirname, 'static')));
app.use(express.static('public'));
function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000);
}

async function sendOTP(email, otp) {
    let transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'accesspay2024@gmail.com',
            pass: 'wgak pjic bevd sjwm'
        }
    });

    let mailOptions = {
        from: 'accesspay2024@gmail.com',
        to: email,
        subject: 'Your OTP',
        text: `Your OTP is ${otp}`
    };

    await transporter.sendMail(mailOptions);
}

async function storeUser(Customers) {
    const collection = db.collection('Customers');
    const result = await collection.insertOne(Customers);
    console.log(`User stored with the following id: ${result.insertedId}`);
}

app.post('/signup', async (req, res) => {
    const { name, email, password, phone } = req.body;

    // Check if a user with the same email already exists
    const collection = db.collection('Customers');
    const existingUser = await collection.findOne({ email: email });
    if (existingUser) {
        // User with the same email already exists
        return res.status(400).json({ message: 'A user with this email already exists. Please log in.' });
    }

    // If no user with the same email exists, proceed with OTP generation and sending
    const otp = generateOTP();
    await sendOTP(email, otp);
    req.session.otp = otp;
    req.session.email = email;
    req.session.user = { name, email, password, phone_number}; // Store user data in session
    res.json({ message: 'OTP sent', otp });
});

app.post('/verify-otp', async (req, res) => {
    const { otp } = req.body;
    const { email, Customers } = req.session;
    if (req.session.otp === otp) {
        // OTP matches, proceed with registration or further steps
        await storeUser(Customers); // Store user data in the database
        res.json({ message: 'OTP verified and user registered successfully' });
    } else {
        res.status(400).json({ message: 'Invalid OTP' });
    }
});

app.post('/register', async (req, res) => {
    const { FIRST_NAME, LAST_NAME, BANK_ACCOUNT_NUMBER, CONFIRM_BANK_ACCOUNT_NUMBER, BANK_NAME, AADHAR_CARD_NUMBER, PHONE_NUMBER, ADDRESS, EMAIL, BANK_BRANCH, IFSC_CODE, PAN_CARD_NUMBER } = req.body;

    const Customers = {
        first_name: FIRST_NAME,
        second_name: LAST_NAME,
        bank_account_number: BANK_ACCOUNT_NUMBER,
        confirmBankAccountNumber: CONFIRM_BANK_ACCOUNT_NUMBER,
        bank_name: BANK_NAME,
        aadhar_number: AADHAR_CARD_NUMBER,
        phone_number: PHONE_NUMBER,
        address: ADDRESS,
        email: EMAIL,
        bank_branch: BANK_BRANCH,
        bank_ifsc: IFSC_CODE,
        pan_number: PAN_CARD_NUMBER
    };

    try {
        await storeUser(Customers);
        res.json({ message: 'User registered successfully' });
    } catch (error) {
        console.error('Failed to register user:', error);
        res.status(500).json({ message: 'Failed to register user' });
    }
});

app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    const collection = db.collection('Customers');
    const user = await collection.findOne({ email: email });

    if (!user) {
        return res.status(400).json({ message: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        return res.status(400).json({ message: 'Invalid email or password' });
    }

    res.json({ message: 'Login successful' });
});

// Serve the login page
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'login.html'));
});

// Serve the register page
app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'register.html'));
});

// Serve the signup page
app.get('/signup', (req, res) => {
    res.sendFile(path.join(__dirname, 'signup.html'));
});

// Serve the OTP verification page
app.get('/verify-otp', (req, res) => {
    res.sendFile(path.join(__dirname, 'signup-otp.html'));
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});