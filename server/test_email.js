const sendEmail = require('./utils/sendEmail');
async function test() {
    await sendEmail({
        email: 'test@example.com',
        subject: 'Test Subject',
        message: 'Test Message'
    });
}
test();
