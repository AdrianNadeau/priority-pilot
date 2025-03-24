const nodemailer = require("nodemailer");
const ejs = require("ejs");
const path = require("path");

// Configure Nodemailer with SendGrid SMTP Transporter
const transporter = nodemailer.createTransport({
  host: "smtp.sendgrid.net",
  port: 587,
  auth: {
    user: process.env.SENDGRID_API_KEY, // This is the string "apikey"
    pass: process.env.SENDGRID_SMTP_API_KEY, // Replace with your SendGrid API key
  },
});

// Function to send email
const sendEmail = async (to, subject, templateName, templateData) => {
  try {
    console.log("Sending email to:", to);
    // Render the email template
    // const templatePath = path.join(
    //   __dirname,
    //   "emailTemplates",
    //   `${templateName}.ejs`,
    // );
    // const html = await ejs.renderFile(templatePath, templateData);

    // Define the email options
    const mailOptions = {
      from: '"Adrian" <adrian@ansoftwareserves.com>', // Sender address
      to: to, // List of recipients
      subject: subject, // Subject line
      html: html, // HTML body
    };

    // Send the email
    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent: ", info.messageId);
    return info;
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
};

module.exports = sendEmail;
