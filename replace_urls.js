const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'frontend', 'src', 'components');
const files = ['Login.jsx', 'FeatureModal.jsx', 'Dashboard.jsx'];

files.forEach(file => {
    const filePath = path.join(dir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Replace hardcoded fetch calls
    content = content.replace(/'http:\/\/localhost:5000/g, "`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}");
    // Some might use backticks already like `http://localhost:5000/api/bookings/user/${userId}`
    content = content.replace(/`http:\/\/localhost:5000/g, "`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}");

    fs.writeFileSync(filePath, content);
    console.log(`Updated ${file}`);
});
