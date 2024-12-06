const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const ejs = require('ejs'); // Template engine for dynamic HTML
const Resume = require('./models/Resume'); // Import the Resume model

const app = express();
const port = 3000;

// Middleware to serve static files and parse form data
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Set EJS as the view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// MongoDB Connection
const DB_URI = 'mongodb+srv://rojerojer24:Limosine1@relate.qorzo.mongodb.net';
mongoose.connect(DB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('Failed to connect to MongoDB:', err));

// Route to handle resume form submission
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
            companyName = [],
            position = [],
            location = [],
            responsibilities = [],
            startDate = [],
            endDate = [],
            projectName = [],
            projectDescription = [],
            projectStartDate = [],
            leadershipPosition = [],
            groupName = [],
            leadershipLocation = [],
            leadershipStartDate = [],
            leadershipEndDate = [],
        } = req.body;

        // Map experiences
        const experiences = companyName.map((_, i) => ({
            companyName: companyName[i],
            position: position[i],
            location: location[i],
            responsibilities: responsibilities[i],
            startDate: startDate[i],
            endDate: endDate[i],
        }));

        // Map projects
        const projects = projectName.map((_, i) => ({
            projectName: projectName[i],
            projectDescription: projectDescription[i],
            projectStartDate: projectStartDate[i],
        }));

        // Map leadership
        const leadership = leadershipPosition.map((_, i) => ({
            leadershipPosition: leadershipPosition[i],
            groupName: groupName[i],
            location: leadershipLocation[i],
            leadershipStartDate: leadershipStartDate[i],
            leadershipEndDate: leadershipEndDate[i],
        }));

        // Save the resume to the database
        const newResume = new Resume({
            name,
            email,
            phone,
            education: {
                university,
                location: universityLocation,
                degree,
                gpa,
                relevantCourses: relevantCourse,
                graduationDate,
            },
            technicalSkills: {
                programmingLanguages,
                operatingSystems,
            },
            experiences,
            projects,
            leadership,
        });

        const savedResume = await newResume.save();

        // Redirect to the dynamic template page with the resume ID
        res.redirect(`/resume/${savedResume._id}`);
    } catch (error) {
        console.error('Error submitting resume:', error);
        res.status(500).json({ error: 'Failed to save resume data' });
    }
});

// Route to dynamically render the resume template
app.get('/resume/:id', async (req, res) => {
    try {
        const resume = await Resume.findById(req.params.id);
        if (!resume) {
            return res.status(404).send('Resume not found');
        }

        // Render the template with user data
        res.render('template_engineering', { resume });
    } catch (error) {
        console.error('Error fetching resume:', error);
        res.status(500).send('Error fetching resume');
    }
});



// Test Route to Insert Sample Data
app.get('/test-insert', async (req, res) => {
    try {
        const testData = {
            name: "Test User",
            email: "test@example.com",
            phone: "1234567890",
            education: {
                university: "Test University",
                location: "Test City, Test State",
                degree: "Bachelor of Science",
                gpa: "4.0",
                relevantCourses: "Algorithms, Databases",
                graduationDate: "2024-05",
            },
            technicalSkills: {
                programmingLanguages: "JavaScript, Python",
                operatingSystems: "Windows, Linux",
            },
            experiences: [
                {
                    companyName: "Example Company",
                    position: "Software Developer",
                    location: "City, State",
                    responsibilities: "Developed software applications",
                    startDate: "2022-01",
                    endDate: "2023-12",
                },
                {
                    companyName: "Another Company",
                    position: "Intern",
                    location: "Another City, State",
                    responsibilities: "Assisted with development tasks",
                    startDate: "2021-06",
                    endDate: "2021-08",
                },
            ],
            projects: [
                {
                    projectName: "Project Alpha",
                    projectDescription: "Built a web app",
                    projectStartDate: "2022-06",
                },
                {
                    projectName: "Project Beta",
                    projectDescription: "Developed a machine learning model",
                    projectStartDate: "2023-01",
                },
            ],
            leadership: [
                {
                    leadershipPosition: "President",
                    groupName: "Coding Club",
                    location: "University Campus",
                    leadershipStartDate: "2021-08",
                    leadershipEndDate: "2023-05",
                },
                {
                    leadershipPosition: "Vice President",
                    groupName: "AI Society",
                    location: "University Campus",
                    leadershipStartDate: "2020-08",
                    leadershipEndDate: "2021-05",
                },
            ],
        };

        const newResume = new Resume(testData);
        await newResume.save();
        res.status(200).send("Test data with experiences, projects, and leadership roles inserted into resumes collection!");
    } catch (err) {
        console.error(err);
        res.status(500).send("Error inserting test data.");
    }
});

// Serve the home page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}/`);
});
