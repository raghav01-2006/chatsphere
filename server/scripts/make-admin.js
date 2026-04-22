
const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const makeAdmin = async () => {
    const email = process.argv[2];
    if (!email) {
        console.error('Please provide an email address: node scripts/make-admin.js user@example.com');
        process.exit(1);
    }

    try {
        console.log(`Connecting to database...`);
        await mongoose.connect(process.env.MONGO_URI);
        
        console.log(`Searching for user with email: ${email}`);
        const user = await User.findOne({ email: email.toLowerCase() });
        
        if (!user) {
            console.error(`User with email ${email} not found.`);
            process.exit(1);
        }

        console.log(`Promoting user ${user.username} (${user.email}) to Admin...`);
        user.isAdmin = true;
        await user.save();

        console.log(`✅ Success! User ${user.username} is now an Admin.`);
        process.exit(0);
    } catch (error) {
        console.error(`❌ Error promoting user:`, error.message);
        process.exit(1);
    }
};

makeAdmin();
