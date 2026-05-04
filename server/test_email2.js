require('dotenv').config({ path: './.env' });
const sendEmail = require('./utils/sendEmail');

async function test() {
    console.log("Testing email with user:", process.env.EMAIL_USER);
    await sendEmail({
        email: "soumyanshusahoo30@gmail.com", // Sending to the user's actual email
        subject: "Test OTP Email",
        message: "This is a test of the email system."
    });
    console.log("Finished test");
}

test();
