// const mongoose = require('mongoose');

// const applicationSchema = new mongoose.Schema({
//   // Step 1: Personal Information
//   firstName: String,
//   lastName: String,
//   email: String,
//   phone: String,
//   dateOfBirth: String,
//   address: String,

//   // Step 2: Education Info
//   highestEducation: String,
//   schoolName: String,
//   graduationYear: String,
//   fieldOfStudy: String,
//   currentEmployment: String,
//   techExperience: String,

//   // Step 3: Course Selection
//   program: String,
//   startDate: String,
//   format: String,
//   heardAboutUs: String,

//   // Step 4: Additional Info
//   goals: String,
//   whyThisProgram: String,
//   challenges: String,
//   extraInfo: String,
//   agreeToTerms: Boolean,

//   status: {
//     type: String,
//     enum: ['pending', 'approved', 'rejected', 'under_review'],
//     default: 'pending'
//   }
// }, { timestamps: true });

// module.exports = mongoose.model('Application', applicationSchema);


const mongoose = require('mongoose');

const ApplicationSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true,
        trim: true
    },
    lastName: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true
    },
    phone: {
        type: String,
        required: true,
        trim: true
    },
    program: {
        type: String,
        required: true
    },
    startDate: {
        type: String,
        required: true
    },
    highestEducation: {
        type: String,
        required: true
    },
    schoolName: {
        type: String,
        required: true
    },
    goals: {
        type: String,
        required: false
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'under_review'],
        default: 'pending'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Application', ApplicationSchema);