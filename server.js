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

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});