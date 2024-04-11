const express = require("express");
const MongoClient = require("mongodb").MongoClient;
const app = express();
const multer = require("multer");
const XLSX = require("xlsx");
const upload = multer({ dest: "uploads/" });
const fs = require("fs");
const mongoose = require("mongoose");
const path = require("path");
const port = 3000;
const bcrypt = require("bcrypt");

const mongoURI = "mongodb://0.0.0.0:27017/AccessPay";
const email = "Peter.kevin@example.com";

// Middleware to parse JSON bodies
app.use(express.json());

// Middleware to parse URL-encoded bodies
app.use(express.urlencoded({ extended: true }));

app.use(express.static("public"));




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



//Credit score


// Function to calculate and update the user's credit score based on email
async function getCreditScoreByEmail(email) {
    const client = new MongoClient(mongoURI);

    try {
        await client.connect();
        const database = client.db(); // AccessPay is specified in the URI, so no need to specify it here
        const customersCollection = database.collection('Customers');

        // Fetch the user document by email
        const user = await customersCollection.findOne({ email: email });
        if (!user) {
            return { success: false, message: 'User not found' };
        }

        // Calculate the new credit score
        let newCreditScore = user.credit_score;
        user.transactions.forEach(transaction => {
            if (transaction.mode === 'sent') {
                newCreditScore += 3;
            }
        });

        return { success: true, creditScore: newCreditScore };
    } catch (err) {
        console.error(err);
        return { success: false, message: 'An error occurred' };
    } finally {
        await client.close();
    }
}

// New endpoint to expose the credit score
app.get('/credit-score', async (req, res) => {
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



//Chart code

// Transactions

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

app.get("/api/transactions-weekly", async (req, res) => {
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


// Rewards history

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
    return res
      .status(404)
      .send("Budget not found for the specified month and year.");
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

app.post("/add-budget-category", async (req, res) => {
  const { categoryName, categoryAmount } = req.body;
  const currentMonthYear = new Date().toLocaleString("default", {
    month: "long",
    year: "numeric",
  });

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

    const budgetEntry = customer.budget.find(
      (b) => b.month_year === currentMonthYear
    );
    if (!budgetEntry) {
      return res.status(404).send("Budget not found for the current month.");
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





app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});