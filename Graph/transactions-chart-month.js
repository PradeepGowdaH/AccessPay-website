const MongoClient = require("mongodb").MongoClient;
const fs = require("fs");

const mongoURI = "mongodb://0.0.0.0:27017/AccessPay";
const customerId = "google_id_5";

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

    // Assuming the dataset is already fetched and stored in the `customer` variable
    // Group transactions by month name and sum their amounts
    const transactions = customer.transactions.reduce((acc, transaction) => {
      const date = new Date(transaction.isoDate); // Use isoDate to create Date object
      const monthName = date.toLocaleString("default", { month: "long" }); // Get month name

      if (!acc[monthName]) {
        acc[monthName] = { amount: 0 };
      }
      acc[monthName].amount += transaction.amount;
      return acc;
    }, {});

    // Convert the grouped transactions into an array of objects with month names and amounts
    const transactionsData = Object.entries(transactions).map(
      ([monthName, { amount }]) => ({
        monthName,
        amount,
      })
    );

    // Generate a unique color for each month
    const colors = transactionsData.map((_, index) => {
      const color = `hsl(${(index * 360) / transactionsData.length}, 70%, 50%)`;
      return color;
    });

    // Generate HTML file with Chart.js and dropdown
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
      <select id="timePeriod">
          <option value="month">Month</option>
      </select>
      <canvas id="transactionsChart" width="400" height="200"></canvas>
      <script>
          var ctx = document.getElementById('transactionsChart').getContext('2d');
          var transactionsChart = new Chart(ctx, {
             type: 'bar',
             data: {
                 labels: ${JSON.stringify(
                   transactionsData.map((data) => data.monthName)
                 )},
                 datasets: [{
                      label: "Transactions",
                      backgroundColor: ${JSON.stringify(colors)},
                      borderColor: ${JSON.stringify(colors)},
                      borderWidth: 1,
                      data: ${JSON.stringify(
                        transactionsData.map((data) => data.amount)
                      )}
                 }]
             },
             options: {
                 scales: {
                      x: {
                          title: {
                              display: true,
                              text: 'Months'
                          }
                      },
                      y: {
                          title: {
                              display: true,
                              text: 'Rupees Spent'
                          },
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
    fs.writeFileSync("transactions-chart-month.html", htmlContent);

    // Close the MongoDB connection
    client.close();

    console.log(
      "Transactions chart for customer saved to transactions-chart.html"
    );
  } catch (error) {
    console.error("Error fetching transactions for customer:", error);
  }
}

fetchTransactionsForCustomer();