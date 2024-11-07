// Import the SendGrid library
const sgMail = require("@sendgrid/mail");

require("dotenv").config();
// Set your SendGrid API key
sgMail.setApiKey(process.env.SENDGRID_API_KEY);
const { emailTo, templateId } = req.body;
let name = "Adrian";
// Function to send an email
const sendEmail = async () => {
  try {
    const msg = {
      to: emailTo,
      templateId: templateId,
      dynamicTemplateData: {
        name: name,
      },
    };

    const response = await sgMail.send(msg);
    console.log("Email sent successfully:", response);
  } catch (error) {
    console.error("Error sending email:", error);
    if (error.response) {
      console.error("SendGrid error details:", error.response.body);
    }
  }
};

// Call the function
sendEmail();
