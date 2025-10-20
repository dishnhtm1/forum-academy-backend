const ListeningExercise = require("../models/ListeningExercise");
const ListeningSubmission = require("../models/ListeningSubmission");
const multer = require("multer");
const mongoose = require("mongoose");
const { GridFSBucket } = require("mongodb");

// GridFS bucket for storing large audio files
let gfsBucket;
mongoose.connection.once("open", () => {
  gfsBucket = new GridFSBucket(mongoose.connection.db, {
    bucketName: "audioFiles",
  });
});

// Configure multer for memory storage (save to MongoDB)
const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // Increase to 50MB limit
  },
  fileFilter: function (req, file, cb) {
    console.log(
      "🔍 File upload filter - File:",
      file.originalname,
      "Size:",
      file.size,
      "Type:",
      file.mimetype
    );

    // Accept audio files with proper MIME type detection
    const allowedMimeTypes = [
      "audio/mpeg", // MP3
      "audio/mp3", // Alternative MP3
      "audio/wav", // WAV
      "audio/wave", // Alternative WAV
      "audio/x-wav", // Another WAV variant
      "audio/ogg", // OGG
      "audio/mp4", // MP4 audio
      "audio/aac", // AAC
    ];

    // Also check file extension as fallback
    const fileExt = file.originalname.toLowerCase().split(".").pop();
    const allowedExtensions = ["mp3", "wav", "ogg", "aac", "m4a"];

    const isValidMimeType = allowedMimeTypes.includes(file.mimetype);
    const isValidExtension = allowedExtensions.includes(fileExt);

    if (isValidMimeType || isValidExtension) {
      // If MIME type is generic but extension is valid, set proper MIME type
      if (file.mimetype === "application/octet-stream" || !file.mimetype) {
        switch (fileExt) {
          case "mp3":
            file.mimetype = "audio/mpeg";
            break;
          case "wav":
            file.mimetype = "audio/wav";
            break;
          case "ogg":
            file.mimetype = "audio/ogg";
            break;
          case "aac":
          case "m4a":
            file.mimetype = "audio/aac";
            break;
          default:
            file.mimetype = "audio/mpeg"; // Default fallback
        }
        console.log("🔧 Corrected MIME type to:", file.mimetype);
      }
      cb(null, true);
    } else {
      console.log("❌ Rejected file - invalid type/extension");
      cb(
        new Error(
          `Only audio files are allowed! Received: ${file.mimetype} (${fileExt})`
        ),
        false
      );
    }
  },
});

// @desc    Get all listening exercises
// @route   GET /api/listening-exercises
// @access  Private
const getListeningExercises = async (req, res) => {
  try {
    const exercises = await ListeningExercise.find()
      .populate("course", "title code")
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 });

    // Add audioUrl to each exercise if it has an audio file
    const exercisesWithAudioUrl = exercises.map((exercise) => {
      const exerciseObj = exercise.toObject();

      // Generate audioUrl if exercise has an audio file
      if (exerciseObj.audioFile && exerciseObj.audioFile.gridfsId) {
        exerciseObj.audioUrl = `${req.protocol}://${req.get(
          "host"
        )}/api/listening-exercises/audio/${exercise._id}`;
      }

      return exerciseObj;
    });

    res.json(exercisesWithAudioUrl);
  } catch (error) {
    console.error("Error fetching listening exercises:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Get single listening exercise
// @route   GET /api/listening-exercises/:id
// @access  Private
const getListeningExercise = async (req, res) => {
  try {
    const exercise = await ListeningExercise.findById(req.params.id)
      .populate("course", "title code")
      .populate("createdBy", "name email");

    if (!exercise) {
      return res.status(404).json({ message: "Exercise not found" });
    }

    // Add audioUrl if exercise has an audio file
    const exerciseObj = exercise.toObject();
    if (exerciseObj.audioFile && exerciseObj.audioFile.gridfsId) {
      exerciseObj.audioUrl = `${req.protocol}://${req.get(
        "host"
      )}/api/listening-exercises/audio/${exercise._id}`;
    }

    res.json(exerciseObj);
  } catch (error) {
    console.error("Error fetching listening exercise:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Create listening exercise
// @route   POST /api/listening-exercises
// @access  Private (Faculty/Admin)
const createListeningExercise = async (req, res) => {
  try {
    const {
      title,
      description,
      course,
      level,
      instructions,
      transcript,
      timeLimit,
      playLimit,
      questions,
      createdBy,
    } = req.body;

    // Parse questions if it's a string
    let parsedQuestions = questions;
    if (typeof questions === "string") {
      parsedQuestions = JSON.parse(questions);
    }

    const exerciseData = {
      title,
      description,
      course,
      level,
      instructions,
      transcript,
      timeLimit: parseInt(timeLimit) || 30,
      playLimit: parseInt(playLimit) || 3,
      questions: parsedQuestions || [],
      createdBy: createdBy || req.user.id,
    };

    // Add audio file information if uploaded
    if (req.file) {
      console.log("📁 Processing uploaded file:", {
        filename: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype,
        buffer_length: req.file.buffer.length,
      });

      // Check file size limit
      const maxSize = 50 * 1024 * 1024; // 50MB limit
      if (req.file.size > maxSize) {
        console.log("❌ File too large:", req.file.size, "Max:", maxSize);
        return res.status(400).json({
          message: "Audio file too large. Maximum size is 50MB.",
          fileSize: req.file.size,
          maxSize: maxSize,
        });
      }

      // Validate and correct MIME type
      let correctedMimeType = req.file.mimetype;
      const fileExt = req.file.originalname.toLowerCase().split(".").pop();

      if (
        !correctedMimeType ||
        correctedMimeType === "application/octet-stream"
      ) {
        switch (fileExt) {
          case "mp3":
            correctedMimeType = "audio/mpeg";
            break;
          case "wav":
            correctedMimeType = "audio/wav";
            break;
          case "ogg":
            correctedMimeType = "audio/ogg";
            break;
          default:
            correctedMimeType = "audio/mpeg";
        }
        console.log(
          "🔧 Corrected MIME type from",
          req.file.mimetype,
          "to",
          correctedMimeType
        );
      }

      // Store file in GridFS
      console.log("📦 Storing file in GridFS...");

      try {
        // Create a readable stream from the buffer
        const uploadStream = gfsBucket.openUploadStream(req.file.originalname, {
          contentType: correctedMimeType,
          metadata: {
            exerciseId: null, // Will be updated after exercise is created
            originalName: req.file.originalname,
            mimetype: correctedMimeType,
            size: req.file.size,
            uploadDate: new Date(),
            fileExtension: fileExt,
          },
        });

        // Store the GridFS file ID in the exercise data
        const fileId = uploadStream.id;

        exerciseData.audioFile = {
          filename: req.file.originalname,
          originalName: req.file.originalname,
          gridfsId: fileId,
          size: req.file.size,
          mimetype: correctedMimeType,
          uploadDate: new Date(),
          fileExtension: fileExt,
        };

        // Upload the file to GridFS
        uploadStream.end(req.file.buffer);

        // Wait for upload to complete
        await new Promise((resolve, reject) => {
          uploadStream.on("finish", resolve);
          uploadStream.on("error", reject);
        });

        console.log(
          "✅ File stored in GridFS with ID:",
          fileId,
          "MIME type:",
          correctedMimeType
        );
      } catch (error) {
        console.error("❌ Error storing file in GridFS:", error);
        return res.status(500).json({
          message: "Error storing audio file",
          error: error.message,
        });
      }
    }

    const exercise = new ListeningExercise(exerciseData);
    await exercise.save();

    // Populate the response
    await exercise.populate([
      { path: "course", select: "title code" },
      { path: "createdBy", select: "name email" },
    ]);

    res.status(201).json({
      message: "Listening exercise created successfully",
      exercise,
    });
  } catch (error) {
    console.error("Error creating listening exercise:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Update listening exercise
// @route   PUT /api/listening-exercises/:id
// @access  Private (Faculty/Admin)
const updateListeningExercise = async (req, res) => {
  try {
    const exercise = await ListeningExercise.findById(req.params.id);

    if (!exercise) {
      return res.status(404).json({ message: "Exercise not found" });
    }

    const {
      title,
      description,
      course,
      level,
      instructions,
      transcript,
      timeLimit,
      playLimit,
      questions,
      isPublished,
    } = req.body;

    // Parse questions if it's a string
    let parsedQuestions = questions;
    if (typeof questions === "string") {
      parsedQuestions = JSON.parse(questions);
    }

    // Update fields
    exercise.title = title || exercise.title;
    exercise.description = description || exercise.description;
    exercise.course = course || exercise.course;
    exercise.level = level || exercise.level;
    exercise.instructions = instructions || exercise.instructions;
    exercise.transcript = transcript || exercise.transcript;
    exercise.timeLimit = timeLimit ? parseInt(timeLimit) : exercise.timeLimit;
    exercise.playLimit = playLimit ? parseInt(playLimit) : exercise.playLimit;
    exercise.questions = parsedQuestions || exercise.questions;

    // Update isPublished if provided (important for publish/unpublish toggle)
    if (typeof isPublished === "boolean") {
      exercise.isPublished = isPublished;
      console.log(`📢 Updated isPublished to: ${isPublished}`);
    }

    // Update audio file if new one uploaded
    if (req.file) {
      console.log("📁 Processing uploaded file for update:", {
        filename: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype,
      });

      // Check file size limit
      const maxSize = 30 * 1024 * 1024; // 30MB limit for testing
      if (req.file.size > maxSize) {
        console.log("❌ File too large:", req.file.size, "Max:", maxSize);
        return res.status(400).json({
          message: "Audio file too large. Maximum size is 30MB.",
          fileSize: req.file.size,
          maxSize: maxSize,
        });
      }

      // Delete old file from GridFS if it exists
      if (exercise.audioFile && exercise.audioFile.gridfsId) {
        try {
          await gfsBucket.delete(exercise.audioFile.gridfsId);
          console.log("🗑️ Old file deleted from GridFS");
        } catch (deleteError) {
          console.warn(
            "⚠️ Could not delete old file from GridFS:",
            deleteError.message
          );
        }
      }

      // Store new file in GridFS
      console.log("� Storing new file in GridFS...");

      try {
        const uploadStream = gfsBucket.openUploadStream(req.file.originalname, {
          metadata: {
            exerciseId: exercise._id,
            originalName: req.file.originalname,
            mimetype: req.file.mimetype,
            size: req.file.size,
            uploadDate: new Date(),
          },
        });

        const fileId = uploadStream.id;

        exercise.audioFile = {
          filename: req.file.originalname,
          originalName: req.file.originalname,
          gridfsId: fileId,
          size: req.file.size,
          mimetype: req.file.mimetype,
          uploadDate: new Date(),
        };

        uploadStream.end(req.file.buffer);
        console.log("✅ New file stored in GridFS with ID:", fileId);
      } catch (error) {
        console.error("❌ Error storing new file in GridFS:", error);
        return res.status(500).json({
          message: "Error storing audio file",
          error: error.message,
        });
      }
    }

    await exercise.save();

    // Populate the response
    await exercise.populate([
      { path: "course", select: "title code" },
      { path: "createdBy", select: "name email" },
    ]);

    console.log(
      `✅ Exercise updated successfully. isPublished: ${exercise.isPublished}`
    );

    res.json({
      success: true,
      message: "Listening exercise updated successfully",
      data: exercise,
      exercise, // Keep for backward compatibility
    });
  } catch (error) {
    console.error("Error updating listening exercise:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Delete listening exercise
// @route   DELETE /api/listening-exercises/:id
// @access  Private (Faculty/Admin)
const deleteListeningExercise = async (req, res) => {
  try {
    const exercise = await ListeningExercise.findById(req.params.id);

    if (!exercise) {
      return res.status(404).json({ message: "Exercise not found" });
    }

    await ListeningExercise.findByIdAndDelete(req.params.id);

    res.json({ message: "Exercise deleted successfully" });
  } catch (error) {
    console.error("Error deleting listening exercise:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Serve audio file
// @route   GET /api/listening-exercises/audio/:id
// @access  Public (for better browser audio compatibility)
const getAudioFile = async (req, res) => {
  try {
    console.log("🎵 Audio file request for exercise ID:", req.params.id);

    const exercise = await ListeningExercise.findById(req.params.id);
    console.log("📚 Exercise found:", exercise ? "Yes" : "No");

    if (!exercise) {
      console.log("❌ Exercise not found");
      return res.status(404).json({ message: "Exercise not found" });
    }

    console.log("🔍 Exercise audioFile field:", exercise.audioFile);

    if (!exercise.audioFile || !exercise.audioFile.gridfsId) {
      console.log("❌ No audio file data in exercise");
      return res.status(404).json({
        message:
          "Audio file not found. This exercise was created without an audio file. Please edit the exercise and upload an audio file.",
        hint: "Use the edit button to upload an audio file for this exercise.",
      });
    }

    console.log("📁 Audio file info:", {
      filename: exercise.audioFile.filename,
      originalName: exercise.audioFile.originalName,
      size: exercise.audioFile.size,
      mimetype: exercise.audioFile.mimetype,
      gridfsId: exercise.audioFile.gridfsId,
    });

    console.log("✅ Audio file found in GridFS, streaming...");

    try {
      // Verify the file exists in GridFS first
      const files = await gfsBucket
        .find({ _id: exercise.audioFile.gridfsId })
        .toArray();
      if (!files || files.length === 0) {
        console.log("❌ File not found in GridFS storage");
        return res
          .status(404)
          .json({ message: "Audio file not found in storage" });
      }

      const file = files[0];
      console.log("📂 GridFS file found:", {
        filename: file.filename,
        length: file.length,
        contentType: file.contentType,
        uploadDate: file.uploadDate,
      });

      // Handle range requests for better browser compatibility
      const range = req.headers.range;
      const fileSize = file.length;

      // Enhanced MIME type detection with browser compatibility fixes
      let mimetype = file.contentType || exercise.audioFile.mimetype;
      const filename = file.filename || exercise.audioFile.filename || "";
      const fileExtension =
        exercise.audioFile.fileExtension ||
        filename.toLowerCase().split(".").pop();

      // Fix MIME type based on file extension for better browser compatibility
      if (
        !mimetype ||
        mimetype === "application/octet-stream" ||
        mimetype === "binary/octet-stream"
      ) {
        switch (fileExtension) {
          case "mp3":
            mimetype = "audio/mpeg";
            break;
          case "wav":
            mimetype = "audio/wav";
            break;
          case "ogg":
            mimetype = "audio/ogg";
            break;
          case "aac":
            mimetype = "audio/aac";
            break;
          case "m4a":
            mimetype = "audio/mp4";
            break;
          default:
            mimetype = "audio/mpeg"; // Default to MP3 for better browser support
        }
      }

      // Ensure MIME type is browser-compatible
      if (mimetype === "audio/mp3") {
        mimetype = "audio/mpeg"; // Convert to standard MIME type
      }

      console.log(
        "🎯 Using MIME type:",
        mimetype,
        "for extension:",
        fileExtension
      );

      // Set comprehensive CORS headers for audio streaming
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
      res.setHeader(
        "Access-Control-Allow-Headers",
        "Range, Content-Type, Authorization"
      );
      res.setHeader(
        "Access-Control-Expose-Headers",
        "Content-Length, Content-Range, Accept-Ranges"
      );

      if (range) {
        console.log("🎯 Range request:", range);
        const parts = range.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
        const chunksize = end - start + 1;

        // Validate range
        if (start >= fileSize || end >= fileSize || start > end) {
          console.log("❌ Invalid range:", { start, end, fileSize });
          return res.status(416).json({ message: "Range not satisfiable" });
        }

        // Create download stream from GridFS with range
        const downloadStream = gfsBucket.openDownloadStream(
          exercise.audioFile.gridfsId,
          {
            start: start,
            end: end,
          }
        );

        // Set headers for partial content
        res.status(206);
        res.setHeader("Content-Range", `bytes ${start}-${end}/${fileSize}`);
        res.setHeader("Accept-Ranges", "bytes");
        res.setHeader("Content-Length", chunksize);
        res.setHeader("Content-Type", mimetype);
        res.setHeader("Cache-Control", "public, max-age=3600");

        downloadStream.on("error", (error) => {
          console.error("❌ GridFS range download error:", error);
          if (!res.headersSent) {
            res.status(500).json({
              message: "Error streaming audio file",
              error: error.message,
            });
          }
        });

        downloadStream.pipe(res);
      } else {
        // Regular full file download
        const downloadStream = gfsBucket.openDownloadStream(
          exercise.audioFile.gridfsId
        );

        // Set appropriate headers for audio streaming
        res.status(200);
        res.setHeader("Content-Type", mimetype);
        res.setHeader("Accept-Ranges", "bytes");
        res.setHeader("Content-Length", fileSize);
        res.setHeader(
          "Content-Disposition",
          `inline; filename="${file.filename}"`
        );
        res.setHeader("Cache-Control", "public, max-age=3600");

        console.log("📤 Streaming full file with headers:", {
          "Content-Type": mimetype,
          "Content-Length": fileSize,
          "Accept-Ranges": "bytes",
        });

        // Handle stream errors
        downloadStream.on("error", (error) => {
          console.error("❌ GridFS download error:", error);
          if (!res.headersSent) {
            res.status(500).json({
              message: "Error streaming audio file",
              error: error.message,
            });
          }
        });

        downloadStream.on("end", () => {
          console.log("✅ Audio file streaming completed");
        });

        // Pipe the file stream to the response
        downloadStream.pipe(res);
      }
    } catch (gridfsError) {
      console.error("❌ GridFS error:", gridfsError);
      res.status(500).json({
        message: "Error retrieving audio file from storage",
        error: gridfsError.message,
      });
    }
  } catch (error) {
    console.error("❌ Error serving audio file:", error);
    res.status(500).json({
      message: "Server error while serving audio",
      error: error.message,
    });
  }
};

module.exports = {
  getListeningExercises,
  getListeningExercise,
  createListeningExercise,
  updateListeningExercise,
  deleteListeningExercise,
  getAudioFile,
  upload,
};
