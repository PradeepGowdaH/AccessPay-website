document.addEventListener("DOMContentLoaded", function () {
  const monthSelect = document.getElementById("monthSelect");
  const budgetChart = document.getElementById("budgetChart").getContext("2d");
  const budgetItemsList = document.getElementById("budget-items");
  const customBox = document.querySelector(".custom-box");
  const customBox2 = document.querySelector(".custom-box2");
  let chartInstance = null;
 
  async function fetchAndDisplayBudget(monthYear) {
     try {
       const response = await fetch("/fetch-budget", {
         method: "POST",
         headers: {
           "Content-Type": "application/json",
         },
         body: JSON.stringify({ monthYear }),
       });
 
       if (!response.ok) {
         // Handle error response (e.g., 404)
         const errorMessage = await response.json(); // Assuming the server returns a JSON object with a message
         console.error("Error fetching budget data:", errorMessage.message);
         // Update the UI to reflect that there are no budget items for the selected month
         customBox.classList.add("d-none"); // Hide custom-box
         customBox2.classList.remove("d-none"); // Show custom-box2
         return; // Exit the function early
       }
 
       const data = await response.json();
 
       if (data.labels.length > 0) {
         // There are budget items for the selected month
         customBox.classList.remove("d-none"); // Show custom-box
         customBox2.classList.add("d-none"); // Hide custom-box2
 
         // Update the chart with the new data
         if (chartInstance) {
           chartInstance.destroy();
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
 
         // Update the budget items list
         budgetItemsList.innerHTML = '';
         data.labels.forEach((label, index) => {
           const listItem = document.createElement("li");
           listItem.textContent = `${label}: ₹${data.data[index]}`;
           budgetItemsList.appendChild(listItem);
         });
       } else {
         // There are no budget items for the selected month
         customBox.classList.add("d-none"); // Hide custom-box
         customBox2.classList.remove("d-none"); // Show custom-box2
       }
 
     } catch (error) {
       console.error("Error fetching budget data:", error);
     }
  }
 
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
 
       monthSelect.value = months[0];
       fetchAndDisplayBudget(months[0]);
     } catch (error) {
       console.error("Error fetching months:", error);
     }
  }
 
  monthSelect.addEventListener("change", (event) => {
     const monthYear = event.target.value;
     fetchAndDisplayBudget(monthYear);
  });
 
  populateMonths();
 });
 