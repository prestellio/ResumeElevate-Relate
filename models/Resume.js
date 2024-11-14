const mongoose = require('mongoose');

const ResumeSchema = new mongoose.Schema({
    phone: String,
    profession: String,
    jobDesc: String,
    school: String,
    gpa: String,
    skills: String,
    awards: String,
    education: String,
    projects: String,
    address: String,
    links: String,
    references: String,
    objective: String,
    content: String // Store the HTML content of the resume
});

module.exports = mongoose.model('Resume', ResumeSchema);
