const mongoose = require('mongoose');

const resumeSchema = new mongoose.Schema({
  name: String,
  phone: String,
  goal: String,
  location: String,
  profession: String,
  education: {
    school: String,
    gpa: String,
  },
});

module.exports = mongoose.model('Resume', resumeSchema);

