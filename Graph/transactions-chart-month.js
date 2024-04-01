const MongoClient = require("mongodb").MongoClient;
const fs = require("fs");

const mongoURI = "mongodb://0.0.0.0:27017/AccessPay";
const customerId = "google_id_6";

async function fetchTransactionsForCustomer() {
  try {
    const client = await MongoClient.connect(mongoURI);
    const db = client.db();
    const customersCollection = db.collection("Customers");

    const customer = await customersCollection.findOne({
      googleId: customerId,
    });
    if (!customer) {
      console.log("Customer not found.");
      return;
    }

    // Filter transactions to the last 5 weeks
    const currentDate = new Date();
    const fiveWeeksAgo = new Date(
      currentDate.setDate(currentDate.getDate() - 35)
    ); // 35 days ago
    const recentTransactions = customer.transactions.filter(
      (transaction) => new Date(transaction.isoDate) >= fiveWeeksAgo
    );

    // Group transactions by week and sum their amounts
    const transactions = recentTransactions.reduce((acc, transaction) => {
      const date = new Date(transaction.isoDate);
      const weekNumber = date.getWeek(); // Assuming getWeek() is a function that calculates the week number

      if (!acc[weekNumber]) {
        acc[weekNumber] = { amount: 0 };
      }
      acc[weekNumber].amount += transaction.amount;
      return acc;
    }, {});

    // Convert the grouped transactions into an array of objects with week numbers and amounts
    const transactionsData = Object.entries(transactions).map(
      ([weekNumber, { amount }]) => ({
        weekNumber,
        amount,
      })
    );

    // Generate a unique color for each week
    const colors = transactionsData.map((_, index) => {
      const color = `hsl(${(index * 360) / transactionsData.length}, 70%, 50%)`;
      return color;
    });

    // Generate the chart
    generateChart(transactionsData, colors);

    // Close the MongoDB connection
    client.close();

    console.log("Transactions chart for customer generated.");
  } catch (error) {
    console.error("Error fetching transactions for customer:", error);
  }
}

// Helper function to calculate the week number
Date.prototype.getWeek = function () {
  const oneJan = new Date(this.getFullYear(), 0, 1);
  const week = Math.ceil(
    ((this - oneJan) / 86400000 + oneJan.getDay() + 1) / 7
  );
  return week;
};

// Function to generate the chart
function generateChart(transactionsData, colors) {
  const chartContainer = document.getElementById("monthlyImage");
  chartContainer.innerHTML =
    '<canvas id="transactionsChart" width="600" height="600"></canvas>';

  const ctx = document.getElementById("transactionsChart").getContext("2d");
  const transactionsChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: transactionsData.map((data) => `Week ${data.weekNumber}`),
      datasets: [
        {
          label: "Transactions",
          backgroundColor: colors,
          borderColor: colors,
          borderWidth: 1,
          data: transactionsData.map((data) => data.amount),
        },
      ],
    },
    options: {
      scales: {
        x: {
          title: {
            display: true,
            text: "Weeks",
          },
        },
        y: {
          title: {
            display: true,
            text: "Transactions made",
          },
          beginAtZero: true,
        },
      },
    },
  });
}

fetchTransactionsForCustomer();