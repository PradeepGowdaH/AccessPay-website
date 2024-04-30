document.addEventListener('DOMContentLoaded', function() {
    const form = document.querySelector('form');
    form.addEventListener('submit', function(event) {
       event.preventDefault();
   
       const expenseCategory = document.getElementById('expenseCategory').value;
       const expenseAmount = document.getElementById('expenseAmount').value;
       const transactionType = document.getElementById('transactionType').value;
       const transactionDate = document.getElementById('transactionDate').value;
       const transactionTime = document.getElementById('transactionTime').value;
   
       // Combine date and time into a single ISO string
       const transactionDateTime = new Date(`${transactionDate}T${transactionTime}`).toISOString();
   
       const transactionData = {
         category: expenseCategory,
         amount: parseFloat(expenseAmount),
         mode: transactionType,
         isoDate: transactionDateTime,
       };
   
       fetch('/api/add-transaction', {
         method: 'POST',
         headers: {
           'Content-Type': 'application/json',
         },
         body: JSON.stringify(transactionData),
       })
       .then(response => response.json())
       .then(data => {
         console.log('Success:', data);
         // Optionally, clear the form or show a success message
         form.reset(); // Reset the form fields
         alert('Transaction added successfully');
       })
       .catch((error) => {
         console.error('Error:', error);
         // Optionally, show an error message
         alert('Error adding transaction');
       });
    });
   });