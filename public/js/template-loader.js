document.addEventListener('DOMContentLoaded', function() {
    // Only run this on the editor page
    if (!document.getElementById('document-editor')) {
        return;
    }
    
    // Get the template parameter from the URL
    const urlParams = new URLSearchParams(window.location.search);
    const templateId = urlParams.get('template');
    const resumeId = urlParams.get('resumeId');
    
    // If a template ID is provided, load that template
    if (templateId) {
        loadTemplateFromGCS(templateId);
    } else {
        console.log('No template specified. Using default editor content.');
    }
    
    /**
     * Loads a template from Google Cloud Storage via API
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
                
                // If there's also a resumeId, we could populate the template with resume data
                if (resumeId) {
                    console.log(`Resume ID: ${resumeId} - Would fetch resume data here in a real app`);
                    // In a real application, you would fetch data and populate the template here
                    populateTemplateWithResumeData(resumeId);
                }
            } else {
                console.error('Editor element not found');
            }
        } catch (error) {
            console.error('Error loading template:', error);
            alert(`Could not load the selected template (${templateId}). Using default template instead.`);
        }
    }
    
    /**
     * Populates the template with data from a specific resume
     * This is a placeholder function that would be implemented in a real app
     * @param {string} resumeId - The ID of the resume to load data from
     */
    async function populateTemplateWithResumeData(resumeId) {
        try {
            // This would be a real API call in a production environment
            const response = await fetch(`/get-resume/${resumeId}`);
            
            if (!response.ok) {
                throw new Error(`Failed to load resume data: ${response.status}`);
            }
            
            const resumeData = await response.json();
            console.log('Resume data loaded:', resumeData);
            
            // Example of populating fields - would need to be customized for your specific templates
            const editor = document.getElementById('document-editor');
            
            // Name
            const nameElement = editor.querySelector('h1');
            if (nameElement && resumeData.name) {
                nameElement.textContent = resumeData.name;
            }
            
            // Contact info
            const contactElement = editor.querySelector('.resume-header p') || editor.querySelector('.resume-header div');
            if (contactElement) {
                if (resumeData.email) {
                    contactElement.innerHTML = contactElement.innerHTML.replace('youremail@example.com', resumeData.email);
                }
                if (resumeData.phone) {
                    contactElement.innerHTML = contactElement.innerHTML.replace('(123) 456-7890', resumeData.phone);
                }
                if (resumeData.location) {
                    contactElement.innerHTML = contactElement.innerHTML.replace('Wichita, Kansas', resumeData.location);
                }
            }
            
            console.log('Resume data loaded and applied successfully');
        } catch (error) {
            console.error('Error loading resume data:', error);
        }
    }
});