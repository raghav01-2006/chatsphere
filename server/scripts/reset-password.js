
const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const resetPassword = async () => {
    const email = process.argv[2];
    const newPassword = process.argv[3] || 'password123';
    
    if (!email) {
        console.error('Please provide an email address: node scripts/reset-password.js user@example.com [newpassword]');
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

        console.log(`Updating password for ${user.username} (${user.email})...`);
        user.password = newPassword;
        await user.save();

        console.log(`✅ Success! Password for ${user.username} has been reset to: ${newPassword}`);
        process.exit(0);
    } catch (error) {
        console.error(`❌ Error resetting password:`, error.message);
        process.exit(1);
    }
};

resetPassword();
