const nodemailer = require("nodemailer");
const ejs = require("ejs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
// Ensure environment variables are set
// console.log("process.env.SG_SMTP_USER_NAME", process.env.SG_SMTP_USER_NAME);
// console.log("process.env.SENDGRID_SMTP_API_KEY", process.env.SENDGRID_API_KEY);
if (!process.env.SG_SMTP_USER_NAME || !process.env.SENDGRID_API_KEY) {
  throw new Error("Missing environment variables for SMTP credentials");
}

// Configure Nodemailer with SendGrid SMTP Transporter
const transporter = nodemailer.createTransport({
  host: "smtp.sendgrid.net",
  port: 587,
  auth: {
    user: process.env.SG_SMTP_USER_NAME, // This is the string "apikey"
    pass: process.env.SENDGRID_API_KEY, // Replace with your SendGrid API key
  },
});

// Function to send email
const sendEmail = async (to, subject, templateName, templateData) => {
  try {
    const resetToken = uuidv4();
    const redirectURL = `${process.env.REDIRECT_URL || "https://www.prioritypilot.ca"}?token=${resetToken}`;
    //add value with by person with email  = to req.body.email
    console.log("redirectURL", redirectURL);
    // Check if the email exists in the database
    // const person = await Person.findOne({ where: { email: req.body.email } });
    // if (!person) {
    //   return res.status(404).send("Email not found.");
    // }
    const templateData = {
      // first_name: person.first_name || "Friend",
      first_name: "Adrian",
      redirectURL, // Pass the redirect URL to the template
    };
    // Render the email template
    const templatePath = path.join(
      __dirname,
      "..",
      "views",
      "emailTemplates",
      `${templateName}.ejs`,
    );
    const html = await ejs.renderFile(templatePath, templateData);

    // Define the email options
    const mailOptions = {
      from: "adrian@prioritypilot.ca", // Sender address
      to: to, // List of recipients
      subject: subject, // Subject line
      html: html, // HTML body
    };

    // Send the email
    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent: ", info.messageId);
    //insert resetToken into the database
    return info;
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
};

module.exports = sendEmail;
