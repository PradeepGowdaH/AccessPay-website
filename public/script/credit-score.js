// Assuming the server is running on the same domain and port as the client
const serverUrl = "http://localhost:3000/credit-score";

// Function to fetch credit score from the server
async function fetchCreditScore() {
  try {
    const response = await fetch(serverUrl);
    if (!response.ok) {
      throw new Error("Network response was not ok");
    }
    const data = await response.json();
    return data.creditScore;
  } catch (error) {
    console.error("There was a problem with your fetch operation:", error);
    return null;
  }
}

// Function to update the credit score in the HTML
function updateCreditScoreInHtml(creditScore) {
  const creditScoreElement = document.querySelector(".credit-score");
  if (creditScoreElement) {
    creditScoreElement.textContent = `Credit Score: ${creditScore}`;
  }
}

// Main function to fetch and display the credit score
async function displayCreditScore() {
  const creditScore = await fetchCreditScore();
  if (creditScore !== null) {
    updateCreditScoreInHtml(creditScore);
  } else {
    console.error("Failed to fetch credit score");
  }
}

// Call the main function
displayCreditScore();