document.addEventListener('DOMContentLoaded', function() {
    const generateEmiButton = document.getElementById('generate_loan');
    const loanDetailsSection = document.querySelector('.loan-details');
    const loanAmountInput = document.getElementById('loan_amount');
    const loanCategorySelect = document.getElementById('loanCategory');
    const loanTenureSelect = document.getElementById('loanTenure');
    const interestRateElement = document.getElementById('interestRate');
    const emiElement = document.getElementById('emi');
    const tenureElement = document.getElementById('tenure');
    const amountGrantedElement = document.getElementById('loanAmount');
    const rateOfInterestElement = document.getElementById('interestRate');
   
    generateEmiButton.addEventListener('click', async function(event) {
       event.preventDefault(); // Prevent form submission
   
       const loanCategory = loanCategorySelect.value;
       const loanAmount = parseFloat(loanAmountInput.value);
       const tenure = loanTenureSelect.value.split(' ')[0]; // Extract the number from "24 months"
   
       // Fetch credit score from the server
       const response = await fetch('/credit-score');
       const { creditScore } = await response.json();
   
       // Determine eligibility and interest rate based on loan category
       let eligibility = false;
       let interestRate = 0;
       switch (loanCategory) {
         case "Home Loan":
           interestRate = 9;
           break;
         case "Car Loan":
           interestRate = 12;
           break;
         case "Personal Loan":
           interestRate = 10.5;
           break;
         default:
           alert("Invalid loan type.");
           return;
       }
   
       // Determine eligibility based on credit score and loan amount
       if (creditScore < 500) {
         alert("You are not eligible due to an insufficient credit score.");
       } else if (creditScore >= 500 && creditScore < 700 && loanAmount < 500000) {
         eligibility = true;
       } else if (creditScore >= 700 && creditScore < 850 && loanAmount < 1000000) {
         eligibility = true;
       } else if (creditScore >= 850 && loanAmount < 1500000) {
         eligibility = true;
       }
   
       if (eligibility) {
         // Calculate EMI
         const monthlyInterestRate = interestRate / 100 / 12;
         const emi = (loanAmount * monthlyInterestRate * Math.pow(1 + monthlyInterestRate, tenure)) / (Math.pow(1 + monthlyInterestRate, tenure) - 1);
   
         // Display loan details
         loanDetailsSection.classList.remove('d-none');
         amountGrantedElement.textContent = `₹${loanAmount.toFixed(2)}`;
         emiElement.textContent = `${emi.toFixed(2)}`;
         tenureElement.textContent = `${tenure} months`;
       } else {
         alert("You are not eligible for this loan.");
       }
    });
   });

   // Add this function inside your existing script tag or in your loan-calculator.js file
async function applyLoan() {
    const loanCategory = document.getElementById('loanCategory').value;
    const loanAmount = parseFloat(document.getElementById('loan_amount').value);
    const tenure = document.getElementById('loanTenure').value.split(' ')[0]; // Extract the number from "24 months"
    const emi = document.getElementById('emi').textContent; // Assuming this is updated correctly
    const interestRate = document.getElementById('interestRate').textContent; // Assuming this is updated correctly
    // Send the loan details to the server
    const response = await fetch('/apply-loan', {
       method: 'POST',
       headers: {
         'Content-Type': 'application/json',
       },
       body: JSON.stringify({
         loan_type: loanCategory,
         loan_amount: loanAmount,
         tenure: tenure,
         emi: emi,
         rate_of_interest: interestRate,
       }),
    });
   
    if (response.ok) {
       // Redirect to loan-grant.html upon successful update
       window.location.href = './loan-grant.html';
    } else {
       alert('Failed to apply for the loan. Please try again.');
    }
   }
   
   // Attach the applyLoan function to the "Apply Loan" button
   document.getElementById('Apply_loan').addEventListener('click', function(event) {
    event.preventDefault(); // Prevent the default form submission
    applyLoan();
   });
   
   