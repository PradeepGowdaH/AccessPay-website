async function fetchTransactionsForCustomerWeekly() {
  console.log("Fetching weekly transactions...");
  try {
    const response = await fetch("/api/transactions-weekly");
    if (!response.ok) {
      throw new Error("Network response was not ok");
    }
    const transactionsData = await response.json();
    generateChartWeekly(transactionsData);
  } catch (error) {
    console.error("There was a problem with your fetch operation:", error);
  }
}

function generateChartWeekly(transactionsData) {
  const ctx = document
    .getElementById("transactionsChartWeekly")
    .getContext("2d");
  const transactionsChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: transactionsData.map((data) => `Week ${data._id.week}`),
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
            text: "Weeks",
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
