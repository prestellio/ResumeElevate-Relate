// models/Answer.js
const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema({
  careerField: String,
  personalInfo: {
    name: String,
    email: String,
    phone: String,
    location: String
  },
  education: [{
    university: String,
    degree: String,
    graduationDate: String,
    gpa: String,
    relevantCourses: String
  }],
  experience: [{
    companyName: String,
    jobTitle: String,
    location: String,
    dates: String,
    responsibilities: String
  }],
  projects: [{
    projectName: String,
    dates: String,
    description: String
  }],
  skills: {
    technical: String,
    soft: String,
    languages: String,
    certifications: String
  },
  fieldSpecific: {
    engineering: {
      discipline: String,
      software: String,
      projects: String
    },
    business: {
      specialty: String,
      software: String,
      certifications: String,
      achievements: String
    },
    technology: {
      specialty: String,
      programmingLanguages: String,
      frameworks: String,
      projects: String
    },
    healthcare: {
      specialty: String,
      certifications: String,
      skills: String,
      experience: String
    },
    education: {
      level: String,
      subjects: String,
      certifications: String,
      methods: String
    },
    arts: {
      specialty: String,
      software: String,
      portfolioLink: String,
      projects: String
    },
    science: {
      field: String,
      methods: String,
      publications: String,
      projects: String
    }
  },
  summary: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Answer = mongoose.model('Answer', answerSchema);

module.exports = Answer;