document.addEventListener("DOMContentLoaded", () => {
  const exportButton = document.querySelector(".export-button");
  const panNumberInput = document.getElementById("panNumber");

  exportButton.addEventListener("click", () => {
    const panNumber = panNumberInput.value; // Dynamically get the PAN number
    if (!panNumber) {
      alert("PAN Number is required");
      return;
    }
    window.location.href = `/export-transactions?panNumber=${panNumber}`;
  });
});