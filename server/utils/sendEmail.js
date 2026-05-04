const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

const sendEmail = async (options) => {
    try {
        // Write the OTP directly to a file so the user can see it locally!
        const otpFilePath = path.join(__dirname, '..', 'otp.txt');
        const fileContent = `=================================\nNew Email Sent:\nTo: ${options.email}\nSubject: ${options.subject}\n\n${options.message}\n=================================\n`;
        try {
            fs.writeFileSync(otpFilePath, fileContent);
            console.log(`[DEVELOPMENT] Email written to ${otpFilePath}`);
        } catch(e) {}

        let transporter;
        let fromAddress;
        
        // If real credentials exist, use Gmail
        console.log("Checking EMAIL_USER:", process.env.EMAIL_USER);
        if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
            console.log("Credentials found. Creating transporter...");
            transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: process.env.EMAIL_USER, 
                    pass: process.env.EMAIL_PASS, 
                },
            });
            fromAddress = `"AgriSahayak Security" <${process.env.EMAIL_USER}>`;
            
            console.log(`Preparing to send email to ${options.email}`);
            // send mail with defined transport object
            const message = {
                from: fromAddress,
                to: options.email,
                subject: options.subject,
                text: options.message,
            };

            await transporter.sendMail(message);
        }

        return true;
    } catch (err) {
        console.error("Error sending email: ", err);
    }
};

module.exports = sendEmail;
