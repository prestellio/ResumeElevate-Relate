const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Connect to MongoDB (use your own connection string)
mongoose.connect('mongodb://localhost:27017/resumeBuilder', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log(err));

// Create a schema for resume data
const resumeSchema = new mongoose.Schema({
  fullName: String,
  email: String,
  phone: String,
  address: String,
  objective: String,
  skills: String,
  education: String,
  experience: String
});

const Resume = mongoose.model('Resume', resumeSchema);

// Route to handle resume form submission
app.post('/submit', async (req, res) => {
  const { fullName, email, phone, address, objective, skills, education, experience } = req.body;

  try {
    const newResume = new Resume({
      fullName,
      email,
      phone,
      address,
      objective,
      skills,
      education,
      experience
    });
    await newResume.save();
    res.json({ message: 'Resume saved successfully!' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save resume' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
