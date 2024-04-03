// Add the getWeek method to the Date prototype
Date.prototype.getWeek = function() {
  var date = new Date(this.getTime());
  date.setHours(0, 0, 0, 0);
  // Thursday in current week decides the year.
  date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
  // January 4 is always in week 1.
  var week1 = new Date(date.getFullYear(), 0, 4);
  // Adjust to Thursday in week 1 and count number of weeks from date to week1.
  return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000
                         - 3 + (week1.getDay() + 6) % 7) / 7);
 }
 
 async function fetchTransactionsForCustomerWeekly() {
  try {
     const response = await fetch("/api/transactions");
     if (!response.ok) {
       throw new Error("Network response was not ok");
     }
     const transactionsData = await response.json();
     // Aggregate transactions by week
     const aggregatedData = transactionsData.reduce((acc, transaction) => {
       const date = new Date(transaction.isoDate);
       const weekNumber = date.getWeek();
       if (!acc[weekNumber]) {
         acc[weekNumber] = { amount: 0 };
       }
       acc[weekNumber].amount += transaction.amount;
       return acc;
     }, {});
     generateChartWeekly(Object.values(aggregatedData));
  } catch (error) {
     console.error("There was a problem with your fetch operation:", error);
  }
 }
 
 function generateChartWeekly(transactionsData) {
  const ctx = document
     .getElementById("transactionsChartWeekly")
     .getContext("2d");
  const transactionsChart = new Chart(ctx, {
     type: "bar",
     data: {
       labels: transactionsData.map((data) => `Week ${data.weekNumber}`),
       datasets: [
         {
           label: "Transactions",
           backgroundColor: transactionsData.map(
             (_, index) =>
               `hsl(${(index * 360) / transactionsData.length}, 70%, 50%)`
           ),
           borderColor: transactionsData.map(
             (_, index) =>
               `hsl(${(index * 360) / transactionsData.length}, 70%, 50%)`
           ),
           borderWidth: 1,
           data: transactionsData.map((data) => data.amount),
         },
       ],
     },
     options: {
       scales: {
         x: {
           title: {
             display: true,
             text: "Weeks",
           },
         },
         y: {
           title: {
             display: true,
             text: "Transactions made in rupees",
           },
           beginAtZero: true,
         },
       },
     },
  });
 }
 