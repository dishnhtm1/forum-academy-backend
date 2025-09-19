// Simple script to test database connection
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

console.log('🔧 Testing Database Connection...');
console.log('📍 MONGO_URI:', process.env.MONGO_URI?.substring(0, 50) + '...');

async function testConnection() {
  try {
    console.log('🔌 Attempting to connect to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Successfully connected to MongoDB!');
    
    // Test a simple query
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('📊 Found collections:', collections.length);
    collections.forEach(col => console.log('  -', col.name));
    
    await mongoose.disconnect();
    console.log('✅ Connection test completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    process.exit(1);
  }
}

testConnection();