const mongoose = require('mongoose');
const Schema = mongoose.Schema; // Added Schema import

const resumeSchema = new mongoose.Schema({
  name: String,
  email: String,
  phone: String,
  careerField: String,
  summary: String,
  resumeContent: String,
  education: {
      university: String,
      location: String,
      degree: String,
      gpa: String,
      relevantCourses: Schema.Types.Mixed, // Changed from String to Mixed to handle arrays
      graduationDate: String,
  },
  technicalSkills: {
      programmingLanguages: String,
      operatingSystems: String,
  },
  experiences: [{
      companyName: String,
      position: String,
      location: String,
      responsibilities: String,
      startDate: String,
      endDate: String,
  }],
  projects: [{
      projectName: String,
      projectDescription: String,
      projectStartDate: String,
  }],
  leadership: [{
      leadershipPosition: String,
      groupName: String,
      location: String,
      leadershipStartDate: String,
      leadershipEndDate: String,
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Prevent OverwriteModelError
const Resume = mongoose.models.Resume || mongoose.model('Resume', resumeSchema);

module.exports = Resume;