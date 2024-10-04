// models/Resume.js
const mongoose = require('mongoose');

const resumeSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },  // Reference to the User
  phone: String,
  profession: String,
  firstJob: String,
  school: String,
  gpa: String
});

const Resume = mongoose.model('Resume', resumeSchema);

module.exports = Resume;
