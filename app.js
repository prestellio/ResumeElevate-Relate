const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
const Resume = require('./models/Resume');

const app = express();
const port = 3000;

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Parse JSON and URL-encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configure CORS
app.use(cors({
    origin: ['http://127.0.0.1:3000', 'http://localhost:3000'],
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type']
}));

// Connect to MongoDB
mongoose.connect('mongodb+srv://rojerojer24:Limosine1@relate.qorzo.mongodb.net', { useNewUrlParser: true, useUnifiedTopology: true })
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

app.post('/save-answers', async (req, res) => {
    try {
        console.log("Received request:", req.body); // ✅ Log request data

        if (!req.body.answers || req.body.answers.length === 0) {
            return res.status(400).json({ error: "No answers received" });
        }

        const newAnswers = new Answer({ answers: req.body.answers });
        await newAnswers.save();

        console.log("Answers saved successfully!"); // ✅ Log successful save
        res.status(201).json({ message: "Answers saved successfully!" });

    } catch (error) {
        console.error("Error saving answers:", error);
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
        const { name, email, phone, resumeContent } = req.body;
        const resumeId = req.body.resumeId;

        if (!resumeId) {
            return res.status(400).json({ error: 'Resume ID is required' });
        }

        // Find and update the resume in MongoDB
        const updatedResume = await Resume.findByIdAndUpdate(resumeId, {
            name, email, phone,
            resumeContent // Stores the Quill editor content in MongoDB
        }, { new: true });

        if (!updatedResume) {
            return res.status(404).json({ error: 'Resume not found' });
        }

        res.json({ message: 'Resume updated successfully', resume: updatedResume });
    } catch (error) {
        console.error('Error saving resume:', error);
        res.status(500).json({ error: 'Failed to save resume' });
    }
});


app.listen(port, () => console.log(`Server running at http://localhost:${port}/`));


