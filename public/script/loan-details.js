function calculateLoan(loanType, creditScore, tenure) {
  let eligibility = false;
  let maxLoanAmount = 0;
  let interestRate = 0;
  let emi = 0;
  let message = "";

  // Determine the interest rate based on the loan type
  switch (loanType) {
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
  } else if (creditScore >= 500 && creditScore < 700) {
    eligibility = true;
    maxLoanAmount = 500000; // 5L
  } else if (creditScore >= 700 && creditScore < 850) {
    eligibility = true;
    maxLoanAmount = 1000000; // 10L
  } else if (creditScore >= 850) {
    eligibility = true;
    maxLoanAmount = 1500000; // 15L
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