const mongoose = require("mongoose");
require("dotenv").config();

const ListeningExercise = require("./models/ListeningExercise");
const Quiz = require("./models/Quiz");
const Homework = require("./models/Homework");
const Course = require("./models/Course");

async function createTestData() {
  try {
    console.log("🔌 Connecting to database...");
    console.log(
      "📍 Database URI:",
      process.env.MONGO_URI?.substring(0, 50) + "..."
    );

    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to database");

    // Create or find test course
    console.log("\n📚 Creating test course...");
    const course = await Course.findOneAndUpdate(
      { code: "TEST101" },
      {
        title: "Test Course for Debugging",
        code: "TEST101",
        description:
          "This is a test course created for debugging the student dashboard",
        level: "beginner",
        category: "English",
      },
      { upsert: true, new: true }
    );
    console.log("✅ Test course created/found:", course._id);

    // Get or create a test user for createdBy field
    const User = require("./models/User");
    let testUser = await User.findOne({ email: "test@forumacademy.com" });
    if (!testUser) {
      testUser = await User.create({
        firstName: "Test",
        lastName: "Admin",
        email: "test@forumacademy.com",
        password: "testpassword123",
        role: "faculty",
        isApproved: true,
      });
      console.log("✅ Test user created for createdBy field");
    }

    // Create listening exercise
    console.log("\n🎧 Creating listening exercise...");
    const exercise = await ListeningExercise.create({
      title: "Test Listening Exercise - Beginner Level",
      description:
        "This is a test listening exercise to verify the student dashboard is working correctly",
      course: course._id,
      createdBy: testUser._id,
      level: "beginner", // Changed from 'difficulty' to 'level'
      timeLimit: 10,
      isPublished: true, // CRITICAL: Must be published for students to see
      instructions: "Listen carefully and answer the questions",
      questions: [
        {
          type: "multiple_choice", // REQUIRED field
          question: "What is the main topic of the audio?",
          options: [
            { text: "Education", isCorrect: true },
            { text: "Technology", isCorrect: false },
            { text: "Sports", isCorrect: false },
            { text: "Music", isCorrect: false },
          ],
          points: 10,
          explanation: "The audio discusses educational topics",
        },
        {
          type: "multiple_choice", // REQUIRED field
          question: "How many people are speaking?",
          options: [
            { text: "1", isCorrect: false },
            { text: "2", isCorrect: true },
            { text: "3", isCorrect: false },
            { text: "4", isCorrect: false },
          ],
          points: 10,
          explanation: "Two people are having a conversation",
        },
      ],
    });
    console.log("✅ Test listening exercise created:", exercise._id);
    console.log("   - Title:", exercise.title);
    console.log("   - Published:", exercise.isPublished);
    console.log("   - Level:", exercise.level);
    console.log("   - Questions:", exercise.questions.length);

    // Create quiz
    console.log("\n📝 Creating quiz...");
    const quiz = await Quiz.create({
      title: "Test Quiz - English Grammar",
      description: "Test your English grammar knowledge",
      course: course._id,
      createdBy: testUser._id,
      timeLimit: 30,
      passingScore: 70,
      maxAttempts: 3,
      isPublished: true, // CRITICAL: Must be true for students to see
      questions: [
        {
          question: "What is the correct form of the verb?",
          type: "multiple-choice",
          options: ["go", "goes", "going", "gone"],
          correctAnswer: 1,
          points: 10,
          explanation: 'The subject "he" requires the singular form "goes"',
        },
        {
          question: "Choose the correct preposition:",
          type: "multiple-choice",
          options: ["in", "on", "at", "by"],
          correctAnswer: 2,
          points: 10,
          explanation: 'We use "at" for specific times',
        },
        {
          question: "Which sentence is grammatically correct?",
          type: "multiple-choice",
          options: [
            "He don't like pizza",
            "He doesn't like pizza",
            "He doesn't likes pizza",
            "He not like pizza",
          ],
          correctAnswer: 1,
          points: 10,
          explanation: 'The correct form is "doesn\'t like"',
        },
      ],
    });
    console.log("✅ Test quiz created:", quiz._id);
    console.log("   - Title:", quiz.title);
    console.log("   - Published:", quiz.isPublished);
    console.log("   - Questions:", quiz.questions.length);

    // Create homework
    console.log("\n📋 Creating homework...");
    const homework = await Homework.create({
      title: "Test Homework Assignment - Essay Writing",
      description: "Write a short essay about your favorite book",
      instructions:
        "Your essay should be at least 500 words. Include an introduction, body paragraphs, and a conclusion.",
      course: course._id,
      createdBy: testUser._id,
      assignedTo: [], // Empty array for now
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Due in 7 days
      isPublished: true, // CRITICAL: Must be published for students to see
      totalPoints: 100,
    });
    console.log("✅ Test homework created:", homework._id);
    console.log("   - Title:", homework.title);
    console.log("   - Published:", homework.isPublished);
    console.log("   - Due Date:", homework.dueDate.toLocaleDateString());

    // Summary
    console.log("\n" + "=".repeat(60));
    console.log("🎉 SUCCESS! Test data created successfully!");
    console.log("=".repeat(60));
    console.log("\n📊 Summary:");
    console.log("   ✅ 1 Test Course (TEST101)");
    console.log("   ✅ 1 Active Listening Exercise");
    console.log("   ✅ 1 Published Quiz (3 questions)");
    console.log("   ✅ 1 Active Homework Assignment");
    console.log("\n🔑 Important Status Fields:");
    console.log("   - Listening Exercise: isPublished = true");
    console.log("   - Quiz: isPublished = true");
    console.log("   - Homework: isPublished = true");
    console.log("\n✨ Next Steps:");
    console.log("   1. Refresh your Student Dashboard (Ctrl+Shift+R)");
    console.log("   2. Check browser console (F12) for API logs");
    console.log("   3. You should now see:");
    console.log("      - Active Listening Exercises: 1");
    console.log("      - Available Quizzes: 1");
    console.log("      - Pending Homework: 1");
    console.log("\n📝 If you still see 0 items:");
    console.log("   1. Check browser console for errors");
    console.log(
      '   2. Verify you\'re logged in (check localStorage.getItem("token"))'
    );
    console.log("   3. Check server logs for API requests");
    console.log(
      "   4. Run: curl http://localhost:5000/api/listening-exercises"
    );
    console.log("=".repeat(60));

    await mongoose.connection.close();
    console.log("\n✅ Database connection closed");
    process.exit(0);
  } catch (error) {
    console.error("\n❌ ERROR:", error.message);
    console.error("\nFull error:", error);

    if (error.name === "ValidationError") {
      console.error("\n🔍 Validation errors:");
      Object.keys(error.errors).forEach((key) => {
        console.error(`   - ${key}: ${error.errors[key].message}`);
      });
    }

    await mongoose.connection.close();
    process.exit(1);
  }
}

console.log("🚀 Starting test data creation...");
console.log("📁 Working directory:", __dirname);
console.log("");

createTestData();
