async function fetchTransactionsForCustomerMonthly() {
  console.log("Fetching monthly transactions...");
  try {
     const response = await fetch("/api/transactions");
     if (!response.ok) {
       throw new Error("Network response was not ok");
     }
     const transactionsData = await response.json();
     // Aggregate transactions by month
     const aggregatedData = transactionsData.reduce((acc, transaction) => {
       const date = new Date(transaction.isoDate);
       const monthNumber = date.getMonth() + 1; // JavaScript months are 0-indexed
       if (!acc[monthNumber]) {
         acc[monthNumber] = { amount: 0 };
       }
       acc[monthNumber].amount += transaction.amount;
       return acc;
     }, {});
     generateChartMonthly(Object.values(aggregatedData));
  } catch (error) {
     console.error("There was a problem with your fetch operation:", error);
  }
 }
 

function generateChartMonthly(transactionsData) {
  const ctx = document
    .getElementById("transactionsChartMonthly")
    .getContext("2d");
  const transactionsChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: transactionsData.map((data) => `Month ${data.monthNumber}`),
      datasets: [
        {
          label: "Transactions",
          backgroundColor: transactionsData.map(
            (_, index) =>
              `hsl(${(index * 360) / transactionsData.length}, 70%, 50%)`
          ),
          borderColor: transactionsData.map(
            (_, index) =>
              `hsl(${(index * 360) / transactionsData.length}, 70%, 50%)`
          ),
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
            text: "Months",
          },
        },
        y: {
          title: {
            display: true,
            text: "Transactions made in rupees",
          },
          beginAtZero: true,
        },
      },
    },
  });
}
