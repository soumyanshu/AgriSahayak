const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'frontend', 'src', 'components');
const files = ['Login.jsx', 'FeatureModal.jsx', 'Dashboard.jsx'];

files.forEach(file => {
    const filePath = path.join(dir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Fix mismatched quotes: starts with backtick, ends with single quote.
    // Example: `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/auth/login'
    content = content.replace(/(\$\{import\.meta\.env\.VITE_API_URL \|\| 'http:\/\/localhost:5000'\}[^']*)'/g, "$1`");

    fs.writeFileSync(filePath, content);
    console.log(`Fixed syntax in ${file}`);
});
