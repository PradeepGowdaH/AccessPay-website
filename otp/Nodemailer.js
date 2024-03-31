const express = require('express');
const nodemailer = require('nodemailer');

const app = express();

// Generate OTP
function generateOTP() {
  const length = 6;
  const characters = '0123456789';
  let otp = '';

  for (let i = 0; i < length; i++) {
    otp += characters[Math.floor(Math.random() * characters.length)];
  }

  return otp;
}

// Create Nodemailer transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'accesspay2024@gmail.com',
    pass: 'ddgj nhcu anig lval'
  }
});

app.post('/signup', (req, res) => {
  const otp = generateOTP();
  req.session.OTP = otp;
  const mailOptions = {
    from: 'accesspay2024@gmail.com',
    to: req.body.email,
    subject: 'OTP Verification',
    html: `<p>Your OTP is: ${otp}</p>`
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log(error);
      res.json({
        success: false,
        message: 'Error sending OTP email.'
      });
    } else {
      console.log(`Email sent: ${info.response}`);
      res.json({
        success: true,
        message: `OTP sent to ${req.body.email}`,
        otp
      });
    }
  });
});

app.post('/verify-otp', (req, res) => {
  const userOTP = req.body.otp;
  const userEmail = req.body.email;
  const storedOTP = req.session.OTP;

  if (userOTP === storedOTP) {
    // OTP is valid, proceed with registration
    res.json({
      success: true,
      message: 'OTP is valid.'
    });
  } else {
    // OTP is invalid
    console.log('Invalid OTP');
    res.json({
      success: false,
      message: 'Invalid OTP. Please try again.'
    });
  }
});

// Start server
app.listen(3000, () => {
  console.log('Server started on port 3000');
});
