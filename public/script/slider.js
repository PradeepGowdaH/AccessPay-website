document.addEventListener("DOMContentLoaded", function () {
    // Function to draw the slider
    function drawSlider() {
        const canvas = document.getElementById('fullnessBar');
        const ctx = canvas.getContext('2d');

        // Get total income and total spendings
        const totalIncome = parseInt(document.getElementById('totalBudget').textContent.replace('₹', ''));
        const totalSpendings = parseInt(document.getElementById('totalSpendings').textContent.replace('₹', ''));

        // Calculate the ratio of total spendings to total income
        const ratio = totalSpendings / totalIncome;

        // Determine the fill color based on the ratio
        let fillColor;
        if (ratio < 0.5) {
            fillColor = 'green';
        } else if (ratio >= 0.5 && ratio < 0.75) {
            fillColor = 'yellow';
        } else {
            fillColor = 'red';
        }

        // Draw the slider
        ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas
        ctx.beginPath();
        ctx.rect(0, 0, canvas.width * ratio, canvas.height); // Draw the filled part of the slider
        ctx.fillStyle = fillColor; // Set the fill color based on the ratio
        ctx.fill();
        ctx.strokeStyle = 'black'; // Color of the border
        ctx.strokeRect(0, 0, canvas.width, canvas.height); // Draw the border of the slider
    }

    // Call the function to draw the slider
    drawSlider();

    // Update the slider whenever total income or total spendings change
    const incomeElement = document.getElementById('totalBudget');
    const spendingsElement = document.getElementById('totalSpendings');
    incomeElement.addEventListener('DOMSubtreeModified', drawSlider);
    spendingsElement.addEventListener('DOMSubtreeModified', drawSlider);
});
