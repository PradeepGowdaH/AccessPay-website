const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const cors = require('cors');
const nodemailer = require('nodemailer');
const MongoClient = require('mongodb').MongoClient;
const bcrypt = require('bcrypt');
const app = express();
const path = require("path");
const port = 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(session({
    secret: 'your-secret-key', // Replace with your own secret key
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 3000000 } // 5 minutes
}));

const mongoURI = "mongodb://0.0.0.0:27017/AccessPay";

// app.use('/static', express.static(path.join(__dirname, 'static')));
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
    const CustomerCollection = db.collection('Customers');
    const result = await CustomerCollection.insertOne(Customers);
    console.log(`User stored with the following id: ${result.insertedId}`);
}

app.post('/signup', async (req, res) => {
    try {
        const {username, email, password, phone_number } = req.body;
        const nameParts = username.split(' ');
        const first_name = nameParts[0];
        const second_name = nameParts.slice(1).join(' ');
        const client = await MongoClient.connect(mongoURI);
        const db = client.db();
        const customersCollection = db.collection("Customers");

        const existingUser = await customersCollection.findOne({ email: email });
        if (existingUser) {
            return res.status(400).json({ message: 'A user with this email already exists. Please log in.' });
        }

        // If no user with the same email exists, proceed with OTP generation and sending
        const otp = generateOTP();
        await sendOTP(email, otp);
        req.session.otp = otp;
        req.session.email = email;
        const userData = {
            googleId: "",
            googleName: "",
            email: email,
            password: password,
            first_name: first_name,
            second_name: second_name,
            // Set default or placeholder values for additional fields
            aadhar_number: "",
            pan_number: "",
            address: "",
            phone_number: phone_number,
            credit_score: 500,
            bank: [],
            reward_balance: 0,
            rewards_history: [],
            loans: [],
            transactions: [],
            budget: [],
        };
        req.session.user = userData;
        // Store user data in session
        res.json({ message: 'OTP sent', otp });
        console.log(otp);
    } catch (error) {
        console.error('Error in /signup route:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});
app.post('/verify-otp', async (req, res) => {
    try {
        // Extract OTP from req.body
        const { otp } = req.body;
        console.log(req.session.otp);
        console.log(otp);
        // Check if the OTP matches the one stored in the session
        if (req.session.otp == otp) {
            // OTP is correct, proceed with storing the user data in MongoDB
            const userData  = req.session.user;
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

            res.status(200).json({ message: 'User registered successfully'});
        } else {
            // OTP is incorrect
            res.status(400).json({ message: 'Incorrect OTP' });
        }
    } catch (error) {
        console.error('Error in /verify-otp route:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});
app.post('/register', async (req, res) => {
    try {
        const { FIRST_NAME, LAST_NAME, BANK_ACCOUNT_NUMBER, CONFIRM_BANK_ACCOUNT_NUMBER, BANK_NAME, AADHAR_CARD_NUMBER, PHONE_NUMBER, ADDRESS, BANK_BRANCH, IFSC_CODE, PAN_CARD_NUMBER, LOAN_TYPE, LOAN_AMOUNT, LOAN_DURATION } = req.body;

        // Retrieve the email from the session
        const email = req.session.email;
        if (!email) {
            return res.status(400).json({ message: 'Email not found in session. Please verify your email first.' });
        }

        // Connect to the database
        const client = await MongoClient.connect(mongoURI);
        const db = client.db();
        const customersCollection = db.collection('Customers');

        // Prepare the update object with all fields from the form
        const update = {
            $set: {
                first_name: FIRST_NAME,
                second_name: LAST_NAME,
                bank_account_number: BANK_ACCOUNT_NUMBER,
                confirmBankAccountNumber: CONFIRM_BANK_ACCOUNT_NUMBER,
                aadhar_number: AADHAR_CARD_NUMBER,
                phone_number: PHONE_NUMBER,
                address: ADDRESS,
                email: email, // Use the email from the session
                bank: [
                    {
                        bank_name: BANK_NAME,
                        bank_branch: BANK_BRANCH,
                        bank_ifsc: IFSC_CODE,
                        pan_number: PAN_CARD_NUMBER
                    }
                ],
                loans: [
                    {
                        loan_type: LOAN_TYPE,
                        loan_amount: LOAN_AMOUNT,
                        loan_duration: LOAN_DURATION
                    }
                ]
            }
        };

        // Update the user document
        const result = await customersCollection.updateOne({ email: email }, update);
        if (result.modifiedCount === 0) {
            return res.status(500).json({ message: 'Failed to update user information' });
        }

        res.json({ message: 'register done successfully' });
    } catch (error) {
        console.error('Error in /register route:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});
app.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
    // Connect to the database
    const client = await MongoClient.connect(mongoURI);
    const db = client.db();
    const customersCollection = db.collection("Customers");
        const user = await customersCollection.findOne({ email: email });

        if (!user) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }

        
        if (password != user.password) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }

        // Successful login, return user's email and a success message
        res.json({ message: 'Login successful', email: user.email });
    } catch (error) {
        console.error('Error in /login route:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Serve the login page
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'login.html'));
});

// Serve the register page
app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'register.html'));
});

// Serve the signup page
app.get('/signup', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'signup.html'));
});

// Serve the OTP verification page
app.get('/verify-otp', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'signup-otp.html'));
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});