document.addEventListener("DOMContentLoaded", function () {
    const budgetList = document.querySelector(".budget-list ul");

    // Function to get the current month and year
    function getCurrentMonthYear() {
        const date = new Date();
        const month = date.toLocaleString('default', { month: 'long' });
        const year = date.getFullYear();
        return `${month}, ${year}`;
    }

    // Function to fetch and display the current month's budget
    async function fetchAndDisplayBudget() {
        const monthYear = getCurrentMonthYear();
        try {
            const response = await fetch("/fetch-budget", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ monthYear }),
            });
            const data = await response.json();

            // Clear existing list items
            budgetList.innerHTML = '';

            // Create and append new list items with INR currency sign
            data.labels.forEach((label, index) => {
                const listItem = document.createElement("li");
                // Use ₹ for INR currency sign
                listItem.textContent = `${label}: ₹${data.data[index]}`;
                budgetList.appendChild(listItem);
            });
        } catch (error) {
            console.error("Error fetching budget data:", error);
        }
    }

    // Fetch and display the budget for the current month
    fetchAndDisplayBudget();
});
