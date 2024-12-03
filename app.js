const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Resume = require('./models/Resume'); // Import the Resume model
const app = express();
const port = 3000;
app.use(express.json());
const OPENAI_API_KEY = process.env.OPENAI_API_KEY; // Reference the key securely

// Middleware to serve static files from 'public' directory
app.use(express.static(path.join(__dirname, 'public')));
// Middleware to parse JSON data from requests

const DB_URI = 'mongodb+srv://rojerojer24:Limosine1@cluster.mongodb.net/';

mongoose.connect(DB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {
        console.log('Connected to MongoDB');
        process.exit(0);
    })
    .catch(err => {
        console.error('Failed to connect to MongoDB', err);
        process.exit(1);
    });



// Route to handle generating objective statement using OpenAI
app.post('/generate-objective', async (req, res) => {
  const { phone, profession, jobDesc, school, gpa } = req.body;


  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'You are a helpful resume assistant.' },
          { role: 'user', content: `Create an objective statement based on the following user input:\nProfession: ${profession}\nJob Description: ${jobDesc}\nSchool Attended: ${school}\nGPA: ${gpa}\n` }
        ],
        max_tokens: 100, // Optional: Adjust if the response is too short
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );


    res.json({ objective: response.data.choices[0].message.content.trim() });
  } catch (error) {
    console.error('Error generating objective statement:', error.response ? error.response.data : error.message);
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
    const { name, phone, goal, state, city, Professions, school, gpa } = req.body;

    const newResume = new Resume({
      name,
      phone,
      goal,
      location: `${city}, ${state}`,
      profession: Professions,
      education: { school, gpa },
    });

    await newResume.save();

    res.status(200).json({ message: 'Resume submitted', redirect: '/template-engineering' });
  } catch (error) {
    console.error('Error submitting resume:', error);
    res.status(500).json({ error: 'Failed to save resume data' });
  }
});

// Route to fetch and display resume in `template_engineering.html`
app.get('/template-engineering', async (req, res) => {
  try {
    const resume = await Resume.findOne(); // Modify logic for user-specific data
    if (!resume) {
      return res.status(404).send('No resume data found');
    }
    res.sendFile(path.join(__dirname, 'public', 'template_engineering.html')); // Serve the file
  } catch (error) {
    console.error('Error fetching resume:', error);
    res.status(500).send('Error fetching resume');
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
// app.post('/update-resume', async (req, res) => {
//   try {
//     const { content } = req.body;

//     // Update resume content in MongoDB (modify for user-specific logic)
//     await Resume.findOneAndUpdate({}, { content });

//     res.status(200).send('Resume updated successfully');
//   } catch (err) {
//     console.error('Error updating resume:', err);
//     res.status(500).send('Error updating resume');
//   }
// });

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/index.html`);
});