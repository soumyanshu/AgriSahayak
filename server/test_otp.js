async function test() {
    try {
        console.log("Testing POST /api/auth/register");
        const res = await fetch('http://localhost:5000/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: 'Test User',
                email: 'test@example.com',
                'mobile-email': 'test@example.com',
                password: 'Password123!'
            })
        });
        const data = await res.json();
        console.log("Response:", data);
    } catch(err) {
        console.error(err);
    }
}
test();
