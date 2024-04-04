const express = require("express");
const mongoose = require("mongoose");
const XLSX = require("xlsx");
const fs = require("fs");
const path = require("path");

const app = express();

// Connect to MongoDB
mongoose.connect("mongodb://localhost:27017/AccessPay", {
  serverSelectionTimeoutMS: 10000, // Increase timeout to 5 seconds
  family: 4, // Force IPv4
});


// Define the Customer schema
const customerSchema = new mongoose.Schema({
  transactions: Array,
  pan_number: String,
});

// Create the Customer model
const Customer = mongoose.model("Customer", customerSchema, "Customers");

// Serve static files from the public directory
app.use(express.static("public"));

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

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));