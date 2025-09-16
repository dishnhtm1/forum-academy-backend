// const mongoose = require('mongoose');

// const contactSchema = new mongoose.Schema({
//   name: { type: String, required: true },
//   email: { type: String, required: true },
//   phone: { type: String },
//   subject: { type: String, required: true },
//   message: { type: String, required: true },
//   // ADD THIS NEW FIELD:
//   status: { 
//     type: String, 
//     enum: ['pending', 'resolved', 'approved', 'ignored'], 
//     default: 'pending' 
//   }
// }, { timestamps: true });

// module.exports = mongoose.model('Contact', contactSchema);

const mongoose = require('mongoose');

const ContactSchema = new mongoose.Schema({
    name: {
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
        required: false,
        trim: true
    },
    subject: {
        type: String,
        required: true,
        trim: true
    },
    message: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'resolved', 'approved', 'ignored'],
        default: 'pending'
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

module.exports = mongoose.model('Contact', ContactSchema);