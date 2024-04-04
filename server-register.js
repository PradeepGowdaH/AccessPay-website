const express = require('express');
const bodyParser = require('body-parser');
const MongoClient = require('mongodb').MongoClient;

const app = express();
const port = 3000;

// Middleware to parse JSON bodies
app.use(bodyParser.json());

// Middleware to parse URL-encoded bodies
app.use(bodyParser.urlencoded({ extended: true }));

// MongoDB connection string
// Assuming MongoDB is running locally and the database is named 'Accesspay'
const mongoURI = 'mongodb://127.0.0.1:27017/AccessPay';

// Connect to MongoDB
MongoClient.connect(mongoURI, (err, client) => {
    if (err) {
        console.error('Error connecting to MongoDB:', err);
        return;
    }
    console.log('Connected to MongoDB');
    const db = client.db('Accesspay');
    const usersCollection = db.collection('users');

    // Route to handle registration form submission
    app.post('/register', (req, res) => {
        const { FIRST_NAME, LAST_NAME, BANK_ACCOUNT_NUMBER, CONFIRM_BANK_ACCOUNT_NUMBER, BANK_NAME, AADHAR_CARD_NUMBER, PHONE_NUMBER, address, EMAIL, BANK_BRANCH, IFSC_CODE, PAN_CARD_NUMBER } = req.body;
        // Insert the user into the database
        usersCollection.insertOne({
            firstName: FIRST_NAME,
            lastName: LAST_NAME,
            bankAccountNumber: BANK_ACCOUNT_NUMBER,
            confirmBankAccountNumber: CONFIRM_BANK_ACCOUNT_NUMBER,
            bankName: BANK_NAME,
            aadharCardNumber: AADHAR_CARD_NUMBER,
            phoneNumber: PHONE_NUMBER,
            address: address,
            email: EMAIL,
            bankBranch: BANK_BRANCH,
            ifscCode: IFSC_CODE,
            panCardNumber: PAN_CARD_NUMBER
        }, (err, result) => {
            if (err) {
                console.error('Error inserting user:', err);
                res.status(500).send('Error inserting user.');
                return;
            }
            res.status(200).send('User registered successfully.');
        });
    });

    // Start the server
    app.listen(port, () => {
        console.log(`Server running at http://localhost:${port}`);
    });
});