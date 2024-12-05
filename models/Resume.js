const mongoose = require('mongoose');

const resumeSchema = new mongoose.Schema({
  // Personal Information
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },

  // Education
  education: {
    university: { type: String, required: true },
    location: { type: String, required: true }, // City, State
    degree: { type: String, required: true }, // Degree Type and Major
    gpa: { type: String, required: true },
    relevantCourses: { type: [String], default: [] }, // Array of courses
    graduationDate: { type: String, required: true }, // Month-Year
  },

  // Technical Skills
  technicalSkills: {
    programmingLanguages: { type: [String], default: [] },
    operatingSystems: { type: [String], default: [] },
  },

  // Relevant Experiences
  relevantExperiences: [
    {
      companyName: { type: String, required: true },
      position: { type: String, required: true },
      location: { type: String, required: true }, // City, State
      responsibilities: { type: [String], default: [] }, // Array of strings
      startDate: { type: String, required: true }, // Month-Year
      endDate: { type: String, default: null }, // Month-Year or null for current
    },
  ],

  // Projects
  projects: [
    {
      projectName: { type: String, required: true },
      projectDescription: { type: [String], default: [] }, // Array of strings
      startDate: { type: String, required: true }, // Month-Year
    },
  ],

  // Leadership Experience
  leadershipExperiences: [
    {
      positionName: { type: String, required: true },
      groupName: { type: String, required: true },
      location: { type: String, required: true }, // City, State
      startDate: { type: String, required: true }, // Month-Year
      endDate: { type: String, default: null }, // Month-Year or null for current
    },
  ],
});

module.exports = mongoose.model('Resume', resumeSchema);
