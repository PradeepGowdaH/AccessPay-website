const express = require("express");
const MongoClient = require("mongodb").MongoClient;
const app = express();
const port = 3000;
const bcrypt = require('bcrypt');


const mongoURI = "mongodb://0.0.0.0:27017/AccessPay";
const customerId = "google_id_6";

// Middleware to parse JSON bodies
app.use(express.json());

// Middleware to parse URL-encoded bodies
app.use(express.urlencoded({ extended: true }));

app.use(express.static("public")); 

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

app.get("/api/rewards-history", async (req, res) => {
  try {
     const client = await MongoClient.connect(mongoURI);
     const db = client.db();
     const customersCollection = db.collection("Customers");
 
     // Assuming you have a way to identify the customer, e.g., through a query parameter or a session
     // For demonstration, let's use a hardcoded customerId
     const customerId = "google_id_6"; // Replace this with the actual customer ID retrieval logic
 
     const customer = await customersCollection.findOne({
       googleId: customerId,
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

 app.post("/changepassword", async (req, res) => {
  try {
      const client = await MongoClient.connect(mongoURI);
      const db = client.db();
      const customersCollection = db.collection("Customers");
  
      const { currentpassword, newpassword, confirmpassword } = req.body;
  
      // Assuming you have a way to identify the customer, e.g., through a session or a token
      // For demonstration, let's use a hardcoded customerId
      const customerId = "google_id_6"; // Replace this with the actual customer ID retrieval logic
  
      const customer = await customersCollection.findOne({
        googleId: customerId,
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
        return res.status(400).send("New password and confirmation do not match.");
      }
  
      // Update the password in the database
      await customersCollection.updateOne(
        { googleId: customerId },
        { $set: { password: newpassword } }
      );
  
      res.send("Password changed successfully.");
      client.close();
  } catch (error) {
      console.error("Error changing password:", error);
      res.status(500).send("Error changing password.");
  }
 });

 app.post("/fetch-budget", async (req, res) => {
  const { monthYear } = req.body;
  const client = await MongoClient.connect(mongoURI);
  const db = client.db();
  const customersCollection = db.collection("Customers");

  const customer = await customersCollection.findOne({ googleId: customerId });
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

  const customer = await customersCollection.findOne({ googleId: customerId });
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

  const customer = await collection.findOne({ googleId: customerId });
  if (!customer) {
    return res.status(404).send("Customer not found.");
  }

  const loanData = customer.loans[0]; // Assuming you want to plot the first loan
  const monthsPaid = loanData.months_paid;
  const monthsLeft = loanData.months_left;

  res.json({ monthsPaid, monthsLeft });
});

app.post('/add-budget-category', async (req, res) => {
  const { categoryName, categoryAmount } = req.body;
  const currentMonthYear = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
 
  try {
     const client = await MongoClient.connect(mongoURI);
     const db = client.db();
     const customersCollection = db.collection("Customers");
 
     const customer = await customersCollection.findOne({ googleId: customerId });
     if (!customer) {
       return res.status(404).send("Customer not found.");
     }
 
     const budgetEntry = customer.budget.find(b => b.month_year === currentMonthYear);
     if (!budgetEntry) {
       return res.status(404).send("Budget not found for the current month.");
     }
 
     // Update the budget entry with the new category
     budgetEntry[categoryName] = parseInt(categoryAmount, 10);
 
     await customersCollection.updateOne(
       { googleId: customerId },
       { $set: { budget: customer.budget } }
     );
 
     res.json({ message: 'Budget category added successfully.' });
     client.close();
  } catch (error) {
     console.error("Error adding budget category:", error);
     res.status(500).send("Error adding budget category.");
  }
 });
 
app.listen(port, () => {
 console.log(`Server running at http://localhost:${port}`);
});