document.addEventListener("DOMContentLoaded", function () {
    // Select the budget list container
    // Function to get the current month and year
// Function to get the current month and year
function getCurrentMonthYear() {
    const date = new Date();
    const month = date.toLocaleString('default', { month: 'long' });
    const year = date.getFullYear();
    return `${month}, ${year}`;
}

// Define budgetListContainer at the top of your script
const budgetListContainer = document.querySelector(".budget-items");

// Function to fetch and display the budget
async function fetchAndDisplayBudget(monthYear) {
    try {
        const response = await fetch("/fetch-budget", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ monthYear: monthYear })
        });

        // Check if the response is OK (status 200-299)
        if (response.ok) {
            const data = await response.json();

            // Clear existing list items
            budgetListContainer.innerHTML = '';

            // Create and append new list items
            data.labels.forEach((label, index) => {
                const listItem = document.createElement("li");
                listItem.textContent = `${label}: ₹${data.data[index]}`;
                budgetListContainer.appendChild(listItem);
            });

            // Toggle visibility based on budget entries
            const customBox = document.querySelector('.custom-box');
            const customBox2 = document.querySelector('.custom-box2');
            customBox.classList.remove('d-none');
            customBox2.classList.add('d-none');
        } else {
            // Handle error response (e.g., 404)
            console.error("Error fetching budget data:", await response.text());

            // If no budget entries, toggle visibility to show customBox2
            const customBox = document.querySelector('.custom-box');
            const customBox2 = document.querySelector('.custom-box2');
            customBox.classList.add('d-none');
            customBox2.classList.remove('d-none');
        }
    } catch (error) {
        console.error("Error fetching budget data:", error);
    }
}


// Fetch and display the budget initially
const currentMonthYear = getCurrentMonthYear();
fetchAndDisplayBudget(currentMonthYear);


    
});


/*// Event listener for form submission
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
    */