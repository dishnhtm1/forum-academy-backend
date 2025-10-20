// Script to check question structure in listening exercises
const mongoose = require("mongoose");
require("dotenv").config();

const Course = require("./models/Course");
const ListeningExercise = require("./models/ListeningExercise");

async function checkQuestions() {
  try {
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;

    console.log("🔄 Connecting to MongoDB...");
    await mongoose.connect(mongoUri);
    console.log("✅ Connected to MongoDB\n");

    const exercises = await ListeningExercise.find({})
      .populate("course", "title code")
      .lean();

    console.log("📊 QUESTION STRUCTURE ANALYSIS");
    console.log("=".repeat(70));

    exercises.forEach((ex, index) => {
      console.log(`\n${index + 1}. "${ex.title}"`);
      console.log(`   ID: ${ex._id}`);
      console.log(`   Questions: ${ex.questions?.length || 0}`);

      if (ex.questions && ex.questions.length > 0) {
        console.log(`\n   📋 Question Details:`);
        ex.questions.forEach((q, qIndex) => {
          console.log(`\n   Question ${qIndex + 1}:`);
          console.log(`      - Type: ${q.type || "N/A"}`);
          console.log(`      - Question field: ${q.question || "N/A"}`);
          console.log(`      - QuestionText field: ${q.questionText || "N/A"}`);
          console.log(`      - Points: ${q.points || 0}`);
          console.log(`      - Options:`, q.options || []);
          console.log(
            `      - Correct Answer: ${
              q.correctAnswer !== undefined ? q.correctAnswer : "N/A"
            }`
          );
          console.log(`\n      Full Question Object:`);
          console.log(JSON.stringify(q, null, 2));
        });
      } else {
        console.log(`   ⚠️  No questions found`);
      }
    });

    console.log("\n" + "=".repeat(70));

    await mongoose.connection.close();
    console.log("\n✅ Disconnected from MongoDB");
  } catch (error) {
    console.error("❌ Error:", error.message);
    console.error(error);
    process.exit(1);
  }
}

checkQuestions();
