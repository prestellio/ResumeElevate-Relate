// Enhanced template-loader.js - Loads templates and dynamically populates editor
// with AI-enhanced content from questionnaire data

document.addEventListener('DOMContentLoaded', function() {
    // Only run this on the editor page
    if (!document.getElementById('document-editor')) {
        return;
    }
    
    // Get parameters from the URL
    const urlParams = new URLSearchParams(window.location.search);
    const templateId = urlParams.get('template');
    const resumeId = urlParams.get('resumeId');
    
    // If both template ID and resume ID are provided, load that template with user data
    if (templateId && resumeId) {
        loadTemplateWithResumeData(templateId, resumeId);
    } else if (templateId) {
        // If only template ID is provided, load the template without user data
        loadTemplateFromGCS(templateId);
    } else {
        console.log('No template specified. Using default editor content.');
    }
    
    /**
     * Loads a template and populates it with user resume data and AI enhancements
     * @param {string} templateId - The ID of the template to load
     * @param {string} resumeId - The ID of the resume to load data from
     */
    async function loadTemplateWithResumeData(templateId, resumeId) {
        try {
            console.log(`Loading template ${templateId} with resume data ${resumeId}`);
            
            // Step 1: Fetch the template HTML
            const templateResponse = await fetch(`/api/templates/${templateId}`);
            
            if (!templateResponse.ok) {
                throw new Error(`Failed to load template: ${templateResponse.status}`);
            }
            
            const templateData = await templateResponse.json();
            
            if (!templateData.success || !templateData.content) {
                throw new Error('Invalid template data received');
            }
            
            // Get the HTML content
            const templateHtml = templateData.content;
            
            // Step 2: Fetch the resume data from MongoDB
            const resumeResponse = await fetch(`/get-resume/${resumeId}`);
            
            if (!resumeResponse.ok) {
                throw new Error(`Failed to load resume data: ${resumeResponse.status}`);
            }
            
            const resumeData = await resumeResponse.json();
            console.log('Resume data loaded:', resumeData);
            
            // Step 3: Fetch the questionnaire answers from MongoDB
            let questionnaireData = null;
            try {
                const answerResponse = await fetch(`/api/get-answer-by-resume/${resumeId}`);
                if (answerResponse.ok) {
                    const answerData = await answerResponse.json();
                    if (answerData.success && answerData.answer) {
                        questionnaireData = answerData.answer;
                        console.log('Questionnaire data loaded:', questionnaireData);
                    }
                }
            } catch (error) {
                console.warn('Could not load questionnaire data:', error);
                // Continue without questionnaire data
            }
            
            // Step 4: Use Claude API to enhance the resume content based on user data
            const enhancedContent = await getAIEnhancedContent(resumeData, questionnaireData);
            
            // Step 5: Populate the template with AI-enhanced content
            const populatedTemplate = populateTemplateWithAIContent(templateHtml, resumeData, enhancedContent);
            
            // Step 6: Insert the populated template into the editor
            const editor = document.getElementById('document-editor');
            if (editor) {
                editor.innerHTML = populatedTemplate;
                console.log('Template populated with AI-enhanced content');
                
                // Show success message in the response output
                const responseOutput = document.querySelector('.response-output');
                if (responseOutput) {
                    responseOutput.textContent = "✓ Your resume has been created with AI-enhanced content based on your questionnaire answers. Feel free to make additional edits or ask for specific improvements in the prompt area.";
                }
            } else {
                console.error('Editor element not found');
            }
            
        } catch (error) {
            console.error('Error loading template with user data:', error);
            alert(`Could not load the selected template with your data. Using default template instead.`);
            
            // Fallback to default template
            if (templateId) {
                loadTemplateFromGCS(templateId);
            }
        }
    }
    
    /**
     * Loads a template without user data (fallback)
     * @param {string} templateId - The ID of the template to load
     */
    async function loadTemplateFromGCS(templateId) {
        try {
            console.log(`Attempting to load template ${templateId} from GCS`);
            
            // Fetch the template from our API endpoint
            const response = await fetch(`/api/templates/${templateId}`);
            
            if (!response.ok) {
                throw new Error(`Failed to load template: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('Template data received:', data);
            
            if (!data.success || !data.content) {
                throw new Error('Invalid template data received');
            }
            
            // Get the HTML content
            const templateHtml = data.content;
            
            // Get the editor element
            const editor = document.getElementById('document-editor');
            
            // Insert the template HTML into the editor
            if (editor) {
                editor.innerHTML = templateHtml;
                console.log(`Template '${templateId}' loaded successfully`);
            } else {
                console.error('Editor element not found');
            }
        } catch (error) {
            console.error('Error loading template:', error);
            alert(`Could not load the selected template (${templateId}). Using default template instead.`);
        }
    }
    
    /**
     * Makes an API call to Claude AI to enhance resume content
     * @param {Object} resumeData - The user's resume data from MongoDB
     * @param {Object} questionnaireData - The user's questionnaire answers from MongoDB
     * @returns {Object} Enhanced content for the resume
     */
    async function getAIEnhancedContent(resumeData, questionnaireData) {
        try {
            console.log('Requesting AI enhancement for resume content...');
            
            // Extract enhanced content if it's already stored
            if (resumeData.enhancedContent) {
                try {
                    const parsedContent = JSON.parse(resumeData.enhancedContent);
                    console.log('Using stored enhanced content from resume data');
                    return parsedContent;
                } catch (e) {
                    console.warn('Could not parse stored enhanced content, requesting new enhancement');
                }
            }
            
            // Check session storage for previously enhanced content
            const sessionContent = sessionStorage.getItem('enhancedContent');
            if (sessionContent) {
                try {
                    const parsedContent = JSON.parse(sessionContent);
                    console.log('Using enhanced content from session storage');
                    return parsedContent;
                } catch (e) {
                    console.warn('Could not parse session storage content');
                }
            }
            
            // Combine data from both sources for the AI
            const combinedData = {
                careerField: resumeData.careerField || questionnaireData?.careerField || '',
                personalInfo: {
                    name: resumeData.name || questionnaireData?.personalInfo?.name || '',
                    email: resumeData.email || questionnaireData?.personalInfo?.email || '',
                    phone: resumeData.phone || questionnaireData?.personalInfo?.phone || '',
                    location: questionnaireData?.personalInfo?.location || ''
                },
                education: [{
                    university: resumeData.education?.university || questionnaireData?.education?.[0]?.university || '',
                    degree: resumeData.education?.degree || questionnaireData?.education?.[0]?.degree || '',
                    graduationDate: resumeData.education?.graduationDate || questionnaireData?.education?.[0]?.graduationDate || '',
                    gpa: resumeData.education?.gpa || questionnaireData?.education?.[0]?.gpa || '',
                    relevantCourses: resumeData.education?.relevantCourses || questionnaireData?.education?.[0]?.relevantCourses || ''
                }],
                experience: resumeData.experiences?.map(exp => ({
                    companyName: exp.companyName || '',
                    jobTitle: exp.position || '',
                    location: exp.location || '',
                    dates: `${exp.startDate || ''} - ${exp.endDate || 'Present'}`,
                    responsibilities: exp.responsibilities || ''
                })) || questionnaireData?.experience || [{
                    companyName: '',
                    jobTitle: '',
                    location: '',
                    dates: '',
                    responsibilities: ''
                }],
                projects: resumeData.projects?.map(proj => ({
                    projectName: proj.projectName || '',
                    dates: proj.projectStartDate || '',
                    description: proj.projectDescription || ''
                })) || questionnaireData?.projects || [{
                    projectName: '',
                    dates: '',
                    description: ''
                }],
                skills: {
                    technical: resumeData.technicalSkills?.programmingLanguages || questionnaireData?.skills?.technical || '',
                    soft: resumeData.technicalSkills?.operatingSystems || questionnaireData?.skills?.soft || '',
                    languages: questionnaireData?.skills?.languages || '',
                    certifications: questionnaireData?.skills?.certifications || ''
                },
                summary: resumeData.summary || questionnaireData?.summary || ''
            };
            
            // Make API request to get AI-enhanced content
            const response = await fetch('/api/ai/resume/generate-resume', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(combinedData)
            });
            
            if (!response.ok) {
                throw new Error('Failed to get AI enhancement');
            }
            
            const data = await response.json();
            
            if (!data.success || !data.enhancedContent) {
                throw new Error('Invalid AI response format');
            }
            
            console.log('AI enhanced content received:', data.enhancedContent);
            
            // Store in session storage for future use
            sessionStorage.setItem('enhancedContent', JSON.stringify(data.enhancedContent));
            
            return data.enhancedContent;
            
        } catch (error) {
            console.error('Error getting AI enhancement:', error);
            // Provide a fallback enhancement
            return generateFallbackContent(resumeData, questionnaireData);
        }
    }
    
    /**
     * Generates fallback content if AI enhancement fails
     * @param {Object} resumeData - Resume data from MongoDB
     * @param {Object} questionnaireData - Questionnaire data from MongoDB
     * @returns {Object} Basic enhanced content
     */
    function generateFallbackContent(resumeData, questionnaireData) {
        const careerField = resumeData.careerField || questionnaireData?.careerField || 'professional';
        
        return {
            summary: resumeData.summary || questionnaireData?.summary || 
                `Results-driven ${careerField} with a proven track record of delivering high-quality solutions and driving successful outcomes.`,
            
            education: [{
                university: resumeData.education?.university || questionnaireData?.education?.[0]?.university || "University name",
                degree: resumeData.education?.degree || questionnaireData?.education?.[0]?.degree || "Degree",
                graduationDate: resumeData.education?.graduationDate || questionnaireData?.education?.[0]?.graduationDate || "Graduation date",
                gpa: resumeData.education?.gpa || questionnaireData?.education?.[0]?.gpa || "GPA",
                relevantCourses: resumeData.education?.relevantCourses || questionnaireData?.education?.[0]?.relevantCourses || "Relevant coursework"
            }],
            
            experience: (resumeData.experiences && resumeData.experiences.length > 0) ? 
                resumeData.experiences.map(exp => ({
                    companyName: exp.companyName || "Company name",
                    jobTitle: exp.position || "Position",
                    location: exp.location || "Location",
                    dates: `${exp.startDate || ''} - ${exp.endDate || 'Present'}`,
                    responsibilities: [
                        exp.responsibilities || "Led key initiatives that improved processes and outcomes",
                        "Collaborated with cross-functional teams to achieve objectives",
                        "Implemented innovative solutions to complex problems"
                    ]
                })) : 
                (questionnaireData?.experience) || [{
                    companyName: "Company name",
                    jobTitle: "Position",
                    location: "Location",
                    dates: "Dates",
                    responsibilities: [
                        "Led key initiatives that improved processes and outcomes",
                        "Collaborated with cross-functional teams to achieve objectives",
                        "Implemented innovative solutions to complex problems"
                    ]
                }],
            
            skills: {
                technical: resumeData.technicalSkills?.programmingLanguages ? 
                    resumeData.technicalSkills.programmingLanguages.split(',').map(s => s.trim()) : 
                    (questionnaireData?.skills?.technical ? 
                        questionnaireData.skills.technical.split(',').map(s => s.trim()) : 
                        ["Technical skill 1", "Technical skill 2", "Technical skill 3"]),
                
                soft: resumeData.technicalSkills?.operatingSystems ? 
                    resumeData.technicalSkills.operatingSystems.split(',').map(s => s.trim()) : 
                    (questionnaireData?.skills?.soft ? 
                        questionnaireData.skills.soft.split(',').map(s => s.trim()) : 
                        ["Communication", "Problem-solving", "Teamwork", "Leadership"]),
                
                languages: questionnaireData?.skills?.languages ? 
                    questionnaireData.skills.languages.split(',').map(s => s.trim()) : 
                    [],
                
                certifications: questionnaireData?.skills?.certifications ? 
                    questionnaireData.skills.certifications.split(',').map(s => s.trim()) : 
                    []
            },
            
            projects: (resumeData.projects && resumeData.projects.length > 0) ? 
                resumeData.projects.map(proj => ({
                    projectName: proj.projectName || "Project name",
                    dates: proj.projectStartDate || "Project dates",
                    description: [
                        proj.projectDescription || "Developed solution that addressed key business needs",
                        "Implemented using industry best practices and modern technologies"
                    ]
                })) : 
                (questionnaireData?.projects) || [{
                    projectName: "Project name",
                    dates: "Project dates",
                    description: [
                        "Developed solution that addressed key business needs",
                        "Implemented using industry best practices and modern technologies"
                    ]
                }]
        };
    }
    
    /**
     * Populates a template with AI-enhanced content
     * @param {string} templateHtml - The HTML template
     * @param {Object} resumeData - The user's resume data from MongoDB
     * @param {Object} enhancedContent - The AI-enhanced content
     * @returns {string} The populated HTML
     */
    function populateTemplateWithAIContent(templateHtml, resumeData, enhancedContent) {
        // Create a temporary DOM element to work with the HTML
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = templateHtml;
        
        // Helper function to update text content if element exists
        const updateElementText = (selector, content) => {
            const element = tempDiv.querySelector(selector);
            if (element && content) {
                element.textContent = content;
            }
        };
        
        // Helper function to update HTML content if element exists
        const updateElementHtml = (selector, content) => {
            const element = tempDiv.querySelector(selector);
            if (element && content) {
                element.innerHTML = content;
            }
        };
        
        // Helper function to create list items from array
        const createListItems = (items) => {
            if (!items || !Array.isArray(items)) return '';
            return items.map(item => `<li>${item}</li>`).join('');
        };
        
        // Update personal information
        // Find the name element and update it
        const nameElements = tempDiv.querySelectorAll('h1');
        nameElements.forEach(element => {
            if (element.textContent.toLowerCase().includes('name') || 
                element.textContent.toLowerCase().includes('your') ||
                element.textContent.trim().toUpperCase() === 'YOUR NAME') {
                element.textContent = resumeData.name || enhancedContent.personalInfo?.name || 'Your Name';
            }
        });
        
        // Find and update contact information
        const contactElements = tempDiv.querySelectorAll('p, div');
        contactElements.forEach(element => {
            const text = element.textContent.toLowerCase();
            if (text.includes('email') || text.includes('phone') || text.includes('@') || 
                text.includes('example.com') || text.includes('123-456')) {
                
                // Create contact line with available information
                const email = resumeData.email || '';
                const phone = resumeData.phone || '';
                const location = resumeData.education?.location || '';
                const contactInfo = [email, phone, location].filter(Boolean).join(' | ');
                
                if (contactInfo) {
                    element.textContent = contactInfo;
                }
            }
        });
        
        // Update professional summary
        const summaryElements = tempDiv.querySelectorAll('.resume-section-title, h2');
        summaryElements.forEach(element => {
            if (element.textContent.toLowerCase().includes('summary')) {
                const summaryParent = element.parentElement;
                const summaryParagraph = summaryParent.querySelector('p');
                if (summaryParagraph) {
                    summaryParagraph.textContent = enhancedContent.summary || 
                        resumeData.summary || 
                        'Professional with experience in delivering high-quality results.';
                }
            }
        });
        
        // Update education section
        if (enhancedContent.education && enhancedContent.education.length > 0) {
            const edu = enhancedContent.education[0];
            
            // Find education section
            const educationSections = tempDiv.querySelectorAll('.resume-section, section');
            let educationSection = null;
            
            educationSections.forEach(section => {
                const headings = section.querySelectorAll('h2, .resume-section-title');
                headings.forEach(heading => {
                    if (heading.textContent.toLowerCase().includes('education')) {
                        educationSection = section;
                    }
                });
            });
            
            if (educationSection) {
                // Update university name
                const universityElements = educationSection.querySelectorAll('.resume-item-title, .entry-title, strong');
                universityElements.forEach(element => {
                    if (element.textContent.includes('University') || 
                        element.textContent.includes('School') || 
                        element.textContent.includes('College')) {
                        element.textContent = edu.university;
                    }
                });
                
                // Update degree
                const degreeElements = educationSection.querySelectorAll('.resume-item-subtitle, em');
                degreeElements.forEach(element => {
                    if (element.textContent.includes('Bachelor') || 
                        element.textContent.includes('Degree') || 
                        element.textContent.includes('BS')) {
                        element.textContent = edu.degree;
                    }
                });
                
                // Update graduation date
                const dateElements = educationSection.querySelectorAll('.resume-item-date, span');
                dateElements.forEach(element => {
                    if (element.textContent.includes('Graduation') || 
                        element.textContent.includes('20') || 
                        element.textContent.includes('May')) {
                        element.textContent = `Graduation: ${edu.graduationDate}`;
                    }
                });
                
                // Update GPA if available
                const gpaElements = educationSection.querySelectorAll('div, p');
                gpaElements.forEach(element => {
                    if (element.textContent.includes('GPA')) {
                        element.textContent = `GPA: ${edu.gpa}`;
                    }
                });
                
                // Update relevant courses
                const courseElements = educationSection.querySelectorAll('li');
                courseElements.forEach(element => {
                    if (element.textContent.includes('course') || 
                        element.textContent.includes('Course')) {
                        element.textContent = `Relevant coursework: ${edu.relevantCourses}`;
                    }
                });
            }
        }
        
        // Update experience section
        if (enhancedContent.experience && enhancedContent.experience.length > 0) {
            // Find experience section
            const experienceSections = tempDiv.querySelectorAll('.resume-section, section');
            let experienceSection = null;
            
            experienceSections.forEach(section => {
                const headings = section.querySelectorAll('h2, .resume-section-title');
                headings.forEach(heading => {
                    if (heading.textContent.toLowerCase().includes('experience') || 
                        heading.textContent.toLowerCase().includes('work')) {
                        experienceSection = section;
                    }
                });
            });
            
            if (experienceSection) {
                // Find all experience entries in the template
                const experienceItems = experienceSection.querySelectorAll('.resume-item, .entry');
                
                // If there are more enhanced experiences than template slots, keep only the first one as a template
                if (experienceItems.length > 0 && enhancedContent.experience.length > 0) {
                    const templateItem = experienceItems[0].cloneNode(true);
                    
                    // Clear existing items
                    experienceItems.forEach((item, index) => {
                        if (index > 0) {
                            item.remove();
                        }
                    });
                    
                    // Update the first experience item with the first enhanced experience
                    updateExperienceItem(experienceItems[0], enhancedContent.experience[0]);
                    
                    // Add additional experience items if any
                    for (let i = 1; i < enhancedContent.experience.length; i++) {
                        const newItem = templateItem.cloneNode(true);
                        updateExperienceItem(newItem, enhancedContent.experience[i]);
                        experienceSection.appendChild(newItem);
                    }
                }
            }
        }
        
        // Helper function to update an experience item with enhanced content
        function updateExperienceItem(item, experience) {
            // Update job title
            const titleElements = item.querySelectorAll('.resume-item-title, .entry-title, strong');
            titleElements.forEach(element => {
                if (element.textContent.includes('Developer') || 
                    element.textContent.includes('Engineer') || 
                    element.textContent.includes('Title') || 
                    element.textContent.includes('Position')) {
                    element.textContent = experience.jobTitle;
                }
            });
            
            // Update company and location
            const subtitleElements = item.querySelectorAll('.resume-item-subtitle, em');
            subtitleElements.forEach(element => {
                if (element.textContent.includes('Company') || 
                    element.textContent.includes('ABC') || 
                    element.textContent.includes('XYZ')) {
                    element.textContent = `${experience.companyName}, ${experience.location}`;
                }
            });
            
            // Update dates
            const dateElements = item.querySelectorAll('.resume-item-date, span');
            dateElements.forEach(element => {
                if (element.textContent.includes('20') || 
                    element.textContent.includes('Present') || 
                    element.textContent.includes('Date')) {
                    element.textContent = experience.dates;
                }
            });
            
            // Update responsibilities
            const ulElement = item.querySelector('ul');
            if (ulElement && experience.responsibilities) {
                if (Array.isArray(experience.responsibilities)) {
                    ulElement.innerHTML = createListItems(experience.responsibilities);
                } else {
                    // If it's a string, split by newlines and create list items
                    const items = experience.responsibilities.split('\n').map(item => item.trim()).filter(Boolean);
                    ulElement.innerHTML = createListItems(items);
                }
            }
        }
        
        // Update skills section
        const skillsSections = tempDiv.querySelectorAll('.resume-section, section');
        let skillsSection = null;
        
        skillsSections.forEach(section => {
            const headings = section.querySelectorAll('h2, .resume-section-title');
            headings.forEach(heading => {
                if (heading.textContent.toLowerCase().includes('skill')) {
                    skillsSection = section;
                }
            });
        });
        
        if (skillsSection && enhancedContent.skills) {
            const skillsList = skillsSection.querySelector('ul, p');
            if (skillsList) {
                let skillsHtml = '';
                
                // Function to format skills
                const formatSkills = (skills, label) => {
                    if (!skills || (Array.isArray(skills) && skills.length === 0) || 
                        (typeof skills === 'string' && !skills.trim())) {
                        return '';
                    }
                    
                    let skillsArray = skills;
                    if (typeof skills === 'string') {
                        skillsArray = skills.split(',').map(s => s.trim()).filter(Boolean);
                    }
                    
                    if (Array.isArray(skillsArray) && skillsArray.length > 0) {
                        if (skillsList.tagName === 'UL') {
                            return `<li><strong>${label}:</strong> ${skillsArray.join(', ')}</li>`;
                        } else {
                            return `<strong>${label}:</strong> ${skillsArray.join(', ')}. `;
                        }
                    }
                    return '';
                };
                
                // Add technical skills
                skillsHtml += formatSkills(enhancedContent.skills.technical, 'Technical Skills');
                
                // Add soft skills
                skillsHtml += formatSkills(enhancedContent.skills.soft, 'Soft Skills');
                
                // Add languages if available
                skillsHtml += formatSkills(enhancedContent.skills.languages, 'Languages');
                
                // Add certifications if available
                skillsHtml += formatSkills(enhancedContent.skills.certifications, 'Certifications');
                
                if (skillsHtml) {
                    if (skillsList.tagName === 'UL') {
                        skillsList.innerHTML = skillsHtml;
                    } else {
                        skillsList.innerHTML = skillsHtml;
                    }
                }
            }
        }
        
        // Update projects section
        if (enhancedContent.projects && enhancedContent.projects.length > 0) {
            const projectsSections = tempDiv.querySelectorAll('.resume-section, section');
            let projectsSection = null;
            
            projectsSections.forEach(section => {
                const headings = section.querySelectorAll('h2, .resume-section-title');
                headings.forEach(heading => {
                    if (heading.textContent.toLowerCase().includes('project')) {
                        projectsSection = section;
                    }
                });
            });
            
            if (projectsSection) {
                const projectItems = projectsSection.querySelectorAll('.resume-item, .entry');
                
                // If there are more enhanced projects than template slots, keep only the first one as a template
                if (projectItems.length > 0 && enhancedContent.projects.length > 0) {
                    const templateItem = projectItems[0].cloneNode(true);
                    
                    // Clear existing items
                    projectItems.forEach((item, index) => {
                        if (index > 0) {
                            item.remove();
                        }
                    });
                    
                    // Update the first project item with the first enhanced project
                    updateProjectItem(projectItems[0], enhancedContent.projects[0]);
                    
                    // Add additional project items if any
                    for (let i = 1; i < enhancedContent.projects.length; i++) {
                        const newItem = templateItem.cloneNode(true);
                        updateProjectItem(newItem, enhancedContent.projects[i]);
                        projectsSection.appendChild(newItem);
                    }
                }
            }
        }
        
        // Helper function to update a project item with enhanced content
        function updateProjectItem(item, project) {
            // Update project name
            const titleElements = item.querySelectorAll('.resume-item-title, .entry-title, strong');
            titleElements.forEach(element => {
                if (element.textContent.includes('Project') || 
                    element.textContent.includes('Website') || 
                    element.textContent.includes('Application')) {
                    element.textContent = project.projectName;
                }
            });
            
            // Update dates
            const dateElements = item.querySelectorAll('.resume-item-date, span');
            dateElements.forEach(element => {
                if (element.textContent.includes('20') || 
                    element.textContent.includes('Fall') || 
                    element.textContent.includes('Spring')) {
                    element.textContent = project.dates;
                }
            });
            
            // Update description
            const ulElement = item.querySelector('ul');
            if (ulElement && project.description) {
                if (Array.isArray(project.description)) {
                    ulElement.innerHTML = createListItems(project.description);
                } else {
                    // If it's a string, split by newlines and create list items
                    const items = project.description.split('\n').map(item => item.trim()).filter(Boolean);
                    ulElement.innerHTML = createListItems(items);
                }
            }
        }
        
        return tempDiv.innerHTML;
    }
});