require('dotenv').config({ path: './.env' });
const mongoose = require('mongoose');
const User = require('./models/User');

mongoose.connect(process.env.MONGO_URI)
    .then(async () => {
        console.log("Connected to MongoDB");
        const users = await User.find({});
        console.log(`Total users in database: ${users.length}`);
        users.forEach(u => console.log(`- ${u.email} (Verified: ${u.isVerified})`));
        process.exit(0);
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
