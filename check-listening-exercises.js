// Quick script to check listening exercises in MongoDB
const mongoose = require("mongoose");
require("dotenv").config();

// Load models (Course must be loaded before ListeningExercise because of populate)
const Course = require("./models/Course");
const ListeningExercise = require("./models/ListeningExercise");

async function checkExercises() {
  try {
    // Connect to MongoDB (supports both MONGO_URI and MONGODB_URI)
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;

    if (!mongoUri) {
      console.error("❌ No MongoDB URI found in .env file");
      console.error(
        "Please check your .env file has MONGO_URI or MONGODB_URI set"
      );
      process.exit(1);
    }

    console.log("🔄 Connecting to MongoDB...");
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ Connected to MongoDB");

    // Get all listening exercises
    const allExercises = await ListeningExercise.find({})
      .populate("course", "title code")
      .lean();

    console.log("\n📊 LISTENING EXERCISES SUMMARY");
    console.log("=".repeat(60));
    console.log(`Total exercises: ${allExercises.length}`);

    const published = allExercises.filter((ex) => ex.isPublished === true);
    const unpublished = allExercises.filter((ex) => ex.isPublished !== true);

    console.log(`✅ Published: ${published.length}`);
    console.log(`📝 Unpublished/Draft: ${unpublished.length}`);
    console.log("=".repeat(60));

    if (allExercises.length === 0) {
      console.log("\n⚠️  NO EXERCISES FOUND IN DATABASE");
      console.log("You need to create listening exercises first!");
    } else {
      console.log("\n📋 EXERCISE DETAILS:\n");
      allExercises.forEach((ex, index) => {
        console.log(`${index + 1}. "${ex.title}"`);
        console.log(`   - ID: ${ex._id}`);
        console.log(
          `   - Published: ${ex.isPublished ? "✅ YES" : "❌ NO (DRAFT)"}`
        );
        console.log(`   - Level: ${ex.level || "N/A"}`);
        console.log(`   - Time Limit: ${ex.timeLimit || "N/A"} minutes`);
        console.log(
          `   - Course: ${ex.course?.title || ex.course?.code || "No course"}`
        );
        console.log(`   - Questions: ${ex.questions?.length || 0}`);
        console.log(`   - Created: ${ex.createdAt}`);
        console.log("");
      });

      if (unpublished.length > 0) {
        console.log("\n⚠️  ACTION REQUIRED:");
        console.log(`You have ${unpublished.length} unpublished exercise(s).`);
        console.log("To make them visible to students:");
        console.log("1. Go to Teacher Dashboard");
        console.log("2. Navigate to Listening Exercises tab");
        console.log('3. Click the "Publish" button for each exercise');
        console.log("\nOR run this command to publish all:");
        console.log(
          "db.listeningexercises.updateMany({}, {$set: {isPublished: true}})"
        );
      }
    }

    await mongoose.connection.close();
    console.log("\n✅ Disconnected from MongoDB");
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

checkExercises();
