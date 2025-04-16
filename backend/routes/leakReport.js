const express = require("express");
const router = express.Router();
const nodemailer = require("nodemailer");

router.post("/", async (req, res) => {
  const { name, email, contact, description, address, } = req.body;


  const output = `
    <h3>New Water Leak Report</h3>
    <p><strong>Name:</strong> ${name}</p>
    <p><strong>Email:</strong> ${email}</p>
    <p><strong>Contact:</strong> ${contact}</p>
    <p><strong>Address:</strong> ${address}</p>
    <p><strong>Description:</strong></p>
    <p>${description}</p>
  `;

  try {
    // Configure Nodemailer for Outlook
   const transporter = nodemailer.createTransport({
     service: "gmail",
     auth: {
       user: process.env.EMAIL_USER,
       pass: process.env.EMAIL_PASS,
     },
   });

    await transporter.sendMail({
      from: '"Public Water App" <simranbir1995@gmail.com>', // replace with your email
      to: "simranbir.office@gmail.com", // receiver email
      subject: "Water Leak Report Submitted",
      html: output,
    });
  console.log("New leak report submitted:");
  console.log(`Name: ${name}`);
  console.log(`Email: ${email}`);
  console.log(`Contact: ${contact}`);
  console.log(`Address: ${address}`);
  console.log(`Description: ${description}`);
    res.status(200).json({ message: "Report email sent successfully!" });
  } catch (err) {
    console.error("Error sending email:", err);
    res.status(500).json({ message: "Failed to send report email." });
  }
});

module.exports = router;
