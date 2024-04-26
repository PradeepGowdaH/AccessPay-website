//useless code, delete later

document.addEventListener('DOMContentLoaded', function() {
    const payButton = document.querySelector('.btn-custom');
    payButton.addEventListener('click', function(event) {
       event.preventDefault(); // Prevent the default form submission
   
       // Assuming the EMI is already available on the page
       const emi = document.getElementById('emi').textContent.replace('₹', '').trim();
   
       // Send a POST request to the server
       fetch('/update-loan-details', {
         method: 'POST',
         headers: {
           'Content-Type': 'application/json',
         },
         body: JSON.stringify({ emi: emi }),
       })
       .then(response => {
         if (!response.ok) {
           throw new Error('Network response was not ok');
         }
         return response.json();
       })
       .then(data => {
         if (data.success) {
           // Redirect to the loan repayment page
           window.location.href = './loan-repayment.html';
         } else {
           alert('Error updating loan details.');
         }
       })
       .catch(error => {
         console.error('Error:', error);
         alert('Error updating loan details.');
       });
    });
   });
   