require('dotenv').config();

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
const Resume = require('./models/Resume');
const Answer = require('./models/Answer');

const app = express();
const port = 3000;

// Import routes
const templateRoutes = require('./routes/templateRoutes');
const aiRoutes = require('./routes/aiRoutes');
const resumeAssistantRoutes = require('./routes/resumeAssistantRoutes');
const { generateEnhancedResume } = require('./utils/resumeGenerator');

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

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

// Mount route handlers - Note the different paths to avoid conflicts
app.use('/api/templates', templateRoutes);
app.use('/api/ai/resume', aiRoutes);
app.use('/api/ai/assistant', resumeAssistantRoutes);


// API endpoint to generate a complete resume
app.get('/api/generate-complete-resume/:resumeId/:templateId', async (req, res) => {
  try {
    const { resumeId, templateId } = req.params;
    
    if (!resumeId || !templateId) {
      return res.status(400).json({
        success: false,
        message: 'Missing resumeId or templateId'
      });
    }
    
    const { generateCompleteResume } = require('./utils/resumeGenerator');
    const result = await generateCompleteResume(resumeId, templateId);
    
    res.json(result);
  } catch (error) {
    console.error('Error generating complete resume:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate complete resume',
      error: error.message
    });
  }
});


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

// Route to get all saved answers
app.get('/api/answers', async (req, res) => {
    try {
        const answers = await Answer.find().sort({ createdAt: -1 }).limit(10);
        res.json({ success: true, count: answers.length, answers });
    } catch (error) {
        console.error('Error fetching answers:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch answers' });
    }
});

// Route to get a specific answer by ID
app.get('/api/answers/:id', async (req, res) => {
    try {
        const answer = await Answer.findById(req.params.id);
        if (!answer) {
            return res.status(404).json({ success: false, message: 'Answer not found' });
        }
        res.json({ success: true, answer });
    } catch (error) {
        console.error('Error fetching answer:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch answer' });
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

// Add this to your app.js or create a new route file

// API endpoint to generate a complete resume
app.get('/api/generate-complete-resume/:resumeId/:templateId', async (req, res) => {
  try {
    const { resumeId, templateId } = req.params;
    
    if (!resumeId || !templateId) {
      return res.status(400).json({
        success: false,
        message: 'Missing resumeId or templateId'
      });
    }
    
    const { generateCompleteResume } = require('./utils/resumeGenerator');
    const result = await generateCompleteResume(resumeId, templateId);
    
    res.json(result);
  } catch (error) {
    console.error('Error generating complete resume:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate complete resume',
      error: error.message
    });
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
            education,
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

// Route to save questionnaire answers
app.post('/save-answers', async (req, res) => {
    try {
        // Log initial data without detailed formatting
        console.log("Received initial questionnaire data");

        if (!req.body.answers) {
            return res.status(400).json({ error: "No answers received" });
        }

        // Make sure education and projects arrays contain all the necessary fields
        const answerData = req.body.answers;
        
        // Ensure education is properly formatted
        if (answerData.education && Array.isArray(answerData.education)) {
            answerData.education = answerData.education.map(edu => {
                return {
                    university: edu.university || '',
                    degree: edu.degree || '',
                    graduationDate: edu.graduationDate || '',
                    gpa: edu.gpa || '',
                    relevantCourses: edu.relevantCourses || ''
                };
            });
        }
        
        // Ensure projects are properly formatted
        if (answerData.projects && Array.isArray(answerData.projects)) {
            answerData.projects = answerData.projects.map(proj => {
                return {
                    projectName: proj.projectName || '',
                    dates: proj.dates || '',
                    description: proj.description || ''
                };
            });
        }
        
        // Ensure experience is properly formatted
        if (answerData.experience && Array.isArray(answerData.experience)) {
            answerData.experience = answerData.experience.map(exp => {
                return {
                    companyName: exp.companyName || '',
                    jobTitle: exp.jobTitle || '',
                    location: exp.location || '',
                    dates: exp.dates || '',
                    responsibilities: exp.responsibilities || ''
                };
            });
        }
        
        // Ensure field-specific data is properly formatted
        if (answerData.fieldSpecific) {
            // Handle engineering field
            if (answerData.fieldSpecific.engineering) {
                answerData.fieldSpecific.engineering = {
                    discipline: answerData.fieldSpecific.engineering.discipline || '',
                    software: answerData.fieldSpecific.engineering.software || '',
                    projects: answerData.fieldSpecific.engineering.projects || ''
                };
            }
            
            // Handle education field
            if (answerData.fieldSpecific.education) {
                answerData.fieldSpecific.education = {
                    level: answerData.fieldSpecific.education.level || '',
                    subjects: answerData.fieldSpecific.education.subjects || '',
                    certifications: answerData.fieldSpecific.education.certifications || '',
                    methods: answerData.fieldSpecific.education.methods || ''
                };
            }
            
            // Add similar blocks for other field-specific data if needed
        }

        // Now log the fully processed data with detailed formatting
        console.log("Processed questionnaire data:");
        console.log("- Career Field:", answerData.careerField);
        console.log("- Personal Info:", JSON.stringify(answerData.personalInfo, null, 2));
        console.log("- Education:", JSON.stringify(answerData.education, null, 2));
        console.log("- Experience:", JSON.stringify(answerData.experience, null, 2));
        console.log("- Projects:", JSON.stringify(answerData.projects, null, 2));
        console.log("- Skills:", JSON.stringify(answerData.skills, null, 2));
        console.log("- Field Specific:", JSON.stringify(answerData.fieldSpecific, null, 2));
        console.log("- Summary:", answerData.summary);

        // Create new answer document
        const newAnswers = new Answer(answerData);
        
        // Log the document before saving
        console.log("About to save document to MongoDB:", newAnswers);
        
        // Save to MongoDB and store the result
        const savedAnswer = await newAnswers.save();
        
        // Log success with the document ID for verification
        console.log("MongoDB save successful! Document ID:", savedAnswer._id);
        console.log("Document saved to MongoDB:", savedAnswer);

        // Return the ID to the client for reference
        res.status(201).json({ 
            message: "Answers saved successfully!", 
            answerId: savedAnswer._id.toString()
        });

    } catch (error) {
        console.error("Error saving questionnaire answers:", error);
        
        // Provide more detailed error information
        if (error.name === 'ValidationError') {
            // Mongoose validation error
            console.error("MongoDB validation error:", error.message);
            const validationErrors = {};
            for (const field in error.errors) {
                validationErrors[field] = error.errors[field].message;
            }
            return res.status(400).json({ 
                error: "Validation error", 
                details: validationErrors 
            });
        } else if (error.name === 'MongoServerError' && error.code === 11000) {
            // Duplicate key error
            console.error("MongoDB duplicate key error:", error);
            return res.status(400).json({ 
                error: "Duplicate entry", 
                details: error.keyValue 
            });
        } else if (error.name === 'MongoNetworkError') {
            // Network error - could not connect to MongoDB
            console.error("MongoDB network error - check connection:", error);
            return res.status(500).json({ 
                error: "Database connection error", 
                details: "Could not connect to the database" 
            });
        }
        
        // Generic error response
        res.status(500).json({ 
            error: "Failed to save answers", 
            message: error.message 
        });
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

app.listen(port, () => console.log(`Server running at http://localhost:${port}/pages/`));