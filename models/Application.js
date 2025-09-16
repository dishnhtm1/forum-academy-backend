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
    // Personal Information (Step 1)
    fullName: {
        type: String,
        required: true,
        trim: true
    },
    firstName: {
        type: String,
        trim: true
    },
    lastName: {
        type: String,
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
    dateOfBirth: {
        type: String
    },
    address: {
        type: String,
        trim: true
    },
    nationality: {
        type: String,
        trim: true
    },
    
    // Education Information (Step 2)
    highestEducation: {
        type: String,
        required: true
    },
    schoolName: {
        type: String,
        trim: true
    },
    graduationYear: {
        type: String
    },
    fieldOfStudy: {
        type: String,
        trim: true
    },
    currentEmployment: {
        type: String,
        trim: true
    },
    techExperience: {
        type: String,
        trim: true
    },
    
    // Course Selection (Step 3)
    course: {
        type: String,
        required: true
    },
    program: {
        type: String,
        required: true
    },
    startDate: {
        type: String,
        required: true
    },
    format: {
        type: String // online, in-person, hybrid
    },
    
    // Additional Information (Step 4)
    goals: {
        type: String
    },
    whyThisProgram: {
        type: String
    },
    challenges: {
        type: String
    },
    extraInfo: {
        type: String
    },
    howDidYouHear: {
        type: String,
        required: true
    },
    agreeToTerms: {
        type: Boolean,
        required: true,
        default: false
    },
    
    // Application Status
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'under_review'],
        default: 'pending'
    },
    adminNotes: {
        type: String
    },
    reviewedBy: {
        type: String
    },
    reviewedAt: {
        type: Date
    },
    repliedAt: {
        type: Date
    },
    replySubject: {
        type: String
    },
    replyMessage: {
        type: String
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