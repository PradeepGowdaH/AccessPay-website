const express = require("express");
const MongoClient = require("mongodb").MongoClient;
const path = require("path");
const app = express();
const port = 3000;

const mongoURI = "mongodb://0.0.0.0:27017/AccessPay";
const customerId = "google_id_6"; // Adjusted to match the provided data

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, "public")));

app.use(express.json());

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

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});