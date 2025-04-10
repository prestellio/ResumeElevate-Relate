// Original app.js with added debugging

require('dotenv').config();


const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
const Resume = require('./models/Resume');

const app = express();
const port = 3000;

const templateRoutes = require('./routes/templateRoutes');
const Answer = require('./models/Answer');

// Middleware
// Parse JSON and URL-encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configure CORS
app.use(cors({
    origin: ['http://127.0.0.1:3000', 'http://localhost:3000'],
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type']
}));

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Debug middleware - log all requests
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// Use the template routes - make sure this is after all middleware
app.use('/api', templateRoutes);

// Add a test route to verify the server is working
app.get('/api/test', (req, res) => {
    res.json({ message: 'API is working!' });
});

// Get all questionnaire answers
app.get('/api/get-answers', async (req, res) => {
    try {
        const answers = await Answer.find().sort({ createdAt: -1 });
        res.json({ success: true, answers });
    } catch (error) {
        console.error('Error fetching answers:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch answers' });
    }
});

// Get a specific questionnaire answer by ID
app.get('/api/get-answer/:id', async (req, res) => {
    try {
        const answer = await Answer.findById(req.params.id);
        if (!answer) {
            return res.status(404).json({ success: false, error: 'Answer not found' });
        }
        res.json({ success: true, answer });
    } catch (error) {
        console.error('Error fetching answer:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch answer' });
    }
});

// Get a questionnaire answer by matching resume data
app.get('/api/get-answer-by-resume/:resumeId', async (req, res) => {
    try {
        const resumeId = req.params.resumeId;
        
        // First get the resume
        const resume = await Resume.findById(resumeId);
        if (!resume) {
            return res.status(404).json({ success: false, error: 'Resume not found' });
        }
        
        // Try to find matching answer by name and email
        const answer = await Answer.findOne({
            'personalInfo.name': resume.name,
            'personalInfo.email': resume.email
        });
        
        if (!answer) {
            return res.status(404).json({ success: false, error: 'Matching answer not found' });
        }
        
        res.json({ success: true, answer });
    } catch (error) {
        console.error('Error fetching answer by resume:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch matching answer' });
    }
});

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('Failed to connect to MongoDB:', err));

// Route to handle resume submission
app.post('/submit-resume', async (req, res) => {
    try {
        const {
            name, email, phone, university, universityLocation, degree, gpa, relevantCourse,
            graduationDate, programmingLanguages, operatingSystems,
            companyName = [], position = [], location = [], responsibilities = [],
            startDate = [], endDate = [], projectName = [], projectDescription = [],
            projectStartDate = [], leadershipPosition = [], groupName = [],
            leadershipLocation = [], leadershipStartDate = [], leadershipEndDate = []
        } = req.body;

        // Ensure education is always included
        const education = {
            university: university || "Not Provided",
            location: universityLocation || "Not Provided",
            degree: degree || "Not Provided",
            gpa: gpa || "N/A",
            relevantCourses: relevantCourse || "Not Provided",
            graduationDate: graduationDate || "N/A"
        };

        // Save the resume to the database
        const newResume = new Resume({
            name, email, phone,
            education, // ✅ Ensuring education is included
            technicalSkills: { programmingLanguages, operatingSystems },
            experiences: companyName.map((_, i) => ({
                companyName: companyName[i],
                position: position[i],
                location: location[i],
                responsibilities: responsibilities[i],
                startDate: startDate[i],
                endDate: endDate[i]
            })),
            projects: projectName.map((_, i) => ({
                projectName: projectName[i],
                projectDescription: projectDescription[i],
                projectStartDate: projectStartDate[i]
            })),
            leadership: leadershipPosition.map((_, i) => ({
                leadershipPosition: leadershipPosition[i],
                groupName: groupName[i],
                location: leadershipLocation[i],
                leadershipStartDate: leadershipStartDate[i],
                leadershipEndDate: leadershipEndDate[i]
            }))
        });

        const savedResume = await newResume.save();
        res.json({ resumeId: savedResume._id });

    } catch (error) {
        console.error('Error submitting resume:', error);
        res.status(500).json({ error: 'Failed to save resume data' });
    }
});

// This route should be added to your app.js file, make sure it's before any catch-all handlers
app.post('/save-answers', async (req, res) => {
    try {
        console.log("Received questionnaire data:", req.body); // Log received data

        if (!req.body.answers) {
            return res.status(400).json({ error: "No answers received" });
        }

        const newAnswers = new Answer(req.body.answers);
        await newAnswers.save();

        console.log("Questionnaire answers saved successfully!"); // Log successful save
        res.status(201).json({ message: "Answers saved successfully!" });

    } catch (error) {
        console.error("Error saving questionnaire answers:", error);
        res.status(500).json({ error: "Failed to save answers" });
    }
});


// Route to fetch a resume by ID
app.get('/get-resume/:id', async (req, res) => {
    try {
        const resume = await Resume.findById(req.params.id);
        if (!resume) {
            return res.status(404).json({ error: 'Resume not found' });
        }
        res.json(resume);
    } catch (error) {
        console.error('Error fetching resume:', error);
        res.status(500).json({ error: 'Failed to fetch resume' });
    }
});

// Route to save updated resume data
app.post('/save-resume', async (req, res) => {
    try {
        const { name, email, phone, resumeContent, summary, careerField } = req.body;
        const resumeId = req.body.resumeId;

        if (!resumeId) {
            return res.status(400).json({ error: 'Resume ID is required' });
        }

        // Build update object with fields that are provided
        const updateData = {};
        if (name) updateData.name = name;
        if (email) updateData.email = email;
        if (phone) updateData.phone = phone;
        if (resumeContent) updateData.resumeContent = resumeContent;
        if (summary) updateData.summary = summary;
        if (careerField) updateData.careerField = careerField;

        // Find and update the resume in MongoDB
        const updatedResume = await Resume.findByIdAndUpdate(resumeId, 
            updateData, 
            { new: true }
        );

        if (!updatedResume) {
            return res.status(404).json({ error: 'Resume not found' });
        }

        res.json({ message: 'Resume updated successfully', resume: updatedResume });
    } catch (error) {
        console.error('Error saving resume:', error);
        res.status(500).json({ error: 'Failed to save resume' });
    }
});

// Add a catch-all route handler for debugging purposes
app.use((req, res) => {
    console.log(`404 - Route not found: ${req.method} ${req.url}`);
    res.status(404).json({ error: 'Route not found' });
});

app.listen(port, () => console.log(`Server running at http://localhost:${port}/`));