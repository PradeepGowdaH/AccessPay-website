const express = require("express");
const MongoClient = require("mongodb").MongoClient;
const app = express();
const port = 3000;

const mongoURI = "mongodb://0.0.0.0:27017/AccessPay";
const customerId = "google_id_6";

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

app.listen(port, () => {
 console.log(`Server running at http://localhost:${port}`);
});