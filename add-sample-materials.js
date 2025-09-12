const mongoose = require('mongoose');
const CourseMaterial = require('./models/CourseMaterial');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/forum-academy', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const sampleMaterials = [
    {
        title: "Advanced JavaScript Concepts",
        description: "Deep dive into closures, prototypes, and async programming",
        course: "javascript",
        uploadedBy: new mongoose.Types.ObjectId(),
        fileType: "pdf",
        fileName: "advanced-js-concepts.pdf",
        filePath: "uploads/course-materials/advanced-js-concepts.pdf",
        fileSize: 2548672, // ~2.5MB
        mimeType: "application/pdf",
        category: "lecture",
        week: 3,
        lesson: 2,
        accessLevel: "course_students",
        tags: ["advanced", "javascript", "concepts"],
        downloadCount: 15
    },
    {
        title: "React Hooks Tutorial Video",
        description: "Complete guide to React Hooks with practical examples",
        course: "react",
        uploadedBy: new mongoose.Types.ObjectId(),
        fileType: "video",
        fileName: "react-hooks-tutorial.mp4",
        filePath: "uploads/course-materials/react-hooks-tutorial.mp4",
        fileSize: 156789120, // ~150MB
        mimeType: "video/mp4",
        category: "lecture",
        week: 2,
        lesson: 1,
        accessLevel: "course_students",
        tags: ["react", "hooks", "tutorial", "video"],
        downloadCount: 32
    },
    {
        title: "Node.js Project Assignment",
        description: "Build a RESTful API using Express and MongoDB",
        course: "node",
        uploadedBy: new mongoose.Types.ObjectId(),
        fileType: "document",
        fileName: "nodejs-assignment.docx",
        filePath: "uploads/course-materials/nodejs-assignment.docx",
        fileSize: 456789, // ~450KB
        mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        category: "assignment",
        week: 4,
        lesson: 3,
        accessLevel: "course_students",
        tags: ["nodejs", "assignment", "api", "mongodb"],
        downloadCount: 8
    },
    {
        title: "Python Basics Audio Lecture",
        description: "Introduction to Python programming language",
        course: "python",
        uploadedBy: new mongoose.Types.ObjectId(),
        fileType: "audio",
        fileName: "python-basics-lecture.mp3",
        filePath: "uploads/course-materials/python-basics-lecture.mp3",
        fileSize: 45623789, // ~43MB
        mimeType: "audio/mpeg",
        category: "lecture",
        week: 1,
        lesson: 1,
        accessLevel: "all_students",
        tags: ["python", "basics", "introduction", "audio"],
        downloadCount: 22
    },
    {
        title: "Business Communication Guidelines",
        description: "Essential guidelines for professional business communication",
        course: "business",
        uploadedBy: new mongoose.Types.ObjectId(),
        fileType: "pdf",
        fileName: "business-communication.pdf",
        filePath: "uploads/course-materials/business-communication.pdf",
        fileSize: 1234567, // ~1.2MB
        mimeType: "application/pdf",
        category: "reference",
        week: 1,
        lesson: 2,
        accessLevel: "course_students",
        tags: ["business", "communication", "guidelines"],
        downloadCount: 5
    }
];

async function addSampleMaterials() {
    try {
        console.log('🚀 Adding sample course materials...');
        
        // Clear existing materials (optional)
        // await CourseMaterial.deleteMany({});
        // console.log('🗑️ Cleared existing materials');
        
        // Add new materials
        const results = await CourseMaterial.insertMany(sampleMaterials);
        console.log(`✅ Added ${results.length} sample course materials`);
        
        // Log the added materials
        results.forEach((material, index) => {
            console.log(`${index + 1}. ${material.title} (${material.fileType.toUpperCase()})`);
        });
        
        mongoose.connection.close();
        console.log('📚 Sample materials added successfully!');
    } catch (error) {
        console.error('❌ Error adding sample materials:', error);
        mongoose.connection.close();
    }
}

addSampleMaterials();
