const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  // Step 1: Personal Information
  firstName: String,
  lastName: String,
  email: String,
  phone: String,
  dateOfBirth: String,
  address: String,

  // Step 2: Education Info
  highestEducation: String,
  schoolName: String,
  graduationYear: String,
  fieldOfStudy: String,
  currentEmployment: String,
  techExperience: String,

  // Step 3: Course Selection
  program: String,
  startDate: String,
  format: String,
  heardAboutUs: String,

  // Step 4: Additional Info
  goals: String,
  whyThisProgram: String,
  challenges: String,
  extraInfo: String,
  agreeToTerms: Boolean,
}, { timestamps: true });

module.exports = mongoose.model('Application', applicationSchema);
