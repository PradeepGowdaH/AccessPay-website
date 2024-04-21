document.addEventListener("DOMContentLoaded", function() {
    fetch("/api/loan-details")
        .then(response => response.json())
        .then(data => {
            document.getElementById("loan_amount").textContent = `₹ ${data.loan_amount.toLocaleString()}`;
            document.getElementById("emi").textContent = `₹ ${data.emi.toFixed(2)}`;
            document.getElementById("tenure").textContent = `${data.tenure} Months`;
            document.getElementById("months_paid").textContent = `${data.months_paid} Months`;
            document.getElementById("rate_of_interest").textContent = `${data.rate_of_interest}%`;
            document.getElementById("date_of_payment").textContent = data.loan_payments[data.loan_payments.length - 1].date_of_payment;

            // Parse the date string from the dataset
            const lastPaymentDateStr = data.loan_payments[data.loan_payments.length - 1].date_of_payment;
            const [day, month, year] = lastPaymentDateStr.split("-").map(Number);

            // Construct a Date object using the parsed date
            const lastPaymentDate = new Date(year, month - 1, day);

            // Calculate the next payment date by adding one month to the last payment date
            const nextPaymentDate = new Date(lastPaymentDate.getFullYear(), lastPaymentDate.getMonth() + 1, lastPaymentDate.getDate());

            document.getElementById("next_date").textContent = nextPaymentDate.toLocaleDateString();
        })
        .catch(error => console.error("Error fetching loan details:", error));
});

/*
document.addEventListener("DOMContentLoaded", function () {
    fetch("/loan-data")
      .then((response) => response.json())
      .then((data) => {
        const loanSection = document.querySelector(".loan-section");
        const noLoanSection = document.querySelector(".no-loan");
  
        if (data.hasLoan) {
          loanSection.style.display = "block";
          noLoanSection.style.display = "none";
        } else {
          loanSection.style.display = "none";
          noLoanSection.style.display = "block";
        }
      })
      .catch((error) => {
        console.error("Error fetching loan data:", error);
      });
  });
  */