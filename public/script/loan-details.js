// updateLoanDetails.js

// Function to update loan details on the page
async function updateLoanDetails() {
  try {
     const response = await fetch('/api/loan-details');
     if (!response.ok) {
       throw new Error('Network response was not ok');
     }
     const loanDetails = await response.json();
 
     // Update the loan amount
     document.getElementById('loan_amount').textContent = ` ${loanDetails.loan_amount.toLocaleString('en-IN')}.00`;
 
     // Update the EMI
     document.getElementById('emi').textContent = ` ${loanDetails.emi.toLocaleString('en-IN')}.00`;
 
     // Update the tenure
     document.getElementById('tenure').textContent = `${loanDetails.tenure} MONTHS`;
 
     // Update the rate of interest
     document.getElementById('rate_of_interest').textContent = `${loanDetails.rate_of_interest}%`;
     document.getElementById('bank_name').textContent = `${loanDetails.bank_name}`;
     document.getElementById('bank_branch').textContent = `${loanDetails.bank_branch}`;
     document.getElementById('bank_ifsc').textContent = `${loanDetails.bank_ifsc}`;
  } catch (error) {
     console.error('There was a problem with the fetch operation:', error);
  }
 }
 
 // Call the function to update loan details when the page loads
 document.addEventListener('DOMContentLoaded', updateLoanDetails);
 


/*
function calculateLoan(loanType, creditScore, tenure) {
  let eligibility = false;
  let maxLoanAmount = 0;
  let interestRate = 0;
  let emi = 0;
  let message = "";

  // Determine the interest rate based on the loan type
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
      return { eligibility: false, message: "Invalid loan type." };
  }

  // Determine eligibility and max loan amount based on credit score
  if (creditScore < 500) {
    message = "You are not eligible due to an insufficient credit score.";
  } else if (creditScore >= 500 && creditScore < 700 && loan_amount < 500000) {
    eligibility = true; 
  } else if (creditScore >= 700 && creditScore < 850 && loan_amount < 1000000) {
    eligibility = true;
  } else if (creditScore >= 850 && loan_amount < 1500000) {
    eligibility = true;
  }

  // Calculate EMI if eligible
  if (eligibility) {
    let monthlyInterestRate = interestRate / 100 / 12;
    emi =
      (maxLoanAmount *
        monthlyInterestRate *
        Math.pow(1 + monthlyInterestRate, tenure)) /
      (Math.pow(1 + monthlyInterestRate, tenure) - 1);
  }

  return {
    eligibility: eligibility,
    message: message,
    maxLoanAmount: maxLoanAmount,
    interestRate: interestRate,
    emi: emi,
  };
}

// Example usage
let loanType = "Personal";
let creditScore = 550;
let tenure = 48; // 48 months
let result = calculateLoan(loanType, creditScore, tenure);

if (result.eligibility) {
  console.log(
    `For a ${loanType} loan with a credit score of ${creditScore} and a tenure of ${tenure} months, you are eligible for a loan up to ${
      result.maxLoanAmount / 100000
    } L with an interest rate of ${
      result.interestRate
    }%. Your EMI will be ${result.emi.toFixed(2)}.`
  );
} else {
  console.log(result.message);
}

*/