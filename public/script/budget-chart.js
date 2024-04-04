document.addEventListener("DOMContentLoaded", function () {
  const monthSelect = document.getElementById("monthSelect");
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

  // Function to populate the dropdown with available months
  async function populateMonths() {
    try {
      const response = await fetch("/fetch-months");
      const months = await response.json();
      months.forEach((month) => {
        const option = document.createElement("option");
        option.value = month;
        option.textContent = month;
        monthSelect.appendChild(option);
      });

      // Trigger the fetchAndDisplayBudget function for the first month
      monthSelect.value = months[0]; // Set the first month as the default
      fetchAndDisplayBudget(months[0]);
    } catch (error) {
      console.error("Error fetching months:", error);
    }
  }

  // Attach event listener to the dropdown menu
  monthSelect.addEventListener("change", (event) => {
    const monthYear = event.target.value;
    fetchAndDisplayBudget(monthYear);
  });

  // Populate the dropdown on page load
  populateMonths();
});