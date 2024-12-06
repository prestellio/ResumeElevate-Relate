const mongoose = require('mongoose');

const resumeSchema = new mongoose.Schema({
  name: String,
  email: String,
  phone: String,
  education: {
      university: String,
      location: String,
      degree: String,
      gpa: String,
      relevantCourses: String,
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
});

// Prevent OverwriteModelError
const Resume = mongoose.models.Resume || mongoose.model('Resume', resumeSchema);

module.exports = Resume;
