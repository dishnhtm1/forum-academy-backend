const mongoose = require("mongoose");

const homeworkSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    dueDate: {
      type: Date,
      required: true,
    },
    assignedDate: {
      type: Date,
      default: Date.now,
    },
    maxPoints: {
      type: Number,
      default: 100,
    },
    instructions: {
      type: String,
    },
    attachments: [
      {
        fileName: String,
        filePath: String,
        fileSize: Number,
        mimeType: String,
      },
    ],
    submissionType: {
      type: String,
      enum: ["file_upload", "text_entry", "both"],
      default: "file_upload",
    },
    allowedFileTypes: [
      {
        type: String, // e.g., ['pdf', 'doc', 'docx', 'txt']
      },
    ],
    maxFileSize: {
      type: Number, // in MB
      default: 10,
    },
    isPublished: {
      type: Boolean,
      default: true,
    },
    lateSubmissionAllowed: {
      type: Boolean,
      default: true,
    },
    latePenalty: {
      type: Number, // percentage per day
      default: 10,
    },
    category: {
      type: String,
      enum: ["assignment", "project", "essay", "presentation", "other"],
      default: "assignment",
    },
    status: {
      type: String,
      enum: ["draft", "active", "archived"],
      default: "draft",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Homework", homeworkSchema);
