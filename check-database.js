const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/forum-academy');

async function checkData() {
    try {
        console.log('🔍 Checking database content...\n');
        
        // Check courses
        const Course = mongoose.model('Course', new mongoose.Schema({
            title: String,
            code: String,
            description: String
        }));
        
        const courses = await Course.find();
        console.log('📚 Courses in database:');
        if (courses.length === 0) {
            console.log('   No courses found');
        } else {
            courses.forEach(course => {
                console.log(`   - ${course.code}: ${course.title} (ID: ${course._id})`);
            });
        }
        
        // Check course materials
        const CourseMaterial = mongoose.model('CourseMaterial', new mongoose.Schema({
            title: String,
            course: String,
            fileType: String,
            fileName: String
        }));
        
        const materials = await CourseMaterial.find();
        console.log('\n📋 Course Materials in database:');
        if (materials.length === 0) {
            console.log('   No course materials found');
        } else {
            materials.forEach(material => {
                console.log(`   - ${material.title} (${material.fileType}) - Course: ${material.course}`);
            });
        }
        
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        mongoose.connection.close();
    }
}

checkData();
