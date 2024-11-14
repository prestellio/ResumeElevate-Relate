const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  email: { type: String, required: true },
  // Add resume fields here
  phone: { type: String },
  profession: { type: String },
  jobDesc: { type: String },
  school: { type: String },
  gpa: { type: String },
  skills: { type: String },
  awards: { type: String },
  education: { type: String },
  projects: { type: String },
  address: { type: String },
  links: { type: String },
  references: { type: String },
  objective: { type: String }
});

const User = mongoose.model('User', userSchema);

module.exports = User;
