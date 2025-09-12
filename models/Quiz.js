const mongoose = require('mongoose');

const quizQuestionSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ['multiple_choice', 'short_answer', 'essay', 'true_false']
  },
  question: {
    type: String,
    required: true
  },
  options: [{
    text: String,
    isCorrect: Boolean
  }], // for multiple choice questions
  correctAnswer: {
    type: String // for short answer/essay questions
  },
  points: {
    type: Number,
    default: 1
  },
  explanation: {
    type: String // explanation for correct answer
  }
});

const quizSchema = new mongoose.Schema({
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
  questions: [quizQuestionSchema],
  timeLimit: {
    type: Number, // in minutes
    default: 60
  },
  totalPoints: {
    type: Number,
    default: 0
  },
  attempts: {
    type: Number,
    default: 1
  },
  shuffleQuestions: {
    type: Boolean,
    default: false
  },
  shuffleOptions: {
    type: Boolean,
    default: false
  },
  showResults: {
    type: String,
    enum: ['immediately', 'after_due_date', 'never'],
    default: 'immediately'
  },
  dueDate: {
    type: Date
  },
  availableFrom: {
    type: Date,
    default: Date.now
  },
  availableTo: {
    type: Date
  },
  isPublished: {
    type: Boolean,
    default: false
  },
  passingScore: {
    type: Number,
    default: 70 // percentage
  }
}, {
  timestamps: true
});

// Calculate total points when quiz is saved
quizSchema.pre('save', function(next) {
  this.totalPoints = this.questions.reduce((sum, question) => sum + question.points, 0);
  next();
});

module.exports = mongoose.model('Quiz', quizSchema);
