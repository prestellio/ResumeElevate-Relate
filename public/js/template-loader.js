// Enhanced template-loader.js - Dynamically loads resume templates with AI-enhanced content

document.addEventListener('DOMContentLoaded', function() {
    // Only run this on the editor page
    if (!document.getElementById('document-editor')) {
        return;
    }
    
    // Get parameters from the URL
    const urlParams = new URLSearchParams(window.location.search);
    const templateId = urlParams.get('template');
    const resumeId = urlParams.get('resumeId');
    
    // If a template ID is provided, load that template
    if (templateId) {
        loadTemplateWithUserData(templateId, resumeId);
    } else {
        console.log('No template specified. Using default editor content.');
    }
    
    /**
     * Loads a template and populates it with user data
     * @param {string} templateId - The ID of the template to load
     * @param {string} resumeId - The ID of the resume data to use for populating the template
     */
    async function loadTemplateWithUserData(templateId, resumeId) {
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
            
            // Step 2: Fetch the resume data
            if (!resumeId) {
                console.error('No resume ID provided - cannot load user data');
                loadTemplateWithoutData(templateHtml);
                return;
            }
            
            const resumeResponse = await fetch(`/get-resume/${resumeId}`);
            
            if (!resumeResponse.ok) {
                throw new Error(`Failed to load resume data: ${resumeResponse.status}`);
            }
            
            const resumeData = await resumeResponse.json();
            console.log('Resume data loaded:', resumeData);
            
            // Step 3: Fetch the matching questionnaire data if available
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
            
            // Step 4: Use Claude API to enhance the resume content
            const enhancedContent = await getAIEnhancedContent(resumeData, questionnaireData);
            
            // Step 5: Populate the template with enhanced data
            const populatedTemplate = populateTemplateWithAIContent(templateHtml, resumeData, enhancedContent);
            
            // Step 6: Insert the populated template into the editor
            const editor = document.getElementById('document-editor');
            if (editor) {
                editor.innerHTML = populatedTemplate;
                console.log('Template populated with AI-enhanced content');
                
                // Show success message in the response output
                const responseOutput = document.querySelector('.response-output');
                if (responseOutput) {
                    responseOutput.textContent = "✓ Your resume has been created with AI-enhanced content. Feel free to make additional edits or ask for specific improvements in the prompt area.";
                }
            } else {
                console.error('Editor element not found');
            }
            
        } catch (error) {
            console.error('Error loading template with user data:', error);
            alert(`Could not load the selected template with your data. Using default template instead.`);
            
            // Fallback to default template
            const editor = document.getElementById('document-editor');
            if (editor) {
                // Keep the default content
                console.log('Using default template content');
            }
        }
    }
    
    /**
     * Loads a template without user data (fallback)
     * @param {string} templateHtml - The HTML content of the template
     */
    function loadTemplateWithoutData(templateHtml) {
        const editor = document.getElementById('document-editor');
        if (editor) {
            editor.innerHTML = templateHtml;
            console.log('Template loaded without user data');
        }
    }
    
    /**
     * Makes an API call to get AI-enhanced resume content
     * @param {Object} resumeData - The user's resume data
     * @param {Object} questionnaireData - The user's questionnaire answers
     * @returns {Object} Enhanced content for the resume
     */
    async function getAIEnhancedContent(resumeData, questionnaireData) {
        try {
            console.log('Requesting AI enhancement for resume content...');
            
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
            
            // Make API request to the AI enhancement endpoint
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
            return data.enhancedContent;
            
        } catch (error) {
            console.error('Error getting AI enhancement:', error);
            // Return a default enhancement object
            return {
                summary: resumeData.summary || "Professional with experience in the industry.",
                education: [{
                    university: resumeData.education?.university || "University name",
                    degree: resumeData.education?.degree || "Degree",
                    graduationDate: resumeData.education?.graduationDate || "Graduation date",
                    gpa: resumeData.education?.gpa || "GPA",
                    relevantCourses: resumeData.education?.relevantCourses || "Relevant courses"
                }],
                experience: resumeData.experiences?.map(exp => ({
                    companyName: exp.companyName || "Company name",
                    jobTitle: exp.position || "Position",
                    location: exp.location || "Location",
                    dates: `${exp.startDate || ''} - ${exp.endDate || 'Present'}`,
                    responsibilities: [exp.responsibilities || "Responsibilities"]
                })) || [{
                    companyName: "Company name",
                    jobTitle: "Position",
                    location: "Location",
                    dates: "Dates",
                    responsibilities: ["Responsibilities"]
                }],
                skills: {
                    technical: [resumeData.technicalSkills?.programmingLanguages || "Technical skills"],
                    soft: [resumeData.technicalSkills?.operatingSystems || "Soft skills"],
                    languages: [""],
                    certifications: [""]
                },
                projects: resumeData.projects?.map(proj => ({
                    projectName: proj.projectName || "Project name",
                    dates: proj.projectStartDate || "Dates",
                    description: [proj.projectDescription || "Project description"]
                })) || [{
                    projectName: "Project name",
                    dates: "Dates",
                    description: ["Project description"]
                }]
            };
        }
    }
    
    /**
     * Populates a template with AI-enhanced content
     * @param {string} templateHtml - The HTML template
     * @param {Object} userData - The user's original data
     * @param {Object} enhancedContent - The AI-enhanced content
     * @returns {string} The populated HTML
     */
    function populateTemplateWithAIContent(templateHtml, userData, enhancedContent) {
        let populatedHtml = templateHtml;
        
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
        updateElementText('h1', userData.name || enhancedContent.personalInfo?.name || 'Your Name');
        
        // Create contact line with available information
        const email = userData.email || '';
        const phone = userData.phone || '';
        const location = userData.education?.location || '';
        const contactLine = [email, phone, location].filter(Boolean).join(' | ');
        updateElementText('.resume-header p, header p', contactLine);
        
        // Update professional summary
        const summaryElement = tempDiv.querySelector('.resume-section-title, h2');
        if (summaryElement && summaryElement.textContent.toLowerCase().includes('summary')) {
            const summaryParent = summaryElement.parentElement;
            const summaryParagraph = summaryParent.querySelector('p');
            if (summaryParagraph) {
                summaryParagraph.textContent = enhancedContent.summary || userData.summary || 'Professional with experience in delivering high-quality results.';
            }
        }
        
        // Update education section
        if (enhancedContent.education && enhancedContent.education.length > 0) {
            const edu = enhancedContent.education[0];
            updateElementText('.resume-item-title, .entry-title', edu.university);
            
            // Find the degree element and update it
            const degreeElements = tempDiv.querySelectorAll('.resume-item-subtitle');
            degreeElements.forEach(element => {
                if (element.textContent.includes('Bachelor') || element.textContent.includes('Degree')) {
                    element.textContent = edu.degree;
                }
            });
            
            // Update graduation date
            const dateElements = tempDiv.querySelectorAll('.resume-item-date');
            dateElements.forEach(element => {
                if (element.textContent.includes('Graduation') || element.textContent.includes('20')) {
                    element.textContent = `Graduation: ${edu.graduationDate}`;
                }
            });
            
            // Update GPA if available
            const gpaElements = tempDiv.querySelectorAll('.resume-item div');
            gpaElements.forEach(element => {
                if (element.textContent.includes('GPA')) {
                    element.textContent = `GPA: ${edu.gpa}`;
                }
            });
        }
        
        // Update experience section
        if (enhancedContent.experience && enhancedContent.experience.length > 0) {
            // Find all experience entries in the template
            const experienceItems = tempDiv.querySelectorAll('.resume-section');
            let experienceSection = null;
            
            experienceItems.forEach(section => {
                const title = section.querySelector('.resume-section-title');
                if (title && (title.textContent.includes('Experience') || title.textContent.includes('Work'))) {
                    experienceSection = section;
                }
            });
            
            if (experienceSection) {
                // Clear existing experience items
                const existingItems = experienceSection.querySelectorAll('.resume-item');
                
                // If there are more enhanced experiences than template slots, keep only the first one as a template
                if (existingItems.length > 0 && enhancedContent.experience.length > 0) {
                    const templateItem = existingItems[0].cloneNode(true);
                    
                    // Clear existing items
                    existingItems.forEach(item => item.remove());
                    
                    // Add enhanced experiences
                    enhancedContent.experience.forEach(exp => {
                        const newItem = templateItem.cloneNode(true);
                        
                        // Update job title
                        const titleElement = newItem.querySelector('.resume-item-title');
                        if (titleElement) {
                            titleElement.textContent = exp.jobTitle;
                        }
                        
                        // Update company and location
                        const subtitleElement = newItem.querySelector('.resume-item-subtitle');
                        if (subtitleElement) {
                            subtitleElement.textContent = `${exp.companyName}, ${exp.location}`;
                        }
                        
                        // Update dates
                        const dateElement = newItem.querySelector('.resume-item-date');
                        if (dateElement) {
                            dateElement.textContent = exp.dates;
                        }
                        
                        // Update responsibilities
                        const ulElement = newItem.querySelector('ul');
                        if (ulElement && exp.responsibilities) {
                            if (Array.isArray(exp.responsibilities)) {
                                ulElement.innerHTML = createListItems(exp.responsibilities);
                            } else {
                                // If it's a string, split by newlines and create list items
                                const items = exp.responsibilities.split('\n').map(item => item.trim()).filter(Boolean);
                                ulElement.innerHTML = createListItems(items);
                            }
                        }
                        
                        experienceSection.appendChild(newItem);
                    });
                }
            }
        }
        
        // Update skills section
        const skillsSection = Array.from(tempDiv.querySelectorAll('.resume-section')).find(section => {
            const title = section.querySelector('.resume-section-title');
            return title && title.textContent.includes('Skills');
        });
        
        if (skillsSection && enhancedContent.skills) {
            const skillsList = skillsSection.querySelector('ul');
            if (skillsList) {
                let skillsHtml = '';
                
                // Add technical skills
                if (enhancedContent.skills.technical && enhancedContent.skills.technical.length > 0) {
                    let technicalSkills = enhancedContent.skills.technical;
                    if (typeof technicalSkills === 'string') {
                        technicalSkills = [technicalSkills];
                    }
                    skillsHtml += `<li><strong>Programming:</strong> ${technicalSkills.join(', ')}</li>`;
                }
                
                // Add soft skills
                if (enhancedContent.skills.soft && enhancedContent.skills.soft.length > 0) {
                    let softSkills = enhancedContent.skills.soft;
                    if (typeof softSkills === 'string') {
                        softSkills = [softSkills];
                    }
                    skillsHtml += `<li><strong>Soft Skills:</strong> ${softSkills.join(', ')}</li>`;
                }
                
                // Add languages if available
                if (enhancedContent.skills.languages && enhancedContent.skills.languages.length > 0 && 
                    enhancedContent.skills.languages[0] !== '') {
                    let languages = enhancedContent.skills.languages;
                    if (typeof languages === 'string') {
                        languages = [languages];
                    }
                    skillsHtml += `<li><strong>Languages:</strong> ${languages.join(', ')}</li>`;
                }
                
                // Add certifications if available
                if (enhancedContent.skills.certifications && enhancedContent.skills.certifications.length > 0 && 
                    enhancedContent.skills.certifications[0] !== '') {
                    let certifications = enhancedContent.skills.certifications;
                    if (typeof certifications === 'string') {
                        certifications = [certifications];
                    }
                    skillsHtml += `<li><strong>Certifications:</strong> ${certifications.join(', ')}</li>`;
                }
                
                if (skillsHtml) {
                    skillsList.innerHTML = skillsHtml;
                }
            }
        }
        
        // Update projects section
        if (enhancedContent.projects && enhancedContent.projects.length > 0) {
            const projectsSection = Array.from(tempDiv.querySelectorAll('.resume-section')).find(section => {
                const title = section.querySelector('.resume-section-title');
                return title && title.textContent.includes('Project');
            });
            
            if (projectsSection) {
                const projectItems = projectsSection.querySelectorAll('.resume-item');
                
                // If there are more enhanced projects than template slots, keep only the first one as a template
                if (projectItems.length > 0 && enhancedContent.projects.length > 0) {
                    const templateItem = projectItems[0].cloneNode(true);
                    
                    // Clear existing items
                    projectItems.forEach(item => item.remove());
                    
                    // Add enhanced projects
                    enhancedContent.projects.forEach(project => {
                        const newItem = templateItem.cloneNode(true);
                        
                        // Update project name
                        const titleElement = newItem.querySelector('.resume-item-title');
                        if (titleElement) {
                            titleElement.textContent = project.projectName;
                        }
                        
                        // Update dates
                        const dateElement = newItem.querySelector('.resume-item-date');
                        if (dateElement) {
                            dateElement.textContent = project.dates;
                        }
                        
                        // Update description
                        const ulElement = newItem.querySelector('ul');
                        if (ulElement && project.description) {
                            if (Array.isArray(project.description)) {
                                ulElement.innerHTML = createListItems(project.description);
                            } else {
                                // If it's a string, split by newlines and create list items
                                const items = project.description.split('\n').map(item => item.trim()).filter(Boolean);
                                ulElement.innerHTML = createListItems(items);
                            }
                        }
                        
                        projectsSection.appendChild(newItem);
                    });
                }
            }
        }
        
        return tempDiv.innerHTML;
    }
});