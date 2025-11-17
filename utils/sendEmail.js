const nodemailer = require('nodemailer');

const sendEmail = async (to, subject, text, attachments = []) => {
    let transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 465,
        secure: true, // must be true for Gmail on Render
        auth: {
            user: process.env.EMAIL,            // your Gmail
            pass: process.env.EMAIL_PASSWORD    // App Password only
        }
    });

    let mailOptions = {
        from: process.env.EMAIL,
        to,
        subject,
        text,
        attachments
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('Email sent');
        return { success: true };
    } catch (error) {
        console.error('Error sending email:', error);
        throw { success: false, message: 'Error sending email' };
    }
};

module.exports = sendEmail;