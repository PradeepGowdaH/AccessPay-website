async function updateLoanDetails() {
    try {
       const response = await fetch('/api/loan-details');
       if (!response.ok) {
         throw new Error('Network response was not ok');
       }
       const loanDetails = await response.json();
   
       // Check if the elements exist before updating
       const loanAmountElement = document.getElementById('loan_amount');
       const emiElement = document.getElementById('emi');
       const tenureElement = document.getElementById('tenure');
       const rateOfInterestElement = document.getElementById('rate_of_interest');
   
       if (loanAmountElement) {
         loanAmountElement.textContent = ` ${loanDetails.loan_amount.toLocaleString('en-IN')}.00`;
       }
       if (emiElement) {
         emiElement.textContent = ` ${loanDetails.emi.toLocaleString('en-IN')}.00`;
       }
       if (tenureElement) {
         tenureElement.textContent = `${loanDetails.tenure} MONTHS`;
       }
       if (rateOfInterestElement) {
         rateOfInterestElement.textContent = `${loanDetails.rate_of_interest}%`;
       }
    } catch (error) {
       console.error('There was a problem with the fetch operation:', error);
    }
   }
   
   // Call the function to update loan details when the page loads
   document.addEventListener('DOMContentLoaded', updateLoanDetails);