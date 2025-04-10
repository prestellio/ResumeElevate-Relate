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

// Navigation function to the questionnaire page
function toGenerator() {
    window.location.href = "questionnaire.html";
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
    const templateId = urlParams.get('template') || 'default';

    if (!resumeId) {
        console.error("No resume ID found in the URL.");
        alert("Error: No Resume ID found. Try submitting the form again.");
        return;
    }

    try {
        // First, fetch the resume data
        const resumeResponse = await fetch(`/get-resume/${resumeId}`);
        if (!resumeResponse.ok) {
            throw new Error("Resume not found");
        }
        
        const resume = await resumeResponse.json();
        console.log("Fetched Resume Data:", resume);
        
        // Try to fetch questionnaire answers if available
        let answers = null;
        try {
            // Use the dedicated endpoint to fetch matching answer by resume ID
            const answersResponse = await fetch(`/api/get-answer-by-resume/${resumeId}`);
            if (answersResponse.ok) {
                const answersData = await answersResponse.json();
                
                if (answersData.success && answersData.answer) {
                    answers = answersData.answer;
                    console.log("Found matching questionnaire answers:", answers);
                }
            } else {
                console.log("No matching questionnaire answers found for this resume");
                
                // Fallback: Try to fetch all answers and find a match manually
                const allAnswersResponse = await fetch(`/api/get-answers`);
                if (allAnswersResponse.ok) {
                    const allAnswersData = await allAnswersResponse.json();
                    
                    // Find the matching answer based on personal information
                    if (allAnswersData.success && allAnswersData.answers && allAnswersData.answers.length > 0) {
                        for (const answer of allAnswersData.answers) {
                            if (answer.personalInfo && 
                                answer.personalInfo.name === resume.name && 
                                answer.personalInfo.email === resume.email) {
                                answers = answer;
                                console.log("Found matching questionnaire answers from all answers:", answers);
                                break;
                            }
                        }
                    }
                }
            }
        } catch (error) {
            console.warn("Could not fetch questionnaire answers:", error);
            // Continue without answers data - not critical
        }

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

        // Get the career field from the answers or resume data
        let careerField = '';
        if (answers && answers.careerField) {
            careerField = answers.careerField;
        } else if (resume.careerField) {
            careerField = resume.careerField;
        } else if (answers && answers.fieldSpecific) {
            careerField = Object.keys(answers.fieldSpecific)[0];
        }

        // Apply template based on selected template ID
        let resumeContent = '';
        let templateStyles = {};
        
        // Templates with enhanced styling and structure based on templateId
        switch(templateId) {
            case 'engineering':
                // Engineering template with technical focus
                templateStyles = {
                    fontFamily: "'Open Sans', sans-serif",
                    headerColor: '#2c3e50',
                    accentColor: '#3498db',
                    sectionHeaderColor: '#2980b9',
                    sectionBorder: 'border-left: 4px solid #3498db; padding-left: 10px;',
                    contactColor: '#7f8c8d',
                    background: '#f8f9fa',
                    containerStyles: 'padding: 30px; border-radius: 5px; background-color: #f8f9fa;'
                };
                
                resumeContent = `
                <div style="${templateStyles.containerStyles} font-family: ${templateStyles.fontFamily};">
                    <h1 style="color: ${templateStyles.headerColor}; border-bottom: 2px solid ${templateStyles.accentColor};">${name}</h1>
                    <p style="color: ${templateStyles.contactColor};"><strong>Email:</strong> ${email} | <strong>Phone:</strong> ${phone}</p>
                    
                    <h2 style="color: ${templateStyles.sectionHeaderColor}; ${templateStyles.sectionBorder}">Education</h2>
                    <p><strong>${degree}</strong>, ${university}, ${location}</p>
                    <p>GPA: ${gpa}</p>
                    <p><strong>Relevant Courses:</strong> ${relevantCourses}</p>
                    
                    <h2 style="color: ${templateStyles.sectionHeaderColor}; ${templateStyles.sectionBorder}">Technical Skills</h2>
                    <p>${resume.technicalSkills?.programmingLanguages || (answers?.skills?.technical || 'Not provided')}</p>
                    
                    <h2 style="color: ${templateStyles.sectionHeaderColor}; ${templateStyles.sectionBorder}">Experience</h2>
                </div>`;
                break;
                
            case 'business':
                // Business template with professional focus
                templateStyles = {
                    fontFamily: "'Georgia', serif",
                    headerColor: '#34495e',
                    accentColor: '#c0392b',
                    sectionHeaderColor: '#c0392b',
                    contactColor: '#7f8c8d',
                    background: '#ffffff',
                    containerStyles: 'padding: 30px; border: 1px solid #f0f0f0; background-color: #ffffff;'
                };
                
                resumeContent = `
                <div style="${templateStyles.containerStyles} font-family: ${templateStyles.fontFamily};">
                    <h1 style="color: ${templateStyles.headerColor}; text-align: center;">${name}</h1>
                    <p style="text-align: center; color: ${templateStyles.contactColor};"><strong>Email:</strong> ${email} | <strong>Phone:</strong> ${phone}</p>
                    
                    <h2 style="color: ${templateStyles.sectionHeaderColor}; border-bottom: 1px solid ${templateStyles.accentColor};">Professional Summary</h2>
                    <p>${answers?.summary || resume.summary || 'Professional with experience in business and finance.'}</p>
                    
                    <h2 style="color: ${templateStyles.sectionHeaderColor}; border-bottom: 1px solid ${templateStyles.accentColor};">Education</h2>
                    <p><strong>${degree}</strong>, ${university}, ${location}</p>
                    <p>GPA: ${gpa}</p>
                    
                    <h2 style="color: ${templateStyles.sectionHeaderColor}; border-bottom: 1px solid ${templateStyles.accentColor};">Experience</h2>
                </div>`;
                break;
                
            case 'technology':
                // Technology template with modern look
                templateStyles = {
                    fontFamily: "'Verdana', sans-serif",
                    headerColor: '#8e44ad',
                    accentColor: '#9b59b6',
                    sectionHeaderColor: '#9b59b6',
                    contactColor: '#7f8c8d',
                    background: '#f5f5f5',
                    containerStyles: 'padding: 30px; border-radius: 8px; background-color: #f5f5f5; box-shadow: 0 2px 10px rgba(0,0,0,0.05);'
                };
                
                resumeContent = `
                <div style="${templateStyles.containerStyles} font-family: ${templateStyles.fontFamily};">
                    <h1 style="color: ${templateStyles.headerColor};">${name}</h1>
                    <p style="color: ${templateStyles.contactColor};"><strong>Email:</strong> ${email} | <strong>Phone:</strong> ${phone}</p>
                    
                    <h2 style="color: ${templateStyles.sectionHeaderColor}; border-bottom: 2px solid ${templateStyles.accentColor};">Technical Skills</h2>
                    <p>${resume.technicalSkills?.programmingLanguages || (answers?.skills?.technical || 'Not provided')}</p>
                    
                    <h2 style="color: ${templateStyles.sectionHeaderColor}; border-bottom: 2px solid ${templateStyles.accentColor};">Education</h2>
                    <p><strong>${degree}</strong>, ${university}, ${location}</p>
                    <p>GPA: ${gpa}</p>
                    <p><strong>Relevant Courses:</strong> ${relevantCourses}</p>
                    
                    <h2 style="color: ${templateStyles.sectionHeaderColor}; border-bottom: 2px solid ${templateStyles.accentColor};">Experience</h2>
                </div>`;
                break;
                
            case 'healthcare':
                // Healthcare template with clean look
                templateStyles = {
                    fontFamily: "'Arial', sans-serif",
                    headerColor: '#16a085',
                    accentColor: '#1abc9c',
                    sectionHeaderColor: '#1abc9c',
                    contactColor: '#7f8c8d',
                    background: '#f9fffc',
                    containerStyles: 'padding: 30px; border: 1px solid #e8f8f5; background-color: #f9fffc;'
                };
                
                resumeContent = `
                <div style="${templateStyles.containerStyles} font-family: ${templateStyles.fontFamily};">
                    <h1 style="color: ${templateStyles.headerColor}; text-align: center;">${name}</h1>
                    <p style="text-align: center; color: ${templateStyles.contactColor};"><strong>Email:</strong> ${email} | <strong>Phone:</strong> ${phone}</p>
                    
                    <h2 style="color: ${templateStyles.sectionHeaderColor}; border-bottom: 1px solid ${templateStyles.accentColor};">Education</h2>
                    <p><strong>${degree}</strong>, ${university}, ${location}</p>
                    <p>GPA: ${gpa}</p>
                    
                    <h2 style="color: ${templateStyles.sectionHeaderColor}; border-bottom: 1px solid ${templateStyles.accentColor};">Certifications</h2>
                    <p>${answers?.skills?.certifications || resume.skills?.certifications || 'Not provided'}</p>
                    
                    <h2 style="color: ${templateStyles.sectionHeaderColor}; border-bottom: 1px solid ${templateStyles.accentColor};">Clinical Experience</h2>
                </div>`;
                break;
                
            case 'education':
                // Education template with classic look
                templateStyles = {
                    fontFamily: "'Times New Roman', serif",
                    headerColor: '#d35400',
                    accentColor: '#e67e22',
                    sectionHeaderColor: '#e67e22',
                    contactColor: '#7f8c8d',
                    background: '#fffaf5',
                    containerStyles: 'padding: 30px; border: 1px solid #f6e8da; background-color: #fffaf5;'
                };
                
                resumeContent = `
                <div style="${templateStyles.containerStyles} font-family: ${templateStyles.fontFamily};">
                    <h1 style="color: ${templateStyles.headerColor};">${name}</h1>
                    <p style="color: ${templateStyles.contactColor};"><strong>Email:</strong> ${email} | <strong>Phone:</strong> ${phone}</p>
                    
                    <h2 style="color: ${templateStyles.sectionHeaderColor};">Education</h2>
                    <p><strong>${degree}</strong>, ${university}, ${location}</p>
                    <p>GPA: ${gpa}</p>
                    
                    <h2 style="color: ${templateStyles.sectionHeaderColor};">Teaching Experience</h2>
                </div>`;
                break;
                
            case 'arts':
                // Creative arts template
                templateStyles = {
                    fontFamily: "'Courier New', monospace",
                    headerColor: '#d35400',
                    accentColor: '#f39c12',
                    sectionHeaderColor: '#f39c12',
                    contactColor: '#7f8c8d',
                    background: '#fef9e7',
                    containerStyles: 'padding: 30px; border: 1px solid #fdebd0; background-color: #fef9e7;'
                };
                
                resumeContent = `
                <div style="${templateStyles.containerStyles} font-family: ${templateStyles.fontFamily};">
                    <h1 style="color: ${templateStyles.headerColor}; text-transform: uppercase;">${name}</h1>
                    <p style="color: ${templateStyles.contactColor};"><strong>Email:</strong> ${email} | <strong>Phone:</strong> ${phone}</p>
                    
                    <h2 style="color: ${templateStyles.sectionHeaderColor}; letter-spacing: 2px;">Education</h2>
                    <p><strong>${degree}</strong>, ${university}, ${location}</p>
                    
                    <h2 style="color: ${templateStyles.sectionHeaderColor}; letter-spacing: 2px;">Creative Skills</h2>
                    <p>${answers?.skills?.technical || resume.skills?.technical || 'Not provided'}</p>
                    
                    <h2 style="color: ${templateStyles.sectionHeaderColor}; letter-spacing: 2px;">Creative Projects</h2>
                </div>`;
                break;
                
            case 'science':
                // Science template with academic focus
                templateStyles = {
                    fontFamily: "'Arial', sans-serif",
                    headerColor: '#27ae60',
                    accentColor: '#2ecc71',
                    sectionHeaderColor: '#2ecc71',
                    contactColor: '#7f8c8d',
                    background: '#f2fff8',
                    containerStyles: 'padding: 30px; border: 1px solid #d5f5e3; background-color: #f2fff8;'
                };
                
                resumeContent = `
                <div style="${templateStyles.containerStyles} font-family: ${templateStyles.fontFamily};">
                    <h1 style="color: ${templateStyles.headerColor};">${name}</h1>
                    <p style="color: ${templateStyles.contactColor};"><strong>Email:</strong> ${email} | <strong>Phone:</strong> ${phone}</p>
                    
                    <h2 style="color: ${templateStyles.sectionHeaderColor}; border-bottom: 1px dotted ${templateStyles.accentColor};">Education</h2>
                    <p><strong>${degree}</strong>, ${university}, ${location}</p>
                    <p>GPA: ${gpa}</p>
                    <p><strong>Relevant Courses:</strong> ${relevantCourses}</p>
                    
                    <h2 style="color: ${templateStyles.sectionHeaderColor}; border-bottom: 1px dotted ${templateStyles.accentColor};">Research Experience</h2>
                </div>`;
                break;
                
            default:
                // Default template
                templateStyles = {
                    fontFamily: "'Arial', sans-serif",
                    headerColor: '#333333',
                    accentColor: '#555555',
                    sectionHeaderColor: '#555555',
                    contactColor: '#777777',
                    background: '#ffffff',
                    containerStyles: 'padding: 30px; border: 1px solid #eeeeee; background-color: #ffffff;'
                };
                
                resumeContent = `
                <div style="${templateStyles.containerStyles} font-family: ${templateStyles.fontFamily};">
                    <h1 style="color: ${templateStyles.headerColor};">${name}</h1>
                    <p style="color: ${templateStyles.contactColor};"><strong>Email:</strong> ${email} | <strong>Phone:</strong> ${phone}</p>
                    
                    <h2 style="color: ${templateStyles.sectionHeaderColor}; border-bottom: 1px solid #dddddd;">Education</h2>
                    <p><strong>${degree}</strong>, ${university}, ${location}</p>
                    <p>GPA: ${gpa}</p>
                    <p><strong>Relevant Courses:</strong> ${relevantCourses}</p>
                    
                    <h2 style="color: ${templateStyles.sectionHeaderColor}; border-bottom: 1px solid #dddddd;">Experience</h2>
                </div>`;
        }

        // Function to close the div for experience sections
        function closeSectionAndAddProjects() {
            resumeContent = resumeContent.replace('</div>', ''); // Remove the closing div temporarily
            
            // Add Projects section with the same styling as previous sections
            resumeContent += `
                <h2 style="color: ${templateStyles.sectionHeaderColor}; ${templateStyles.sectionHeaderStyle || `border-bottom: 1px solid ${templateStyles.accentColor};`}">Projects</h2>
            `;
            
            if (resume.projects && resume.projects.length > 0) {
                resume.projects.forEach(proj => {
                    resumeContent += `
                        <p><strong>${proj.projectName || "Project Name Not Provided"}</strong> 
                        - ${proj.projectDescription || "Description Not Provided"} 
                        (Started: ${proj.projectStartDate || "Start Date Not Provided"})</p>
                    `;
                });
            } else if (answers && answers.projects && answers.projects.length > 0) {
                // Use project data from questionnaire answers if available
                answers.projects.forEach(proj => {
                    resumeContent += `
                        <p><strong>${proj.projectName || "Project Name Not Provided"}</strong> 
                        - ${proj.description || "Description Not Provided"} 
                        (${proj.dates || "Dates Not Provided"})</p>
                    `;
                });
            } else {
                resumeContent += `<p>No projects added.</p>`;
            }
            
            // Add leadership if it exists
            if (resume.leadership && resume.leadership.length > 0) {
                resumeContent += `
                    <h2 style="color: ${templateStyles.sectionHeaderColor}; ${templateStyles.sectionHeaderStyle || `border-bottom: 1px solid ${templateStyles.accentColor};`}">Leadership Experience</h2>
                `;
                
                resume.leadership.forEach(lead => {
                    resumeContent += `
                        <p><strong>${lead.leadershipPosition || "Position Not Provided"}</strong> 
                        at ${lead.groupName || "Group Name Not Provided"} 
                        (${lead.leadershipStartDate || "Start Date Not Provided"} - 
                        ${lead.leadershipEndDate || "End Date Not Provided"})</p>
                    `;
                });
            }
            
            // Add field-specific content if it exists in answers
            if (answers && answers.fieldSpecific && careerField && answers.fieldSpecific[careerField]) {
                const fieldData = answers.fieldSpecific[careerField];
                
                resumeContent += `
                    <h2 style="color: ${templateStyles.sectionHeaderColor}; ${templateStyles.sectionHeaderStyle || `border-bottom: 1px solid ${templateStyles.accentColor};`}">${careerField.charAt(0).toUpperCase() + careerField.slice(1)}-Specific Information</h2>
                `;
                
                if (fieldData.specialty || fieldData.discipline || fieldData.field || fieldData.level) {
                    resumeContent += `<p><strong>Specialty:</strong> ${fieldData.specialty || fieldData.discipline || fieldData.field || fieldData.level}</p>`;
                }
                
                if (fieldData.software) {
                    resumeContent += `<p><strong>Software Proficiency:</strong> ${fieldData.software}</p>`;
                }
                
                if (fieldData.certifications) {
                    resumeContent += `<p><strong>Certifications:</strong> ${fieldData.certifications}</p>`;
                }
                
                if (fieldData.projects || fieldData.experience || fieldData.methods || fieldData.achievements) {
                    resumeContent += `<p><strong>Notable Achievements:</strong> ${fieldData.projects || fieldData.experience || fieldData.methods || fieldData.achievements}</p>`;
                }
            }
            
            // Close the container div
            resumeContent += `</div>`;
        }

        // Add experience items within the styled div - first try from resume, then from answers
        if (resume.experiences && resume.experiences.length > 0) {
            resume.experiences.forEach(exp => {
                resumeContent = resumeContent.replace('</div>', ''); // Remove the closing div temporarily
                resumeContent += `
                    <p><strong>${exp.position || "Position Not Provided"}</strong> 
                    at ${exp.companyName || "Company Not Provided"}, 
                    ${exp.location || "Location Not Provided"} 
                    (${exp.startDate || "Start Date Not Provided"} - 
                    ${exp.endDate || "End Date Not Provided"})</p>
                    <p>${exp.responsibilities || "Responsibilities Not Provided"}</p>
                `;
            });
            closeSectionAndAddProjects();
        } else if (answers && answers.experience && answers.experience.length > 0) {
            // Use experience data from questionnaire answers if available
            answers.experience.forEach(exp => {
                resumeContent = resumeContent.replace('</div>', ''); // Remove the closing div temporarily
                resumeContent += `
                    <p><strong>${exp.jobTitle || "Position Not Provided"}</strong> 
                    at ${exp.companyName || "Company Not Provided"}, 
                    ${exp.location || "Location Not Provided"} 
                    (${exp.dates || "Dates Not Provided"})</p>
                    <p>${exp.responsibilities || "Responsibilities Not Provided"}</p>
                `;
            });
            closeSectionAndAddProjects();
        } else {
            resumeContent = resumeContent.replace('</div>', ''); // Remove the closing div temporarily
            resumeContent += `<p>No experience added.</p>`;
            closeSectionAndAddProjects();
        }

        // Insert prepopulated text into Quill editor
        quill.root.innerHTML = resumeContent;

        // Display the formatted resume preview
        document.getElementById('resumeOutput').innerHTML = `
            <h2 class="preview-title">Resume Preview</h2>
            ${resumeContent}
        `;

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

    // Get the career field and summary if available
    const urlParams = new URLSearchParams(window.location.search);
    const templateId = urlParams.get('template') || 'default';
    
    let careerField = '';
    let summary = '';
    
    // Try to get career field and summary from the resume data
    try {
        const answersResponse = await fetch(`/api/get-answer-by-resume/${resumeId}`);
        if (answersResponse.ok) {
            const answersData = await answersResponse.json();
            
            if (answersData.success && answersData.answer) {
                careerField = answersData.answer.careerField || '';
                summary = answersData.answer.summary || '';
            }
        }
    } catch (error) {
        console.warn("Could not fetch questionnaire answers for career field:", error);
    }

    const updatedData = {
        resumeId,
        resumeContent,
        careerField,
        summary
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
                <h2 class="preview-title">Resume Preview</h2>
                ${resumeContent}
            `;
            
            // Update debug info if available
            if (document.getElementById('debugInfo')) {
                document.getElementById('debugInfo').innerHTML += `
                    <p>Last Saved: ${new Date().toLocaleString()}</p>
                    <p>Career Field: ${careerField}</p>
                    <p>Template: ${templateId}</p>
                `;
            }
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
    // Configuration
    const apiEndpoint = '/api/get-templates'; // The endpoint we've defined in templateRoutes.js
    
    // Get career field from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const careerField = urlParams.get('career') || '';
    const resumeId = urlParams.get('resumeId') || '';
    
    // Add career field as a header
    const headerElement = document.createElement('h2');
    headerElement.className = 'template-header';
    headerElement.textContent = `${careerField ? careerField.charAt(0).toUpperCase() + careerField.slice(1) : 'All'} Resume Templates`;
    
    const templateList = document.getElementById('template-select-ul');
    templateList.parentNode.insertBefore(headerElement, templateList);
    
    // Function to fetch images from Google Cloud Storage via our API
    async function fetchImagesFromGCS() {
        templateList.innerHTML = '<div class="loading">Loading templates...</div>';
        
        try {
            // Fetch templates from our backend API
            const response = await fetch(apiEndpoint);
            
            if (!response.ok) {
                throw new Error(`API responded with status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (!data.success || !data.templates || !Array.isArray(data.templates)) {
                throw new Error('Invalid response format from API');
            }
            
            // Remove loading message
            templateList.innerHTML = '';
            
            // Filter templates based on career field if specified
            let filteredTemplates = data.templates;
            
            if (careerField) {
                // This is a simplified example. In a real implementation, your template data would include
                // metadata about which career fields each template is suitable for.
                // For now, we'll just filter based on template name/id containing the career field
                filteredTemplates = data.templates.filter(template => {
                    // Example: if a template has 'engineering' in the name/id, show it for engineering careers
                    const templateName = template.name.toLowerCase();
                    const templateId = template.id.toLowerCase();
                    return templateName.includes(careerField.toLowerCase()) || 
                           templateId.includes(careerField.toLowerCase()) ||
                           // For demo purposes, ensure some templates are always shown
                           templateId.includes('general') || 
                           Math.random() > 0.5; // Randomly include some templates to ensure there's always content
                });
            }
            
            // Create template options from the filtered templates
            if (filteredTemplates.length === 0) {
                templateList.innerHTML = '<p>No templates found for this career field. Please select from our general templates:</p>';
                // If no templates match the filter, show all templates
                filteredTemplates = data.templates;
            }
            
            filteredTemplates.forEach(template => {
                const listItem = document.createElement('li');
                listItem.innerHTML = `
                    <label>
                        <img src="${template.url}" alt="${template.name}" class="preview-image" data-fullsize="${template.url}">
                        <input type="radio" id="${template.id}" name="template-select" value="${template.id}" data-resume-id="${resumeId}">
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
            
            // Create a form for proper redirection
            const redirectForm = document.createElement('form');
            redirectForm.action = 'editor.html';
            redirectForm.method = 'GET';
            
            // Create hidden inputs for resumeId
            const resumeIdInput = document.createElement('input');
            resumeIdInput.type = 'hidden';
            resumeIdInput.name = 'resumeId';
            resumeIdInput.value = resumeId;
            redirectForm.appendChild(resumeIdInput);
            
            // Create dynamic template input that will be set on submit
            const templateInput = document.createElement('input');
            templateInput.type = 'hidden';
            templateInput.name = 'template';
            templateInput.id = 'template-input';
            redirectForm.appendChild(templateInput);
            
            // Add a continue button
            const continueButton = document.createElement('button');
            continueButton.id = 'continue-to-editor';
            continueButton.className = 'continue-btn';
            continueButton.type = 'submit';
            continueButton.style.backgroundColor = '#ff3860'; // Make it red to stand out
            continueButton.style.color = 'white';
            continueButton.style.fontWeight = 'bold';
            continueButton.style.padding = '15px 30px';
            continueButton.style.fontSize = '1.3rem';
            continueButton.style.marginTop = '30px';
            continueButton.style.marginBottom = '30px';
            continueButton.style.cursor = 'pointer';
            continueButton.textContent = '→ Use Selected Template (Click Here!) ←';
            // Add form submit handler 
            redirectForm.addEventListener('submit', function(event) {
                console.log("Form submission triggered");
                const selectedTemplate = document.querySelector('input[name="template-select"]:checked');
                if (selectedTemplate) {
                    console.log("Selected template:", selectedTemplate.value);
                    console.log("Resume ID:", resumeId);
                    
                    // Set the template value in the hidden input
                    document.getElementById('template-input').value = selectedTemplate.value;
                    
                    // Let the form submit naturally to editor.html
                    console.log("Form submitting with:", this.action + "?" + new URLSearchParams(new FormData(this)).toString());
                } else {
                    event.preventDefault();
                    alert('Please select a template first');
                }
            });
            
            // Add button to form
            redirectForm.appendChild(continueButton);
            
            // Add the form to the page
            templateList.parentNode.appendChild(redirectForm);
            
            // Add a backup direct link in case the form doesn't work
            const directLink = document.createElement('div');
            directLink.style.textAlign = 'center';
            directLink.style.marginTop = '10px';
            directLink.innerHTML = `<p>If the button doesn't work, <a href="editor.html?resumeId=${resumeId}&template=default" id="direct-editor-link">click here</a> and select a template on the next page.</p>`;
            templateList.parentNode.appendChild(directLink);
            
            // Set up direct link to dynamically update based on selection
            document.querySelectorAll('input[name="template-select"]').forEach(radio => {
                radio.addEventListener('change', function() {
                    document.getElementById('direct-editor-link').href = `editor.html?resumeId=${resumeId}&template=${this.value}`;
                });
            });
            
            // Show the first template by default
            if (filteredTemplates.length > 0) {
                const firstTemplate = filteredTemplates[0];
                showFullsizeTemplate(firstTemplate.url, firstTemplate.name);
                // Select the first radio button
                const firstRadio = document.querySelector('input[name="template-select"]');
                if (firstRadio) {
                    firstRadio.checked = true;
                }
            }
            
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
//QUESTIONNAIRE.HTML STARTS HERE
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
        'engineering': 'engineering-questions',
        'business': 'business-questions',
        'technology': 'technology-questions',
        'healthcare': 'healthcare-questions',
        'education': 'education-questions',
        'arts': 'arts-questions',
        'science': 'science-questions'
    };

    // Current workflow of sections
    let currentWorkflow = [...sectionIds];
    
    // Track current section index
    let currentSectionIndex = 0;
    
    // Career choice
    let selectedCareer = '';

    // Resume data object to store all responses
    const resumeData = {
        careerField: '',
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
            resumeData.careerField = selectedCareer;
            
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

    // Career-specific section buttons
    setupFieldSpecificButtons();

    document.getElementById('summary-back').addEventListener('click', moveToPreviousSection);
    document.getElementById('submit-resume').addEventListener('click', function() {
        collectSummary();
        submitQuestionnaire();
    });
    
    // Setup "Add More" buttons
    document.getElementById('add-education').addEventListener('click', addEducationSection);
    document.getElementById('add-experience').addEventListener('click', addExperienceSection);
    document.getElementById('add-project').addEventListener('click', addProjectSection);
    
    // Update progress bar
    updateProgressBar();

    function setupFieldSpecificButtons() {
        // Engineering specific section
        if (document.getElementById('engineering-back')) {
            document.getElementById('engineering-back').addEventListener('click', moveToPreviousSection);
            document.getElementById('engineering-next').addEventListener('click', function() {
                collectEngineeringInfo();
                moveToNextSection();
            });
        }

        // Business specific section
        if (document.getElementById('business-back')) {
            document.getElementById('business-back').addEventListener('click', moveToPreviousSection);
            document.getElementById('business-next').addEventListener('click', function() {
                collectBusinessInfo();
                moveToNextSection();
            });
        }

        // Technology specific section
        if (document.getElementById('technology-back')) {
            document.getElementById('technology-back').addEventListener('click', moveToPreviousSection);
            document.getElementById('technology-next').addEventListener('click', function() {
                collectTechnologyInfo();
                moveToNextSection();
            });
        }

        // Healthcare specific section
        if (document.getElementById('healthcare-back')) {
            document.getElementById('healthcare-back').addEventListener('click', moveToPreviousSection);
            document.getElementById('healthcare-next').addEventListener('click', function() {
                collectHealthcareInfo();
                moveToNextSection();
            });
        }

        // Education specific section
        if (document.getElementById('education-back')) {
            document.getElementById('education-back').addEventListener('click', moveToPreviousSection);
            document.getElementById('education-next').addEventListener('click', function() {
                collectEducationFieldInfo();
                moveToNextSection();
            });
        }

        // Arts specific section
        if (document.getElementById('arts-back')) {
            document.getElementById('arts-back').addEventListener('click', moveToPreviousSection);
            document.getElementById('arts-next').addEventListener('click', function() {
                collectArtsInfo();
                moveToNextSection();
            });
        }

        // Science specific section
        if (document.getElementById('science-back')) {
            document.getElementById('science-back').addEventListener('click', moveToPreviousSection);
            document.getElementById('science-next').addEventListener('click', function() {
                collectScienceInfo();
                moveToNextSection();
            });
        }
    }

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

    // Field-specific collection functions
    function collectEngineeringInfo() {
        resumeData.fieldSpecific.engineering = {
            discipline: document.getElementById('engineering-type').value,
            software: document.getElementById('engineering-software').value,
            projects: document.getElementById('engineering-projects').value
        };
    }

    function collectBusinessInfo() {
        resumeData.fieldSpecific.business = {
            specialty: document.getElementById('business-specialty').value,
            software: document.getElementById('business-software').value,
            certifications: document.getElementById('business-certifications').value,
            achievements: document.getElementById('business-achievements').value
        };
    }

    function collectTechnologyInfo() {
        resumeData.fieldSpecific.technology = {
            specialty: document.getElementById('tech-specialty').value,
            programmingLanguages: document.getElementById('programming-languages').value,
            frameworks: document.getElementById('tech-frameworks').value,
            projects: document.getElementById('tech-projects').value
        };
    }

    function collectHealthcareInfo() {
        resumeData.fieldSpecific.healthcare = {
            specialty: document.getElementById('healthcare-specialty').value,
            certifications: document.getElementById('healthcare-certifications').value,
            skills: document.getElementById('healthcare-skills').value,
            experience: document.getElementById('healthcare-experience').value
        };
    }

    function collectEducationFieldInfo() {
        resumeData.fieldSpecific.education = {
            level: document.getElementById('education-level').value,
            subjects: document.getElementById('teaching-subjects').value,
            certifications: document.getElementById('teaching-certifications').value,
            methods: document.getElementById('teaching-methods').value
        };
    }

    function collectArtsInfo() {
        resumeData.fieldSpecific.arts = {
            specialty: document.getElementById('arts-specialty').value,
            software: document.getElementById('creative-software').value,
            portfolioLink: document.getElementById('portfolio-link').value,
            projects: document.getElementById('creative-projects').value
        };
    }

    function collectScienceInfo() {
        resumeData.fieldSpecific.science = {
            field: document.getElementById('science-specialty').value,
            methods: document.getElementById('research-methods').value,
            publications: document.getElementById('publications').value,
            projects: document.getElementById('research-projects').value
        };
    }

    function collectSummary() {
        resumeData.summary = document.getElementById('professional-summary').value;
    }

    // Submit questionnaire to backend
    function submitQuestionnaire() {
        // Show loading state
        const submitButton = document.getElementById('submit-resume');
        submitButton.innerHTML = '<span class="spinner"></span>Processing...';
        submitButton.disabled = true;
        
        // Send data to server
        fetch('/save-answers', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ answers: resumeData })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            console.log('Answers saved successfully');
            
            // Now submit to the resume endpoint to generate a resume
            return fetch('/submit-resume', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(convertToResumeFormat(resumeData))
            });
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Resume generation failed');
            }
            return response.json();
        })
        .then(data => {
            if (data.resumeId) {
                // Redirect to template selection with the resume ID and career field
                window.location.href = `templateselection.html?resumeId=${data.resumeId}&career=${selectedCareer}`;
            } else {
                alert('Error: Failed to generate resume. Please try again.');
                submitButton.innerHTML = 'Generate Resume';
                submitButton.disabled = false;
            }
        })
        .catch(error => {
            console.error('Error submitting questionnaire:', error);
            alert('Error: Failed to submit questionnaire. Please try again.');
            submitButton.innerHTML = 'Generate Resume';
            submitButton.disabled = false;
        });
    }

    // Convert questionnaire data to resume format expected by the existing submit-resume endpoint
    function convertToResumeFormat(questionnaire) {
        const resumeFormat = {
            name: questionnaire.personalInfo.name,
            email: questionnaire.personalInfo.email,
            phone: questionnaire.personalInfo.phone,
            
            // Store career field
            careerField: questionnaire.careerField,
            
            // Education
            university: questionnaire.education[0]?.university || "",
            universityLocation: questionnaire.personalInfo.location,
            degree: questionnaire.education[0]?.degree || "",
            gpa: questionnaire.education[0]?.gpa || "",
            relevantCourse: questionnaire.education[0]?.relevantCourses || "",
            graduationDate: questionnaire.education[0]?.graduationDate || "",
            
            // Technical skills
            programmingLanguages: questionnaire.skills.technical || "",
            operatingSystems: questionnaire.skills.soft || "",
            
            // Store summary
            summary: questionnaire.summary || "",
            
            // Experience fields as arrays for multiple entries
            companyName: questionnaire.experience.map(exp => exp.companyName),
            position: questionnaire.experience.map(exp => exp.jobTitle),
            location: questionnaire.experience.map(exp => exp.location),
            responsibilities: questionnaire.experience.map(exp => exp.responsibilities),
            startDate: questionnaire.experience.map(exp => exp.dates.split('-')[0]?.trim() || ""),
            endDate: questionnaire.experience.map(exp => exp.dates.split('-')[1]?.trim() || ""),
            
            // Projects
            projectName: questionnaire.projects.map(proj => proj.projectName),
            projectDescription: questionnaire.projects.map(proj => proj.description),
            projectStartDate: questionnaire.projects.map(proj => proj.dates)
        };
        
        return resumeFormat;
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