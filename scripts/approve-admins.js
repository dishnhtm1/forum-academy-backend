/**
 * Script to approve all admin and superadmin accounts
 * Run this script to fix any existing admin accounts that are not approved
 * Usage: node scripts/approve-admins.js
 */

const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config({ path: '../.env' });

async function approveAdmins() {
    try {
        // Connect to MongoDB
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/forum-academy', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('✅ Connected to MongoDB');

        // Find all admin and superadmin accounts that are not approved
        const unapprovedAdmins = await User.find({
            role: { $in: ['admin', 'superadmin'] },
            isApproved: false
        });

        if (unapprovedAdmins.length === 0) {
            console.log('✅ All admin accounts are already approved!');
        } else {
            console.log(`📋 Found ${unapprovedAdmins.length} unapproved admin account(s)`);
            
            // Approve each admin account
            for (const admin of unapprovedAdmins) {
                admin.isApproved = true;
                admin.approvedAt = new Date();
                await admin.save();
                console.log(`✅ Approved admin: ${admin.email} (${admin.role})`);
            }
            
            console.log(`\n🎉 Successfully approved ${unapprovedAdmins.length} admin account(s)`);
        }

        // Show current status of all admin accounts
        console.log('\n📊 Current Admin Accounts Status:');
        const allAdmins = await User.find({
            role: { $in: ['admin', 'superadmin'] }
        }).select('email role isApproved createdAt');

        allAdmins.forEach(admin => {
            const status = admin.isApproved ? '✅ Approved' : '❌ Not Approved';
            console.log(`   ${status} - ${admin.email} (${admin.role})`);
        });

        // Disconnect from MongoDB
        await mongoose.disconnect();
        console.log('\n🔌 Disconnected from MongoDB');
        process.exit(0);

    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

// Run the script
approveAdmins();
