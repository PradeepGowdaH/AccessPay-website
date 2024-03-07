const MongoClient = require("mongodb").MongoClient;
const fs = require("fs");

// MongoDB connection string, replace with your own connection string
const mongoURI = "mongodb://0.0.0.0:27017/AccessPay";

// Customer ID to fetch transactions for
const customerId = "google_id_2";

async function fetchTransactionsForCustomer() {
  try {
    // Connect to MongoDB
    const client = await MongoClient.connect(mongoURI);
    const db = client.db();
    const customersCollection = db.collection("Customers");

    // Fetch transactions for the specified customer
    const customer = await customersCollection.findOne({
      googleId: customerId,
    });
    if (!customer) {
      console.log("Customer not found.");
      return;
    }

    // Prepare data for Chart.js
    const chartData = {
      labels: customer.transactions.map((transaction) => transaction.date),
      datasets: [
        {
          label: "Transactions",
          backgroundColor: "rgba(75, 192, 192, 0.2)",
          borderColor: "rgba(75, 192, 192, 1)",
          borderWidth: 1,
          data: customer.transactions.map((transaction) => transaction.amount),
        },
      ],
    };

    // Generate HTML file with Chart.js
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Transactions for Customer</title>
          <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
      </head>
      <body>
          <canvas id="transactionsChart" width="400" height="200"></canvas>
          <script>
              var ctx = document.getElementById('transactionsChart').getContext('2d');
              var transactionsChart = new Chart(ctx, {
                 type: 'bar',
                 data: ${JSON.stringify(chartData)},
                 options: {
                      scales: {
                          y: {
                              beginAtZero: true
                          }
                      }
                 }
              });
          </script>
      </body>
      </html>
    `;

    // Save the HTML content to a file
    fs.writeFileSync("transactions-chart.html", htmlContent);

    // Close the MongoDB connection
    client.close();

    console.log("Transactions chart for customer saved to transactions-chart.html");
  } catch (error) {
    console.error("Error fetching transactions for customer:", error);
  }
}

fetchTransactionsForCustomer();