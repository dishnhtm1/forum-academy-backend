// Script to publish all listening exercises
const mongoose = require("mongoose");
require("dotenv").config();

const Course = require("./models/Course");
const ListeningExercise = require("./models/ListeningExercise");

async function publishAllExercises() {
  try {
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;

    console.log("🔄 Connecting to MongoDB...");
    await mongoose.connect(mongoUri);
    console.log("✅ Connected to MongoDB\n");

    // Update all exercises to published
    const result = await ListeningExercise.updateMany(
      { isPublished: { $ne: true } },
      { $set: { isPublished: true } }
    );

    console.log("📊 PUBLISH RESULTS:");
    console.log("=".repeat(60));
    console.log(`✅ ${result.modifiedCount} exercise(s) published`);
    console.log(`ℹ️  ${result.matchedCount} exercise(s) matched the criteria`);
    console.log("=".repeat(60));

    // Verify the changes
    const publishedCount = await ListeningExercise.countDocuments({
      isPublished: true,
    });
    const unpublishedCount = await ListeningExercise.countDocuments({
      isPublished: { $ne: true },
    });

    console.log("\n📋 VERIFICATION:");
    console.log(`✅ Published exercises: ${publishedCount}`);
    console.log(`📝 Unpublished exercises: ${unpublishedCount}`);

    if (publishedCount > 0) {
      console.log("\n🎉 SUCCESS! Exercises are now visible to students.");
      console.log("👉 Refresh the Student Dashboard to see them.");
    }

    await mongoose.connection.close();
    console.log("\n✅ Disconnected from MongoDB");
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

publishAllExercises();
