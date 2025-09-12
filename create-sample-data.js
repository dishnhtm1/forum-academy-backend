// Sample data creation script for testing dashboard functionality
const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Course = require('./models/Course');
const CourseMaterial = require('./models/CourseMaterial');
const User = require('./models/User');

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

const createSampleData = async () => {
    try {
        console.log('🔧 Creating sample data for dashboard testing...');

        // Find an admin user to use as instructor
        const adminUser = await User.findOne({ role: { $in: ['admin', 'faculty', 'teacher'] } });
        if (!adminUser) {
            console.log('❌ No admin user found! Please create an admin user first.');
            return;
        }

        console.log(`✅ Using ${adminUser.email} as instructor`);

        // Create sample courses
        const sampleCourses = [
            {
                code: 'ENG101',
                title: 'English for Beginners',
                description: 'Basic English language course covering fundamentals of grammar, vocabulary, and conversation.',
                category: 'language',
                level: 'beginner',
                duration: 12,
                price: 299,
                maxStudents: 30,
                startDate: new Date('2025-09-15'),
                endDate: new Date('2025-12-15'),
                instructor: adminUser._id,
                isActive: true
            },
            {
                code: 'BUS201',
                title: 'Business Communication',
                description: 'Advanced business communication skills for professional environments.',
                category: 'business',
                level: 'intermediate',
                duration: 8,
                price: 499,
                maxStudents: 25,
                startDate: new Date('2025-10-01'),
                endDate: new Date('2025-11-30'),
                instructor: adminUser._id,
                isActive: true
            },
            {
                code: 'TECH301',
                title: 'Introduction to Programming',
                description: 'Learn the fundamentals of programming with hands-on exercises.',
                category: 'technology',
                level: 'beginner',
                duration: 16,
                price: 799,
                maxStudents: 20,
                startDate: new Date('2025-09-20'),
                endDate: new Date('2025-01-20'),
                instructor: adminUser._id,
                isActive: true
            },
            {
                code: 'JAP101',
                title: 'Japanese Language Basics',
                description: 'Introduction to Japanese language, culture, and basic conversation.',
                category: 'language',
                level: 'beginner',
                duration: 10,
                price: 399,
                maxStudents: 15,
                startDate: new Date('2025-09-25'),
                endDate: new Date('2025-12-01'),
                instructor: adminUser._id,
                isActive: true
            },
            {
                code: 'ADV401',
                title: 'Advanced Business Strategy',
                description: 'Strategic planning and execution for business leaders.',
                category: 'business',
                level: 'advanced',
                duration: 6,
                price: 899,
                maxStudents: 12,
                startDate: new Date('2025-10-15'),
                endDate: new Date('2025-12-15'),
                instructor: adminUser._id,
                isActive: true
            }
        ];

        // Delete existing courses to start fresh (optional)
        await Course.deleteMany({});
        console.log('🧹 Cleared existing courses');

        // Create courses
        const createdCourses = await Course.insertMany(sampleCourses);
        console.log(`✅ Created ${createdCourses.length} sample courses`);

        // Create some sample course materials
        const sampleMaterials = [];
        createdCourses.forEach(course => {
            sampleMaterials.push({
                course: course._id,
                title: `${course.code} - Course Syllabus`,
                description: `Detailed syllabus for ${course.title}`,
                category: 'reading',
                fileType: 'pdf',
                fileName: `${course.code}_syllabus.pdf`,
                fileSize: 1024 * 500, // 500KB
                filePath: `/uploads/materials/${course.code}_syllabus.pdf`,
                mimeType: 'application/pdf',
                uploadedBy: adminUser._id,
                accessLevel: 'course_students'
            });

            sampleMaterials.push({
                course: course._id,
                title: `${course.code} - Welcome Video`,
                description: `Welcome video for ${course.title}`,
                category: 'lecture',
                fileType: 'video',
                fileName: `${course.code}_welcome.mp4`,
                fileSize: 1024 * 1024 * 50, // 50MB
                filePath: `/uploads/materials/${course.code}_welcome.mp4`,
                mimeType: 'video/mp4',
                uploadedBy: adminUser._id,
                accessLevel: 'public'
            });
        });

        await CourseMaterial.deleteMany({});
        const createdMaterials = await CourseMaterial.insertMany(sampleMaterials);
        console.log(`✅ Created ${createdMaterials.length} sample materials`);

        console.log('🎉 Sample data created successfully!');
        console.log('📋 Summary:');
        console.log(`   - Courses: ${createdCourses.length}`);
        console.log(`   - Materials: ${createdMaterials.length}`);
        console.log(`   - Instructor: ${adminUser.email}`);
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error creating sample data:', error);
        process.exit(1);
    }
};

createSampleData();
