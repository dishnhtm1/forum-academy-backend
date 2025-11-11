const express = require("express");
const router = express.Router();
const {
  getListeningExercises,
  getListeningExercise,
  createListeningExercise,
  updateListeningExercise,
  deleteListeningExercise,
  getAudioFile,
  upload,
} = require("../controllers/listeningExerciseController");

const { protect, authorize } = require("../middleware/authMiddleware");

// Public audio route (no authentication required for audio streaming)
// @route   GET /api/listening-exercises/audio/:id
// @desc    Serve audio file
// @access  Public (for better browser compatibility)
router.get(
  "/audio/:id",
  (req, res, next) => {
    // Add specific CORS headers for audio requests
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Range, Content-Type, Authorization"
    );
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");

    if (req.method === "OPTIONS") {
      res.status(204).end();
      return;
    }

    next();
  },
  getAudioFile
);

// Test endpoint to check audio file info
// @route   GET /api/listening-exercises/test-audio/:id
// @desc    Test audio file info
// @access  Public
router.get("/test-audio/:id", async (req, res) => {
  try {
    const ListeningExercise = require("../models/ListeningExercise");
    const exercise = await ListeningExercise.findById(req.params.id);

    if (!exercise) {
      return res.status(404).json({ message: "Exercise not found" });
    }

    res.json({
      exerciseId: exercise._id,
      title: exercise.title,
      audioFile: exercise.audioFile,
      audioUrl: exercise.audioFile
        ? `${req.protocol}://${req.get("host")}/api/listening-exercises/audio/${
            exercise._id
          }`
        : null,
      hasAudioFile: !!exercise.audioFile?.gridfsId,
      serverInfo: {
        protocol: req.protocol,
        host: req.get("host"),
        userAgent: req.get("user-agent"),
        origin: req.get("origin"),
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Debug endpoint for audio file headers
// @route   HEAD /api/listening-exercises/audio/:id
// @desc    Get audio file headers for debugging
// @access  Public
router.head(
  "/audio/:id",
  (req, res, next) => {
    // Add specific CORS headers for audio requests
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Range, Content-Type, Authorization"
    );
    res.setHeader("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
    res.setHeader(
      "Access-Control-Expose-Headers",
      "Content-Length, Content-Range, Accept-Ranges, Content-Type"
    );

    if (req.method === "OPTIONS") {
      res.status(204).end();
      return;
    }

    next();
  },
  getAudioFile
);

// All other routes require authentication
router.use(protect);

// @route   DELETE /api/listening-exercises/submissions/:id
// @desc    Delete a submission (Teachers/Admin)
// @access  Private (Faculty/Admin/Teacher)
router.delete(
  "/submissions/:id",
  authorize("faculty", "admin", "teacher"),
  async (req, res) => {
    try {
      const ListeningSubmission = require("../models/ListeningSubmission");

      const submission = await ListeningSubmission.findById(req.params.id);

      if (!submission) {
        return res.status(404).json({
          success: false,
          message: "Submission not found",
        });
      }

      await ListeningSubmission.findByIdAndDelete(req.params.id);

      res.json({
        success: true,
        message: "Submission deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting submission:", error);
      res.status(500).json({
        success: false,
        message: "Error deleting submission",
        error: error.message,
      });
    }
  }
);

// @route   GET /api/listening-exercises
// @desc    Get all listening exercises
// @access  Private
router.get("/", getListeningExercises);

// @route   GET /api/listening-exercises/:id
// @desc    Get single listening exercise
// @access  Private
router.get("/:id", getListeningExercise);

// @route   POST /api/listening-exercises
// @desc    Create new listening exercise
// @access  Private (Faculty/Admin/Teacher)
router.post(
  "/",
  authorize("faculty", "admin", "teacher"),
  upload.single("audioFile"),
  createListeningExercise
);

// @route   PUT /api/listening-exercises/:id
// @desc    Update listening exercise
// @access  Private (Faculty/Admin/Teacher)
router.put(
  "/:id",
  authorize("faculty", "admin", "teacher"),
  upload.single("audioFile"),
  updateListeningExercise
);

// @route   DELETE /api/listening-exercises/:id
// @desc    Delete listening exercise
// @access  Private (Faculty/Admin/Teacher)
router.delete(
  "/:id",
  authorize("faculty", "admin", "teacher"),
  deleteListeningExercise
);

// @route   POST /api/listening-exercises/:id/submit
// @desc    Submit answers for listening exercise
// @access  Private (Students)
router.post("/:id/submit", async (req, res) => {
  try {
    const ListeningExercise = require("../models/ListeningExercise");
    const ListeningSubmission = require("../models/ListeningSubmission");
    const { answers } = req.body;

    // Get the exercise
    const exercise = await ListeningExercise.findById(req.params.id);
    if (!exercise) {
      return res.status(404).json({ message: "Exercise not found" });
    }

    // Calculate attempt number
    const previousSubmissions = await ListeningSubmission.find({
      exercise: req.params.id,
      student: req.user.id,
    }).sort({ attemptNumber: -1 });

    const attemptNumber =
      previousSubmissions.length > 0
        ? previousSubmissions[0].attemptNumber + 1
        : 1;

    // Grade the answers
    let correctCount = 0;
    const gradedAnswers = [];

    console.log("\n" + "=".repeat(60));
    console.log("🔍 STARTING GRADING PROCESS");
    console.log("=".repeat(60));
    console.log(`📋 Total questions: ${exercise.questions.length}`);
    console.log(`📝 Received answers:`, JSON.stringify(answers, null, 2));

    exercise.questions.forEach((question, index) => {
      const studentAnswer = answers[question._id.toString()];

      console.log(`\n--- Question ${index + 1} ---`);
      console.log(`Type: ${question.type}`);
      console.log(`Question Text: ${question.question}`);
      console.log(`Correct Answer: ${question.correctAnswer}`);
      console.log(`Options:`, question.options);
      console.log(`Student Answer: ${studentAnswer}`);

      if (studentAnswer !== undefined && studentAnswer !== null) {
        let isCorrect = false;

        // Auto-detect question type if there's a mismatch
        // If question has options array with isCorrect flags, treat as multiple choice
        let actualQuestionType = question.type;
        if (
          question.options &&
          question.options.length > 0 &&
          question.options.some((opt) => opt.hasOwnProperty("isCorrect"))
        ) {
          actualQuestionType = "multiple_choice";
          if (question.type !== "multiple_choice") {
            console.log(
              `⚠️ Type mismatch detected! Stored as "${question.type}" but has options array. Treating as "multiple_choice"`
            );
          }
        }

        // Different grading logic based on question type
        switch (actualQuestionType) {
          case "multiple_choice":
            // Find the correct option index for multiple choice
            const correctOptionIndex = question.options.findIndex(
              (option) => option.isCorrect === true
            );
            // Compare student's answer (index) with correct index
            const studentAnswerInt = parseInt(studentAnswer);
            isCorrect = studentAnswerInt === correctOptionIndex;
            console.log(`📝 Multiple Choice - Question: ${question._id}`);
            console.log(
              `   Student Answer (raw): ${studentAnswer} (type: ${typeof studentAnswer})`
            );
            console.log(
              `   Student Answer (parsed): ${studentAnswerInt} (type: ${typeof studentAnswerInt})`
            );
            console.log(`   Correct Option Index: ${correctOptionIndex}`);
            console.log(
              `   Options with isCorrect flags:`,
              question.options.map((opt, idx) => ({
                index: idx,
                text: opt.text,
                isCorrect: opt.isCorrect,
              }))
            );
            console.log(`   Match: ${isCorrect}`);
            break;

          case "true_false":
            // For true/false, compare with correctAnswer field
            // Student sends "true" or "false" as string
            if (
              !question.correctAnswer ||
              question.correctAnswer === "undefined"
            ) {
              console.error(
                `❌ TRUE/FALSE QUESTION ERROR: correctAnswer is missing or undefined!`
              );
              console.error(`   Question ID: ${question._id}`);
              console.error(`   Question Text: ${question.question}`);
              console.error(
                `   This question needs to be re-created or fixed by the teacher.`
              );
              isCorrect = false;
            } else {
              const correctAnswerStr = String(
                question.correctAnswer
              ).toLowerCase();
              const studentAnswerStr = String(studentAnswer).toLowerCase();
              isCorrect = studentAnswerStr === correctAnswerStr;
              console.log(
                `✓/✗ True/False - Question: ${question._id}, Student: ${studentAnswerStr}, Correct: ${correctAnswerStr}, Match: ${isCorrect}`
              );
            }
            break;

          case "fill_in_blank":
          case "short_answer":
            // For text answers, compare with correctAnswer (case-insensitive, trimmed)
            const correctText = String(question.correctAnswer)
              .toLowerCase()
              .trim();
            const studentText = String(studentAnswer).toLowerCase().trim();
            isCorrect = studentText === correctText;
            console.log(
              `📝 Text Answer - Question: ${question._id}, Student: "${studentText}", Correct: "${correctText}", Match: ${isCorrect}`
            );
            break;

          default:
            console.warn(`⚠️ Unknown question type: ${question.type}`);
            isCorrect = false;
        }

        if (isCorrect) {
          correctCount++;
        }

        gradedAnswers.push({
          questionId: question._id,
          answer: studentAnswer,
          isCorrect: isCorrect,
          pointsEarned: isCorrect ? question.points || 1 : 0,
        });
      }
    });

    const totalQuestions = exercise.questions.length;
    const percentage = Math.round((correctCount / totalQuestions) * 100);

    console.log("\n" + "=".repeat(60));
    console.log("📊 GRADING SUMMARY");
    console.log("=".repeat(60));
    console.log(`✅ Correct Answers: ${correctCount}`);
    console.log(`📝 Total Questions: ${totalQuestions}`);
    console.log(`📈 Percentage: ${percentage}%`);
    console.log(`🎯 Score: ${correctCount}/${totalQuestions}`);
    console.log("=".repeat(60) + "\n");

    // Create submission record
    const submission = await ListeningSubmission.create({
      exercise: req.params.id,
      student: req.user.id,
      answers: gradedAnswers,
      score: correctCount,
      percentage: percentage,
      submittedAt: new Date(),
      isCompleted: true,
      attemptNumber: attemptNumber,
    });

    // Populate the submission data
    await submission.populate("exercise", "title");
    await submission.populate("student", "firstName lastName email");

    res.status(201).json({
      success: true,
      message: "Submission recorded successfully",
      submission: submission,
      score: correctCount,
      totalQuestions: totalQuestions,
      percentage: percentage,
      attemptNumber: attemptNumber,
    });
  } catch (error) {
    console.error("Error submitting listening exercise:", error);
    res.status(500).json({
      message: "Error submitting exercise",
      error: error.message,
    });
  }
});

// @route   GET /api/listening-exercises/:id/submissions
// @desc    Get all submissions for an exercise (Teachers)
// @access  Private (Faculty/Admin/Teacher)
router.get(
  "/:id/submissions",
  authorize("faculty", "admin", "teacher"),
  async (req, res) => {
    try {
      const ListeningSubmission = require("../models/ListeningSubmission");

      const submissions = await ListeningSubmission.find({
        exercise: req.params.id,
      })
        .populate("student", "firstName lastName email")
        .populate("exercise", "title")
        .sort({ submittedAt: -1 });

      res.json({
        success: true,
        count: submissions.length,
        submissions: submissions,
      });
    } catch (error) {
      console.error("Error fetching submissions:", error);
      res.status(500).json({
        message: "Error fetching submissions",
        error: error.message,
      });
    }
  }
);

// @route   GET /api/listening-exercises/:id/my-submissions
// @desc    Get student's own submissions for an exercise
// @access  Private (Student)
router.get("/:id/my-submissions", async (req, res) => {
  try {
    const ListeningSubmission = require("../models/ListeningSubmission");

    const submissions = await ListeningSubmission.find({
      exercise: req.params.id,
      student: req.user.id,
    })
      .populate("exercise", "title")
      .sort({ attemptNumber: -1 });

    res.json({
      success: true,
      count: submissions.length,
      submissions: submissions,
    });
  } catch (error) {
    console.error("Error fetching submissions:", error);
    res.status(500).json({
      message: "Error fetching submissions",
      error: error.message,
    });
  }
});

module.exports = router;
