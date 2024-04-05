document.addEventListener("DOMContentLoaded", function () {
    const budgetChart = document.getElementById("budgetChart").getContext("2d");
    let chartInstance = null; // Variable to hold the chart instance
  
    // Function to fetch budget data and update the chart
    async function fetchAndDisplayBudget(monthYear) {
      try {
        const response = await fetch("/fetch-budget", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ monthYear }),
        });
        const data = await response.json();
  
        // Update the chart with the new data
        if (chartInstance) {
          chartInstance.destroy(); // Destroy the existing chart instance
        }
  
        chartInstance = new Chart(budgetChart, {
          type: "pie",
          data: {
            labels: data.labels,
            datasets: [
              {
                label: "Budget Categories",
                backgroundColor: data.colors,
                borderColor: data.colors,
                borderWidth: 1,
                data: data.data,
              },
            ],
          },
          options: {
            title: {
              display: true,
              text: `Budget for ${monthYear}`,
            },
          },
        });
      } catch (error) {
        console.error("Error fetching budget data:", error);
      }
    }
  
    // Function to get the current month and year
    function getCurrentMonthYear() {
      const date = new Date();
      const month = date.toLocaleString('default', { month: 'long' });
      const year = date.getFullYear();
      return `${month}, ${year}`;
    }
  
    // Fetch and display the budget for the current month
    const currentMonthYear = getCurrentMonthYear();
    fetchAndDisplayBudget(currentMonthYear);
});
