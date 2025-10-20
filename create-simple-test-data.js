const mongoose = require("mongoose");
require("dotenv").config();

const ListeningExercise = require("./models/ListeningExercise");
const Course = require("./models/Course");
const User = require("./models/User");

async function createSimpleTestData() {
  try {
    console.log("🔌 Connecting to database...");
    console.log(
      "📍 Database URI:",
      process.env.MONGO_URI?.substring(0, 50) + "..."
    );

    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to database");

    // Get or create test user
    let testUser = await User.findOne({ email: "test@forumacademy.com" });
    if (!testUser) {
      testUser = await User.create({
        firstName: "Test",
        lastName: "Teacher",
        email: "test@forumacademy.com",
        password: "testpassword123",
        role: "faculty",
        isApproved: true,
      });
      console.log("✅ Test user created");
    } else {
      console.log("✅ Test user found");
    }

    // Create or find test course
    console.log("\n📚 Creating test course...");
    const course = await Course.findOneAndUpdate(
      { code: "TEST101" },
      {
        title: "Test Course for Student Dashboard",
        code: "TEST101",
        description: "Test course for debugging",
        level: "beginner",
        category: "English",
      },
      { upsert: true, new: true }
    );
    console.log("✅ Test course ready:", course._id);

    // Create 3 listening exercises
    console.log("\n🎧 Creating listening exercises...");
    const exercises = [];

    for (let i = 1; i <= 3; i++) {
      const exercise = await ListeningExercise.create({
        title: `Test Listening Exercise ${i}`,
        description: `This is test listening exercise number ${i}`,
        course: course._id,
        createdBy: testUser._id,
        level: i === 1 ? "beginner" : i === 2 ? "intermediate" : "advanced",
        timeLimit: 10 + i * 5,
        isPublished: true, // CRITICAL!
        instructions: `Listen carefully and answer ${i + 1} questions`,
        questions: [
          {
            type: "multiple_choice",
            question: `Question 1 for Exercise ${i}?`,
            options: [
              { text: "Option A", isCorrect: true },
              { text: "Option B", isCorrect: false },
              { text: "Option C", isCorrect: false },
              { text: "Option D", isCorrect: false },
            ],
            points: 10,
            explanation: "Option A is correct",
          },
          {
            type: "multiple_choice",
            question: `Question 2 for Exercise ${i}?`,
            options: [
              { text: "Answer 1", isCorrect: false },
              { text: "Answer 2", isCorrect: true },
              { text: "Answer 3", isCorrect: false },
              { text: "Answer 4", isCorrect: false },
            ],
            points: 10,
            explanation: "Answer 2 is correct",
          },
        ],
      });
      exercises.push(exercise);
      console.log(`   ✅ Exercise ${i} created: ${exercise._id}`);
    }

    // Summary
    console.log("\n" + "=".repeat(60));
    console.log("🎉 SUCCESS! Test data created!");
    console.log("=".repeat(60));
    console.log("\n📊 Created:");
    console.log(`   ✅ 1 Test Course (${course.code})`);
    console.log(`   ✅ 1 Test User (${testUser.email})`);
    console.log(`   ✅ 3 Published Listening Exercises`);

    exercises.forEach((ex, idx) => {
      console.log(`      ${idx + 1}. ${ex.title} (${ex.level})`);
    });

    console.log("\n✨ Next Steps:");
    console.log(
      "   1. Open Student Dashboard: http://localhost:3000/dashboard"
    );
    console.log("   2. Login with your student account");
    console.log("   3. You should see:");
    console.log("      Active Listening Exercises: 3");
    console.log("   4. Check browser console (F12) for API logs");
    console.log("\n📝 Expected Console Output:");
    console.log("   📚 Listening Exercises Response: Array(3)");
    console.log("   ✅ Published Listening Exercises: 3");
    console.log("=".repeat(60));

    await mongoose.connection.close();
    console.log("\n✅ Database connection closed");
    process.exit(0);
  } catch (error) {
    console.error("\n❌ ERROR:", error.message);
    console.error(error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

console.log("🚀 Starting simple test data creation...\n");
createSimpleTestData();
