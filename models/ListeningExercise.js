const mongoose = require('mongoose');

const listeningExerciseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  audioFile: {
    filename: String,        // generated filename
    originalName: String,    // original uploaded filename
    gridfsId: mongoose.Schema.Types.ObjectId, // GridFS file ID for large files
    size: Number,           // file size in bytes
    mimetype: String,       // audio/mpeg, audio/wav, etc.
    uploadDate: {
      type: Date,
      default: Date.now
    },
    duration: Number        // in seconds (optional metadata)
  },
  transcript: {
    type: String // full transcript for reference
  },
  questions: [{
    type: {
      type: String,
      enum: ['multiple_choice', 'fill_in_blank', 'short_answer', 'true_false'],
      required: true
    },
    question: {
      type: String,
      required: true
    },
    timeStamp: {
      type: Number // timestamp in seconds when this question relates to
    },
    options: [{
      text: String,
      isCorrect: Boolean
    }], // for multiple choice
    correctAnswer: String, // for other types
    points: {
      type: Number,
      default: 1
    },
    explanation: String
  }],
  level: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    required: true
  },
  totalPoints: {
    type: Number,
    default: 0
  },
  timeLimit: {
    type: Number, // in minutes
    default: 30
  },
  playLimit: {
    type: Number, // how many times audio can be played
    default: 3
  },
  dueDate: {
    type: Date
  },
  isPublished: {
    type: Boolean,
    default: false
  },
  instructions: {
    type: String
  },
  tags: [{
    type: String,
    trim: true
  }]
}, {
  timestamps: true
});

// Calculate total points when exercise is saved
listeningExerciseSchema.pre('save', function(next) {
  this.totalPoints = this.questions.reduce((sum, question) => sum + question.points, 0);
  next();
});

module.exports = mongoose.model('ListeningExercise', listeningExerciseSchema);
