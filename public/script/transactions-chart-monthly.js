async function fetchTransactionsForCustomerMonthly() {
  console.log("Fetching monthly transactions...");
  try {
    const response = await fetch("/api/transactions-monthly");
    if (!response.ok) {
      throw new Error("Network response was not ok");
    }
    const transactionsData = await response.json();
    generateChartMonthly(transactionsData);
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
      labels: transactionsData.map((data) => `Month ${data._id.month}`),
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
          data: transactionsData.map((data) => data.totalAmount),
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
