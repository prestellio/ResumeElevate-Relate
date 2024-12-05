const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const fs = require ('fs');
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

const DB_URI = 'mongodb+srv://rojerojer24:Limosine1@relate.qorzo.mongodb.net/Relate?retryWrites=true&w=majority';


mongoose.connect(DB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {
        console.log('Connected to MongoDB');
    })
    .catch(err => {
        console.error('Failed to connect to MongoDB', err);
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
// Route to handle resume data submission
app.post('/submit-resume', async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      university,
      universityLocation,
      degree,
      gpa,
      relevantCourse,
      graduationDate,
      programmingLanguages,
      operatingSystems,
      relevantExperiences,
      projects,
      leadershipExperiences,
    } = req.body;

    const newResume = new Resume({
      name,
      email,
      phone,
      education: {
        university,
        location: universityLocation,
        degree,
        gpa,
        relevantCourses: relevantCourse.split(',').map(course => course.trim()), // Convert to array
        graduationDate,
      },
      technicalSkills: {
        programmingLanguages: programmingLanguages.split(',').map(lang => lang.trim()), // Convert to array
        operatingSystems: operatingSystems.split(',').map(os => os.trim()), // Convert to array
      },
      relevantExperiences: relevantExperiences.map(exp => ({
        companyName: exp.companyName,
        position: exp.position,
        location: exp.location,
        responsibilities: exp.responsibilities.split('\n').map(task => task.trim()), // Convert to array
        startDate: exp.startDate,
        endDate: exp.endDate,
      })),
      projects: projects.map(proj => ({
        projectName: proj.projectName,
        projectDescription: proj.projectDescription.split('\n').map(desc => desc.trim()), // Convert to array
        startDate: proj.startDate,
      })),
      leadershipExperiences: leadershipExperiences.map(lead => ({
        positionName: lead.positionName,
        groupName: lead.groupName,
        location: lead.location,
        startDate: lead.startDate,
        endDate: lead.endDate,
      })),
    });

    await newResume.save();

    // Redirect with a success response and the saved resume ID
    res.status(200).json({ redirect: `/template-engineering?id=${newResume._id}` });
  } catch (error) {
    console.error('Error submitting resume:', error);
    res.status(500).json({ error: 'Failed to save resume data' });
  }
});


// Route to fetch and display resume in `template_engineering.html`
app.get('/template-engineering', async (req, res) => {
  try {
      const { id } = req.query; // Get resume ID from query params
      const resume = await Resume.findById(id);

      if (!resume) {
          return res.status(404).send('Resume not found');
      }

      // Read the HTML template file
      const templatePath = path.join(__dirname, 'public', 'template_engineering.html');
      let html = fs.readFileSync(templatePath, 'utf8');

      // Replace placeholders with dynamic data
      html = html
          .replace('{{name}}', resume.name)
          .replace('{{contact}}', `${resume.email} • ${resume.phone}`)
          .replace('{{education}}', `
              <div class="list-item">
                  <div class="flex-header">
                      <div>${resume.education.university} | ${resume.education.location}</div>
                      <div>${resume.education.graduationDate}</div>
                  </div>
                  <div>${resume.education.degree} | GPA: ${resume.education.gpa}</div>
                  <ul class="bulleted">
                      <li>Relevant Courses: ${resume.education.relevantCourses.join(', ')}</li>
                  </ul>
              </div>
          `)
          .replace('{{technicalSkills}}', `
              <ul class="list">
                  <li class="list-item">Programming Languages: ${resume.technicalSkills.programmingLanguages.join(', ')}</li>
                  <li class="list-item">Operating Systems: ${resume.technicalSkills.operatingSystems.join(', ')}</li>
              </ul>
          `)
          .replace('{{relevantExperience}}', resume.relevantExperiences.map(exp => `
              <div class="experience-item">
                  <div class="flex-header">
                      <div>${exp.position} | ${exp.companyName} | ${exp.location}</div>
                      <div>${exp.startDate} - ${exp.endDate || 'Present'}</div>
                  </div>
                  <ul class="bulleted">
                      ${exp.responsibilities.map(task => `<li>${task}</li>`).join('')}
                  </ul>
              </div>
          `).join(''))
          .replace('{{projects}}', resume.projects.map(proj => `
              <div class="project-item">
                  <div class="flex-header">
                      <div>${proj.projectName}</div>
                      <div>${proj.startDate}</div>
                  </div>
                  <ul class="bulleted">
                      ${proj.projectDescription.map(desc => `<li>${desc}</li>`).join('')}
                  </ul>
              </div>
          `).join(''))
          .replace('{{leadership}}', resume.leadershipExperiences.map(lead => `
              <div class="leadership-item">
                  <div class="flex-header">
                      <div>${lead.positionName} | ${lead.groupName} | ${lead.location}</div>
                      <div>${lead.startDate} - ${lead.endDate || 'Present'}</div>
                  </div>
                  <ul class="bulleted">
                      <li>${lead.description}</li>
                  </ul>
              </div>
          `).join(''));

      // Send the populated HTML to the client
      res.send(html);
  } catch (error) {
      console.error('Error rendering resume template:', error);
      res.status(500).send('Error rendering resume template');
  }
});


// Route to get the resume data
app.get('/get-resume', async (req, res) => {
  try {
    const { id } = req.query;
    const resume = await Resume.findById(id);

    if (!resume) {
      return res.status(404).send('Resume not found');
    }

    res.json(resume);
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