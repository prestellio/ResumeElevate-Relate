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

// Initialize event listeners for editor page
document.addEventListener('DOMContentLoaded', function() {
    // Editor page - Load resume data if the page is editor.html
    if (window.location.pathname.includes('editor.html')) {
        loadResumeData();
    }
});