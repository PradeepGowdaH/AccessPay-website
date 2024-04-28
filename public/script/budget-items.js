document.addEventListener("DOMContentLoaded", function () {
    // Select the budget list container
    const budgetList = document.querySelector(".budget-list ul");
    // Select the custom boxes
    const customBox1 = document.querySelector('.custom-box1');
    const customBox2 = document.querySelector('.custom-box2');

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

            // Check if the response is OK (status 200-299)
            if (response.ok) {
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

                // Toggle visibility based on budget entries
                customBox1.classList.remove('d-none');
                customBox2.classList.add('d-none');
            } else {
                // Handle error response (e.g., 404)
                console.error("Error fetching budget data:", await response.text());

                // If no budget entries, toggle visibility to show customBox2
                customBox1.classList.add('d-none');
                customBox2.classList.remove('d-none');
            }
        } catch (error) {
            console.error("Error fetching budget data:", error);
        }
    }

    // Fetch and display the budget for the current month
    fetchAndDisplayBudget();
});
