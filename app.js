const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const bcrypt = require('bcrypt');
const User = require('./models/User');
const Resume = require('./models/Resume'); // Import the Resume model
const axios = require('axios');

const app = express();
const port = 3000;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
// Middleware to serve static files from 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Middleware to parse JSON data from requests
app.use(express.json());

// Mongoose connection (replace with your MongoDB connection string)
// mongoose.connect('mongodb+srv://rojerojer24:HkKpUYxLCi7syrsL@relate.qorzo.mongodb.net/', {
//   useNewUrlParser: true,
//   useUnifiedTopology: true
// }).then(() => {
//   console.log('Connected to MongoDB');
// }).catch(err => {
//   console.error('MongoDB connection error:', err);
// });

app.post('/generate-objective', async (req, res) => {
  const { phone, profession, jobDesc, school, gpa } = req.body;

  try {
    // Use the inputs to generate an objective statement
    const response = await axios.post(
      'https://api.openai.com/v1/completions',
      {
        model: 'text-davinci-003',
        prompt: `Create an objective statement based on the following user input:\n
                 Profession: ${profession}\n
                 Job Description: ${jobDesc}\n
                 School Attended: ${school}\n
                 GPA: ${gpa}\n`,
        max_tokens: 60,
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    res.json({ objective: response.data.choices[0].text.trim() });
  } catch (error) {
    console.error('Error generating objective statement:', error);
    res.status(500).json({ error: 'Failed to generate objective statement' });
  }
});


// Route to serve the index.html file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Route to handle user registration
app.post('/register', async (req, res) => {
  try {
    const { username, password, email } = req.body;

    // Check if the username already exists
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(400).send('Email already exists');
    }

    // Hash the password before saving
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ username, password: hashedPassword, email });

    // Save the user to the database
    await newUser.save();

    res.send('User registered successfully');
  } catch (err) {
    console.error('Error registering user:', err);
    res.status(500).send('Error registering user');
  }
});

// Route to handle resume data submission (without authentication)
app.post('/submit-resume', async (req, res) => {
  try {
    const { phone, profession, firstJob, school, gpa } = req.body;

    // Create a new Resume document with the form data
    const newResume = new Resume({
      phone,
      profession,
      firstJob,
      school,
      gpa
    });

    // Save the resume data to the database
    await newResume.save();

    res.status(200).send('Resume data saved successfully');
  } catch (err) {
    console.error('Error saving resume data:', err);
    res.status(500).send('Error saving resume data');
  }
});

// Route to get the resume data
app.get('/get-resume', async (req, res) => {
  try {
      const resume = await Resume.findOne(); // Use proper user logic in production
      res.json(resume || {});
  } catch (err) {
      console.error('Error fetching resume:', err);
      res.status(500).send('Error fetching resume');
  }
});

// Route to update the resume data
app.post('/update-resume', async (req, res) => {
  try {
      const { content } = req.body;

      // Update resume content in MongoDB (modify for user-specific logic)
      await Resume.findOneAndUpdate({}, { content });

      res.status(200).send('Resume updated successfully');
  } catch (err) {
      console.error('Error updating resume:', err);
      res.status(500).send('Error updating resume');
  }
});



// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/index.html`);
});
