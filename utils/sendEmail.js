const axios = require("axios");

const sendEmail = async (to, subject, text, attachments = []) => {
  try {
    const payload = {
      sender: {
        name: "Temple Membership",
        email: process.env.BREVO_FROM,
      },
      to: [{ email: to }],
      subject,
      textContent: text,
    };

    // Optional attachments
    if (attachments.length) {
      payload.attachment = attachments.map(att => ({
        name: att.filename,
        content: att.content.toString("base64"),
      }));
    }

    await axios.post(
      "https://api.brevo.com/v3/smtp/email",
      payload,
      {
        headers: {
          "api-key": process.env.BREVO_API_KEY,
          "Content-Type": "application/json",
        },
        timeout: 5000,
      }
    );

    console.log("Email sent via Brevo API");
    return true;
  } catch (err) {
    console.error("Brevo API email failed:", err.response?.data || err.message);
    return false;
  }
};

module.exports = sendEmail;
