const nodemailer = require("nodemailer");

const sendEmail = async (to, subject, text, attachments = []) => {
    const transporter = nodemailer.createTransport({
        host: process.env.BREVO_HOST,
        port: process.env.BREVO_PORT,
        secure: false,
        auth: {
            user: process.env.BREVO_USER,
            pass: process.env.BREVO_PASS
        }
    });

    const mailOptions = {
        from: process.env.BREVO_FROM,
        to,
        subject,
        text,
        attachments
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log("Email sent successfully");
        return true;
    } catch (error) {
        console.error("Error sending email:", error);
        throw {success: false, message: 'Error sending email'}; // important for controller to catch
    }
};

module.exports = sendEmail;
