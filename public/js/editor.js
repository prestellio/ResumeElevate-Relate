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
            return data.enhancedContent;
            
        } catch (error) {
            console.error('Error getting AI enhancement:', error);
            // Provide a fallback enhancement
            return generateFallbackContent(resumeData, questionnaireData);
        }
    }
    
    // Other helper functions (populateTemplateWithAIContent, generateFallbackContent) 
    // would remain the same as in the previous implementation
});