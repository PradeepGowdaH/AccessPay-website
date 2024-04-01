fetch("/loan-data")
  .then((response) => response.json())
  .then((data) => {
    const monthsPaid = data.monthsPaid;
    const monthsLeft = data.monthsLeft;

    const ctx = document.getElementById("loanPieChart").getContext("2d");

    const loanPieChart = new Chart(ctx, {
      type: "pie",
      data: {
        labels: ["Months Paid", "Months Left"],
        datasets: [
          {
            label: "Loan Payment Status",
            data: [monthsPaid, monthsLeft],
            backgroundColor: [
              "rgba(75, 192, 192, 0.2)", // Color for Months Paid
              "rgba(255, 99, 132, 0.2)", // Color for Months Left
            ],
            borderColor: [
              "rgba(75, 192, 192, 1)", // Border color for Months Paid
              "rgba(255, 99, 132, 1)", // Border color for Months Left
            ],
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: "top",
          },
          title: {
            display: true,
            text: "Loan Payment Status",
          },
        },
      },
    });
  })
  .catch((error) => console.error("Error fetching data:", error));