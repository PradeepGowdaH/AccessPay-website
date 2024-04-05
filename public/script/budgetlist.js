document.addEventListener("DOMContentLoaded", function () {
    // Select the budget list container
    const budgetListContainer = document.querySelector(".budget-items");

    // Function to fetch and display the budget
    async function fetchAndDisplayBudget() {
        try {
            // Fetch the budget data from your server
            const response = await fetch("/fetch-budget", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ monthYear: "April, 2024" }) // Adjust the monthYear as needed
            });
            const data = await response.json();

            // Clear existing list items
            budgetListContainer.innerHTML = '';

            // Create and append new list items
            data.labels.forEach((label, index) => {
                const listItem = document.createElement("li");
                listItem.textContent = `${label}: ₹${data.data[index]}`;
                budgetListContainer.appendChild(listItem);
            });
        } catch (error) {
            console.error("Error fetching budget data:", error);
        }
    }

    // Fetch and display the budget initially
    fetchAndDisplayBudget();

    // Event listener for form submission
    document.getElementById('budgetForm').addEventListener('submit', async (event) => {
        event.preventDefault();

        const categoryName = document.getElementById('categoryName').value;
        const categoryAmount = document.getElementById('categoryAmount').value;

        try {
            const response = await fetch('/add-budget-category', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ categoryName, categoryAmount }),
            });

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            const data = await response.json();
            console.log(data);
            // Re-fetch and display the budget after successful addition
            fetchAndDisplayBudget();
        } catch (error) {
            console.error('There was a problem with the fetch operation:', error);
        }
    });
});
