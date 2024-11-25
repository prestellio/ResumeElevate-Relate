const mongoose = require('mongoose');

const ResumeSchema = new mongoose.Schema({
    phone: String,
    profession: String,
    firstJob: String,
    school: String,
    gpa: String,
    content: String // Store the HTML content of the resume
});

module.exports = mongoose.model('Resume', ResumeSchema);
