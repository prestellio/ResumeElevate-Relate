//ResumeElevateScript.js - Consolidated JavaScript for Resume Elevate

// Common navigation functions
function toggleNav() {
    var navList = document.getElementById("nav-btn");
    if (navList.style.display === "none" || navList.style.display === "") {
        navList.style.display = "flex";
    } else {
        navList.style.display = "none";
    }
}

// Nav bar mini-button toggle
document.addEventListener('DOMContentLoaded', function() {
    // Check if navbarToggle exists before adding event listener
    const navbarToggle = document.getElementById('navbarToggle');
    if (navbarToggle) {
        navbarToggle.addEventListener('click', function() {
            var menu = document.getElementById('navbarMenu');
            if (menu.style.display === 'block') {
                menu.style.display = 'none';
            } else {
                menu.style.display = 'block';
            }
        });
    }

    // Navigation to generator page
    const generatorButton = document.getElementById("generator");
    if (generatorButton) {
        generatorButton.addEventListener("click", toGenerator);
    }

    // Login page registration form handler
    const registrationForm = document.getElementById('registrationForm');
    if (registrationForm) {
        registrationForm.addEventListener('submit', handleRegistration);
    }

    // Generate page form handler
    const resumeForm = document.getElementById('resumeForm');
    if (resumeForm) {
        resumeForm.addEventListener('submit', handleResumeSubmission);
    }

    // Editor page - Load resume data if the page is editor.html
    if (window.location.pathname.includes('editor.html')) {
        loadResumeData();
    }

    // Editor_review page - Load resume data if the page is editor_review.html
    if (window.location.pathname.includes('editor_review.html')) {
        loadResumeDataForReview();
    }

    // Template selection page initialization
    if (window.location.pathname.includes('templateselection.html')) {
        initTemplateSelection();
    }

    // Questionnaire page initialization
    if (window.location.pathname.includes('questionnaire.html')) {
        initQuestionnaire();
    }
});

// Navigation function to the generator page
function toGenerator() {
    window.location.href = "generate.html";
}

// Login/Registration form handling
async function handleRegistration(event) {
    event.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const email = document.getElementById('email').value;

    // Send POST request to the server
    const response = await fetch('/register', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password, email })
    });

    if (response.ok) {
        // If registration is successful, redirect to the generate page
        window.location.href = 'generate.html';
    } else {
        const result = await response.text();
        document.getElementById('result').innerText = result;
    }
}

// Generate page - Resume form submission
async function handleResumeSubmission(event) {
    event.preventDefault(); // Prevent default form submission

    const formData = new FormData(this); // Capture form data
    const formObject = {};
    formData.forEach((value, key) => {
        if (formObject[key]) {
            if (!Array.isArray(formObject[key])) {
                formObject[key] = [formObject[key]];
            }
            formObject[key].push(value);
        } else {
            formObject[key] = value;
        }
    });

    try {
        const response = await fetch('/submit-resume', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formObject)
        });

        if (response.ok) {
            const data = await response.json();
            if (data.resumeId) {
                // Redirect to editor.html with resumeId
                window.location.href = `editor.html?resumeId=${data.resumeId}`;
            } else {
                alert('Error: Resume ID not received.');
            }
        } else {
            alert('Failed to submit resume.');
        }
    } catch (error) {
        console.error('Error submitting form:', error);
        alert('Error submitting resume.');
    }
}

// Editor page - Load resume data
async function loadResumeData() {
    const urlParams = new URLSearchParams(window.location.search);
    const resumeId = urlParams.get('resumeId');

    if (!resumeId) {
        console.error("No resume ID found in the URL.");
        alert("Error: No Resume ID found. Try submitting the form again.");
        return;
    }

    try {
        const response = await fetch(`/get-resume/${resumeId}`);
        if (!response.ok) {
            throw new Error("Resume not found");
        }
        const resume = await response.json();
        console.log("Fetched Resume Data:", resume);

        // Initialize Quill editor
        var quill = new Quill('#editor-container', {
            theme: 'snow',
            placeholder: 'Your resume will appear here...',
            modules: {
                toolbar: [
                    [{ header: [1, 2, false] }],
                    ['bold', 'italic', 'underline'],
                    [{ list: 'ordered' }, { list: 'bullet' }],
                    ['link'],
                    ['clean']
                ]
            }
        });

        // Ensure missing fields do not break the code
        const name = resume.name || "Full Name";
        const email = resume.email || "Email Not Provided";
        const phone = resume.phone || "Phone Not Provided";
        const education = resume.education || {};
        const degree = education.degree || "Degree Not Provided";
        const university = education.university || "University Not Provided";
        const location = education.location || "Location Not Provided";
        const gpa = education.gpa || "N/A";
        const relevantCourses = education.relevantCourses || "Not Available";

        let resumeContent = `<h1>${name}</h1>
            <p><strong>Email:</strong> ${email} | <strong>Phone:</strong> ${phone}</p>
            <h2>Education</h2>
            <p><strong>${degree}</strong>, ${university}, ${location}</p>
            <p>GPA: ${gpa}</p>
            <p><strong>Relevant Courses:</strong> ${relevantCourses}</p>
            <h2>Experience</h2>`;

        if (resume.experiences && resume.experiences.length > 0) {
            resume.experiences.forEach(exp => {
                resumeContent += `<p><strong>${exp.position || "Position Not Provided"}</strong> 
                                at ${exp.companyName || "Company Not Provided"}, 
                                ${exp.location || "Location Not Provided"} 
                                (${exp.startDate || "Start Date Not Provided"} - 
                                ${exp.endDate || "End Date Not Provided"})</p>
                                <p>${exp.responsibilities || "Responsibilities Not Provided"}</p>`;
            });
        } else {
            resumeContent += `<p>No experience added.</p>`;
        }

        resumeContent += `<h2>Projects</h2>`;
        if (resume.projects && resume.projects.length > 0) {
            resume.projects.forEach(proj => {
                resumeContent += `<p><strong>${proj.projectName || "Project Name Not Provided"}</strong> 
                                - ${proj.projectDescription || "Description Not Provided"} 
                                (Started: ${proj.projectStartDate || "Start Date Not Provided"})</p>`;
            });
        } else {
            resumeContent += `<p>No projects added.</p>`;
        }

        resumeContent += `<h2>Leadership Experience</h2>`;
        if (resume.leadership && resume.leadership.length > 0) {
            resume.leadership.forEach(lead => {
                resumeContent += `<p><strong>${lead.leadershipPosition || "Position Not Provided"}</strong> 
                                at ${lead.groupName || "Group Name Not Provided"} 
                                (${lead.leadershipStartDate || "Start Date Not Provided"} - 
                                ${lead.leadershipEndDate || "End Date Not Provided"})</p>`;
            });
        } else {
            resumeContent += `<p>No leadership experience added.</p>`;
        }

        // Insert prepopulated text into Quill editor
        quill.root.innerHTML = resumeContent;

        // Setup save resume button
        document.getElementById('saveResume').addEventListener('click', async () => {
            await saveResume(resumeId, quill.root.innerHTML);
        });

        // Setup download PDF button
        document.getElementById('downloadPDF').addEventListener('click', downloadPDF);

    } catch (error) {
        console.error('Error fetching resume data:', error);
        alert("Error fetching resume. Try again.");
    }
}

// Save resume function
async function saveResume(resumeId, resumeContent) {
    if (!resumeId) {
        alert("Error: Resume ID is missing.");
        return;
    }

    const updatedData = {
        resumeId,
        resumeContent
    };

    try {
        const response = await fetch('/save-resume', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedData)
        });

        if (response.ok) {
            alert('Resume saved successfully!');
            // Display the formatted resume preview
            document.getElementById('resumeOutput').innerHTML = `
                <h2>Resume Preview</h2>
                ${resumeContent}
            `;
        } else {
            alert('Failed to save resume.');
        }
    } catch (error) {
        console.error('Error saving resume:', error);
        alert('Error saving resume.');
    }
}

// Download PDF function
async function downloadPDF() {
    try {
        const response = await fetch('/generate-pdf', { method: 'POST' });
        if (response.ok) {
            const blob = await response.blob();
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = 'resume.pdf';
            link.click();
            URL.revokeObjectURL(link.href);
        } else {
            alert('Failed to generate PDF.');
        }
    } catch (error) {
        console.error('Error generating PDF:', error);
    }
}

// Editor_review page - Load resume data
async function loadResumeDataForReview() {
    const urlParams = new URLSearchParams(window.location.search);
    const resumeId = urlParams.get('resumeId');

    if (!resumeId) {
        console.error("No resume ID found in the URL.");
        return;
    }

    try {
        const response = await fetch(`/get-resume/${resumeId}`);
        const resume = await response.json();
        console.log("Fetched Resume Data:", resume); // Debugging Log

        if (resume) {
            document.getElementById('name').innerText = resume.name || "Full Name";
            document.getElementById('email').innerText = resume.email || "Email Not Provided";
            document.getElementById('phone').innerText = resume.phone || "Phone Not Provided";

            // Initialize Quill editors
            var quillEducation = new Quill('#education-container', { theme: 'snow', placeholder: 'Add education details...' });
            var quillExperience = new Quill('#experience-container', { theme: 'snow', placeholder: 'Add work experience...' });
            var quillProjects = new Quill('#projects-container', { theme: 'snow', placeholder: 'Add project details...' });
            var quillLeadership = new Quill('#leadership-container', { theme: 'snow', placeholder: 'Add leadership experience...' });

            // Populate Quill editors with correct data
            quillEducation.root.innerHTML = `<p><strong>${resume.education.degree || "Degree Not Provided"}</strong>, ${resume.education.university || "University Not Provided"}, ${resume.education.location || "Location Not Provided"}</p>
                                             <p>GPA: ${resume.education.gpa || "N/A"}</p>
                                             <p>Relevant Courses: ${resume.education.relevantCourses || "Not Provided"}</p>`;

            quillExperience.root.innerHTML = resume.experiences.length > 0 ? 
                resume.experiences.map(exp => `<p><strong>${exp.position || "Position Not Provided"}</strong> at ${exp.companyName || "Company Not Provided"} (${exp.startDate || "Start Date"} - ${exp.endDate || "End Date"})<br>${exp.responsibilities || "Responsibilities not provided."}</p>`).join('') :
                `<p>No experience added.</p>`;

            quillProjects.root.innerHTML = resume.projects.length > 0 ? 
                resume.projects.map(proj => `<p><strong>${proj.projectName || "Project Name Not Provided"}</strong> - ${proj.projectDescription || "Description Not Provided"} (Started: ${proj.projectStartDate || "Start Date"})</p>`).join('') :
                `<p>No projects added.</p>`;

            quillLeadership.root.innerHTML = resume.leadership.length > 0 ? 
                resume.leadership.map(lead => `<p><strong>${lead.leadershipPosition || "Position Not Provided"}</strong> at ${lead.groupName || "Group Not Provided"} (${lead.leadershipStartDate || "Start Date"} - ${lead.leadershipEndDate || "End Date"})</p>`).join('') :
                `<p>No leadership experience added.</p>`;

            // Set up save button handler
            document.getElementById('saveResume').addEventListener('click', async () => {
                await saveResumeReview(resumeId, quillEducation, quillExperience, quillProjects, quillLeadership);
            });
        }
    } catch (error) {
        console.error('Error fetching resume data:', error);
    }
}

// Save resume review data
async function saveResumeReview(resumeId, quillEducation, quillExperience, quillProjects, quillLeadership) {
    if (!resumeId) {
        alert("Error: Resume ID is missing.");
        return;
    }

    const updatedData = {
        resumeId,
        educationContent: quillEducation.root.innerHTML,
        experienceContent: quillExperience.root.innerHTML,
        projectsContent: quillProjects.root.innerHTML,
        leadershipContent: quillLeadership.root.innerHTML
    };

    try {
        const response = await fetch('/save-resume', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedData)
        });

        if (response.ok) {
            alert('Resume saved successfully!');
        } else {
            alert('Failed to save resume.');
        }
    } catch (error) {
        console.error('Error saving resume:', error);
    }
}

// Template selection page initialization
function initTemplateSelection() {
    // Sample template data (in a real app, this would come from your backend)
    const sampleTemplates = [
        { id: 'template1', name: 'Professional Template', url: '../RelateLogo.png' },
        { id: 'template2', name: 'Creative Template', url: '../RelateLogo.png' },
        { id: 'template3', name: 'Modern Template', url: '../RelateLogo.png' }
    ];

    // Function to fetch images from Google Cloud Storage
    async function fetchImagesFromGCS() {
        const templateList = document.getElementById('template-select-ul');
        
        try {
            // Remove loading message
            templateList.innerHTML = '';  
            
            // Create template options
            sampleTemplates.forEach(template => {
                const listItem = document.createElement('li');
                listItem.innerHTML = `
                    <label>
                        <img src="${template.url}" alt="${template.name}" class="preview-image" data-fullsize="${template.url}">
                        <input type="radio" id="${template.id}" name="template-select" value="${template.id}">
                    </label>
                `;
                
                templateList.appendChild(listItem);
            });
            
            // Add click events to all template thumbnails
            document.querySelectorAll('.preview-image').forEach(img => {
                img.addEventListener('click', function() {
                    const fullsizeUrl = this.dataset.fullsize;
                    const templateName = this.alt;
                    showFullsizeTemplate(fullsizeUrl, templateName);
                    
                    // Also select the radio button
                    const radioBtn = this.nextElementSibling;
                    radioBtn.checked = true;
                });
            });
            
        } catch (error) {
            console.error('Error fetching templates:', error);
            templateList.innerHTML = '<p>Error loading templates. Please try again later.</p>';
        }
    }
    
    // Function to display fullsize template
    function showFullsizeTemplate(imageUrl, imageName) {
        const fullsizeContainer = document.getElementById('fullsizeContainer');
        
        fullsizeContainer.innerHTML = `
            <img src="${imageUrl}" alt="${imageName}" id="fullsizeImage" class="fullsize-image">
            <div class="image-title">${imageName}</div>
        `;
        
        // Add click event to open the modal with an even larger view
        document.getElementById('fullsizeImage').addEventListener('click', function() {
            const modal = document.getElementById('imageModal');
            const modalImg = document.getElementById('modalImage');
            
            modalImg.src = imageUrl;
            modal.style.display = 'flex';
        });
    }
    
    // Close the modal when clicking the X
    const modalClose = document.getElementById('modalClose');
    if (modalClose) {
        modalClose.addEventListener('click', function() {
            document.getElementById('imageModal').style.display = 'none';
        });
    }
    
    // Close the modal when clicking outside the image
    const imageModal = document.getElementById('imageModal');
    if (imageModal) {
        imageModal.addEventListener('click', function(event) {
            if (event.target === this) {
                this.style.display = 'none';
            }
        });
    }
    
    // Initial load of template images
    fetchImagesFromGCS();
}

// Questionnaire page initialization
function initQuestionnaire() {
    // Section IDs in order of appearance
    const sectionIds = [
        'career-selection',
        'personal-info',
        'education-info',
        'experience-info', 
        'projects-info',
        'skills-info',
        'summary-section'
    ];

    // Field-specific sections mapped by career choice
    const fieldSpecificSections = {
        'engineering': 'engineering-questions'
        // Add others as needed
    };

    // Current workflow of sections
    let currentWorkflow = [...sectionIds];
    
    // Track current section index
    let currentSectionIndex = 0;
    
    // Career choice
    let selectedCareer = '';

    // Resume data object to store all responses
    const resumeData = {
        personalInfo: {},
        education: [],
        experience: [],
        projects: [],
        skills: {},
        fieldSpecific: {},
        summary: ''
    };

    // Career selection buttons
    const careerButtons = document.querySelectorAll('.option-btn[data-career]');
    careerButtons.forEach(button => {
        button.addEventListener('click', function() {
            selectedCareer = this.getAttribute('data-career');
            
            // Update workflow to include field-specific questions
            if (fieldSpecificSections[selectedCareer]) {
                // Insert field-specific section before summary
                const summaryIndex = currentWorkflow.indexOf('summary-section');
                currentWorkflow.splice(summaryIndex, 0, fieldSpecificSections[selectedCareer]);
            }
            
            // Move to next section
            moveToNextSection();
        });
    });

    // Setup navigation buttons
    document.getElementById('personal-back').addEventListener('click', moveToPreviousSection);
    document.getElementById('personal-next').addEventListener('click', function() {
        collectPersonalInfo();
        moveToNextSection();
    });

    document.getElementById('education-back').addEventListener('click', moveToPreviousSection);
    document.getElementById('education-next').addEventListener('click', function() {
        collectEducationInfo();
        moveToNextSection();
    });

    document.getElementById('experience-back').addEventListener('click', moveToPreviousSection);
    document.getElementById('experience-next').addEventListener('click', function() {
        collectExperienceInfo();
        moveToNextSection();
    });

    document.getElementById('projects-back').addEventListener('click', moveToPreviousSection);
    document.getElementById('projects-next').addEventListener('click', function() {
        collectProjectsInfo();
        moveToNextSection();
    });

    document.getElementById('skills-back').addEventListener('click', moveToPreviousSection);
    document.getElementById('skills-next').addEventListener('click', function() {
        collectSkillsInfo();
        moveToNextSection();
    });

    // Engineering specific section
    if (document.getElementById('engineering-back')) {
        document.getElementById('engineering-back').addEventListener('click', moveToPreviousSection);
        document.getElementById('engineering-next').addEventListener('click', function() {
            collectEngineeringInfo();
            moveToNextSection();
        });
    }

    document.getElementById('summary-back').addEventListener('click', moveToPreviousSection);
    document.getElementById('submit-resume').addEventListener('click', function() {
        collectSummary();
        submitResume();
    });
    
    // Setup "Add More" buttons
    document.getElementById('add-education').addEventListener('click', addEducationSection);
    document.getElementById('add-experience').addEventListener('click', addExperienceSection);
    document.getElementById('add-project').addEventListener('click', addProjectSection);
    
    // Update progress bar
    updateProgressBar();

    function moveToNextSection() {
        // Hide current section
        document.getElementById(currentWorkflow[currentSectionIndex]).classList.add('hidden');
        
        // Move to next section index
        currentSectionIndex++;
        
        // Show next section
        document.getElementById(currentWorkflow[currentSectionIndex]).classList.remove('hidden');
        
        // Update progress bar
        updateProgressBar();
    }

    function moveToPreviousSection() {
        // Hide current section
        document.getElementById(currentWorkflow[currentSectionIndex]).classList.add('hidden');
        
        // Move to previous section index
        currentSectionIndex--;
        
        // Show previous section
        document.getElementById(currentWorkflow[currentSectionIndex]).classList.remove('hidden');
        
        // Update progress bar
        updateProgressBar();
    }

    function updateProgressBar() {
        const progressPercentage = ((currentSectionIndex) / (currentWorkflow.length - 1)) * 100;
        document.getElementById('progressBar').style.width = `${progressPercentage}%`;
    }

    // Data collection functions
    function collectPersonalInfo() {
        resumeData.personalInfo = {
            name: document.getElementById('full-name').value,
            email: document.getElementById('email').value,
            phone: document.getElementById('phone').value,
            location: document.getElementById('location').value
        };
    }

    function collectEducationInfo() {
        // Simple version - just collect the first education entry
        resumeData.education = [{
            university: document.getElementById('university').value,
            degree: document.getElementById('degree').value,
            graduationDate: document.getElementById('graduation-date').value,
            gpa: document.getElementById('gpa').value,
            relevantCourses: document.getElementById('relevant-courses').value
        }];
    }

    function collectExperienceInfo() {
        // Simple version - just collect the first experience entry
        resumeData.experience = [{
            companyName: document.getElementById('company-name').value,
            jobTitle: document.getElementById('job-title').value,
            location: document.getElementById('job-location').value,
            dates: document.getElementById('employment-dates').value,
            responsibilities: document.getElementById('job-responsibilities').value
        }];
    }

    function collectProjectsInfo() {
        // Simple version - just collect the first project entry
        resumeData.projects = [{
            projectName: document.getElementById('project-name').value,
            dates: document.getElementById('project-dates').value,
            description: document.getElementById('project-description').value
        }];
    }

    function collectSkillsInfo() {
        resumeData.skills = {
            technical: document.getElementById('technical-skills').value,
            soft: document.getElementById('soft-skills').value,
            languages: document.getElementById('languages').value,
            certifications: document.getElementById('certifications').value
        };
    }

    function collectEngineeringInfo() {
        resumeData.fieldSpecific.engineering = {
            discipline: document.getElementById('engineering-type').value,
            software: document.getElementById('engineering-software').value,
            projects: document.getElementById('engineering-projects').value
        };
    }

    function collectSummary() {
        resumeData.summary = document.getElementById('professional-summary').value;
    }

    // Submit resume to backend
    function submitResume() {
        // Show loading state
        document.getElementById('submit-resume').textContent = 'Processing...';
        document.getElementById('submit-resume').disabled = true;
        
        // Send data to server
        fetch('/submit-resume', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(resumeData)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            if (data.resumeId) {
                // Redirect to editor with the resume ID
                window.location.href = `editor.html?resumeId=${data.resumeId}`;
            } else {
                alert('Error: Failed to generate resume. Please try again.');
                document.getElementById('submit-resume').textContent = 'Generate Resume';
                document.getElementById('submit-resume').disabled = false;
            }
        })
        .catch(error => {
            console.error('Error submitting resume:', error);
            alert('Error: Failed to submit resume. Please try again.');
            document.getElementById('submit-resume').textContent = 'Generate Resume';
            document.getElementById('submit-resume').disabled = false;
        });
    }

    // Section addition functions
    function addEducationSection() {
        alert("This function will add another education section. For simplicity, this feature is disabled in the demo.");
    }

    function addExperienceSection() {
        alert("This function will add another experience section. For simplicity, this feature is disabled in the demo.");
    }

    function addProjectSection() {
        alert("This function will add another project section. For simplicity, this feature is disabled in the demo.");
    }
}