// Script to check audio file status for listening exercises
const mongoose = require("mongoose");
require("dotenv").config();

const Course = require("./models/Course");
const ListeningExercise = require("./models/ListeningExercise");

async function checkAudioFiles() {
  try {
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;

    console.log("🔄 Connecting to MongoDB...");
    await mongoose.connect(mongoUri);
    console.log("✅ Connected to MongoDB\n");

    const exercises = await ListeningExercise.find({})
      .populate("course", "title code")
      .lean();

    console.log("📊 AUDIO FILE STATUS");
    console.log("=".repeat(70));

    exercises.forEach((ex, index) => {
      console.log(`\n${index + 1}. "${ex.title}"`);
      console.log(`   ID: ${ex._id}`);
      console.log(`   Course: ${ex.course?.title || "N/A"}`);

      if (ex.audioFile && (ex.audioFile.filename || ex.audioFile.gridfsId)) {
        console.log(`   📼 Audio: ✅ HAS AUDIO FILE`);
        console.log(
          `      - Original Name: ${ex.audioFile.originalName || "N/A"}`
        );
        console.log(`      - Filename: ${ex.audioFile.filename || "N/A"}`);
        console.log(`      - GridFS ID: ${ex.audioFile.gridfsId || "N/A"}`);
        console.log(
          `      - Size: ${
            ex.audioFile.size
              ? (ex.audioFile.size / 1024 / 1024).toFixed(2) + " MB"
              : "N/A"
          }`
        );
        console.log(`      - Type: ${ex.audioFile.mimetype || "N/A"}`);
        console.log(`      - Upload Date: ${ex.audioFile.uploadDate || "N/A"}`);
      } else {
        console.log(`   📼 Audio: ❌ NO AUDIO FILE UPLOADED`);
      }

      console.log(`   Questions: ${ex.questions?.length || 0}`);
    });

    console.log("\n" + "=".repeat(70));

    const withAudio = exercises.filter(
      (ex) => ex.audioFile && (ex.audioFile.filename || ex.audioFile.gridfsId)
    );
    const withoutAudio = exercises.filter(
      (ex) =>
        !ex.audioFile || (!ex.audioFile.filename && !ex.audioFile.gridfsId)
    );

    console.log(`\n📊 SUMMARY:`);
    console.log(`   ✅ Exercises with audio: ${withAudio.length}`);
    console.log(`   ❌ Exercises without audio: ${withoutAudio.length}`);

    if (withoutAudio.length > 0) {
      console.log(`\n⚠️  TO ADD AUDIO FILES:`);
      console.log(`   1. Go to Teacher Dashboard`);
      console.log(`   2. Navigate to Listening Exercises tab`);
      console.log(`   3. Click "Edit" on the exercise`);
      console.log(`   4. Upload an audio file (MP3, WAV, OGG, AAC)`);
      console.log(`   5. Save the exercise`);
      console.log(`\n   Supported formats: MP3, WAV, OGG, AAC, M4A`);
      console.log(`   Maximum file size: 50 MB`);
    }

    await mongoose.connection.close();
    console.log("\n✅ Disconnected from MongoDB");
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

checkAudioFiles();
