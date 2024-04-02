document.getElementsByClassName('.').addEventListener('click', () => {
    const email = document.querySelector('#email').value;
    fetch('/send-otp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email
      })
    })
    .then(res => res.json())
    .then(data => {
      console.log(data);
      if (data.success) {
        // display OTP confirmation message
        alert('OTP sent to your email address. Please enter the OTP to continue.');
        // proceed with registration process
      } else {
        // handle OTP send error
        alert('Error sending OTP. Please try again later.');
      }
    })
    .catch(err => console.log(err));
  });
  