async function test() {
    try {
        // 1. Create User
        await fetch('http://localhost:5000/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: 'Forgot Test',
                email: 'forgot@example.com',
                'mobile-email': 'forgot@example.com',
                password: 'OldPassword123!',
                firebaseVerified: true
            })
        });

        // 2. Request Forgot Password
        console.log("Requesting Forgot Password...");
        const fpRes = await fetch('http://localhost:5000/api/auth/forgot-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 'mobile-email': 'forgot@example.com' })
        });
        const fpData = await fpRes.json();
        console.log("Forgot Password Res:", fpData);
        
        // Let's read the OTP from otp.txt
        const fs = require('fs');
        const otpText = fs.readFileSync('otp.txt', 'utf8');
        const otpMatch = otpText.match(/OTP is: (\d{6})/);
        const otp = otpMatch[1];
        console.log("Extracted OTP:", otp);

        // 3. Reset Password
        console.log("Resetting Password...");
        const rpRes = await fetch('http://localhost:5000/api/auth/reset-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: fpData.userId,
                otp: otp,
                newPassword: 'NewPassword123!',
                firebaseVerified: false
            })
        });
        const rpData = await rpRes.json();
        console.log("Reset Password Res:", rpData);
        
        // 4. Try login with new password
        const loginRes = await fetch('http://localhost:5000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                'mobile-email': 'forgot@example.com',
                password: 'NewPassword123!',
                firebaseVerified: false
            })
        });
        const loginData = await loginRes.json();
        console.log("Login with New Password Res:", loginRes.ok ? "SUCCESS" : loginData);
        
        // 5. Try login with old password
        const loginResOld = await fetch('http://localhost:5000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                'mobile-email': 'forgot@example.com',
                password: 'OldPassword123!',
                firebaseVerified: false
            })
        });
        const loginDataOld = await loginResOld.json();
        console.log("Login with Old Password Res:", loginResOld.ok ? "SUCCESS" : loginDataOld);

    } catch(err) {
        console.error(err);
    }
}
test();
