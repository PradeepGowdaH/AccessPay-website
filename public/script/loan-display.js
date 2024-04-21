document.addEventListener("DOMContentLoaded", function() {
  fetch("/api/loan-details")
      .then(response => response.json())
      .then(data => {
          // Check if loan_id is not empty
          if (data.loan_amount > 0) {
              // Show loan details section
              document.querySelector('.loan-section').classList.remove('d-none');
              // Hide no-loan section
              document.querySelector('.no-loan').classList.add('d-none');
          } else {
              // Hide loan details section
              document.querySelector('.loan-section').classList.add('d-none');
              // Show no-loan section
              document.querySelector('.no-loan').classList.remove('d-none');
          }

          // Populate loan details
          document.getElementById("loan_amount").textContent = `₹ ${data.loan_amount.toLocaleString()}`;
          document.getElementById("emi").textContent = `₹ ${data.emi.toFixed(2)}`;
          document.getElementById("tenure").textContent = `${data.tenure} Months`;
          document.getElementById("months_paid").textContent = `${data.months_paid} Months`;
          document.getElementById("rate_of_interest").textContent = `${data.rate_of_interest}%`;
          document.getElementById("date_of_payment").textContent = data.loan_payments[data.loan_payments.length - 1].date_of_payment;

          // Calculate and display the next payment date
          const lastPaymentDateStr = data.loan_payments[data.loan_payments.length - 1].date_of_payment;
          const [day, month, year] = lastPaymentDateStr.split("/").map(Number);
          const lastPaymentDate = new Date(year, month - 1, day);
          const nextPaymentDate = new Date(lastPaymentDate.getFullYear(), lastPaymentDate.getMonth() + 1, lastPaymentDate.getDate());
          document.getElementById("next_date").textContent = nextPaymentDate.toLocaleDateString();
      })
      .catch(error => console.error("Error fetching loan details:", error));
});
