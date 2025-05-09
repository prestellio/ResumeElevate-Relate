// public/js/templateselection.js
function initTemplateSelection() {
    // Configuration
    const apiEndpoint = '/api/templates';
    
    // Get parameters from URL
    const urlParams = new URLSearchParams(window.location.search);
    const careerField = urlParams.get('career') || '';
    const resumeId = urlParams.get('resumeId') || '';
    
    if (!resumeId) {
        console.error('No resumeId provided in URL parameters');
        alert('Error: No resume ID provided. Please complete the questionnaire first.');
        window.location.href = 'questionnaire.html';
        return;
    }
    
    // Add career field as a header
    const headerElement = document.createElement('h2');
    headerElement.className = 'template-header';
    headerElement.textContent = `${careerField ? careerField.charAt(0).toUpperCase() + careerField.slice(1) : 'All'} Resume Templates`;
    
    const templateList = document.getElementById('template-select-ul');
    if (templateList) {
        templateList.parentNode.insertBefore(headerElement, templateList);
    }
    
    // Function to fetch templates
    async function fetchTemplates() {
        console.log('Fetching templates from API...');
        if (templateList) {
            templateList.innerHTML = '<div class="loading">Loading templates...</div>';
        }
        
        try {
            // Fetch templates from our backend API
            console.log(`Requesting templates from ${apiEndpoint}`);
            const response = await fetch(apiEndpoint);
            
            if (!response.ok) {
                throw new Error(`API responded with status: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('Template data received:', data);
            
            if (!data.success || !data.templates || !Array.isArray(data.templates)) {
                throw new Error('Invalid response format from API');
            }
            
            // Remove loading message
            if (templateList) {
                templateList.innerHTML = '';
            }
            
            // Use the templates returned by the API
            const templates = data.templates;
            
            if (templates.length === 0) {
                if (templateList) {
                    templateList.innerHTML = '<p>No templates found. Please try a different career field or contact support.</p>';
                }
                return;
            }
            
            // Log each template for debugging
            templates.forEach(template => {
                console.log(`Creating template element: ${template.id} with URL: ${template.url}`);
            });
            
            if (templateList) {
                templates.forEach(template => {
                    const listItem = document.createElement('li');
                    
                    // Create a template card with image and radio button
                    listItem.innerHTML = `
                        <label>
                            <img src="${template.url}" alt="${template.name}" class="preview-image" data-template-id="${template.id}" onerror="this.onerror=null; this.src='../images/RelateLogo_proto_square.png'; console.error('Failed to load template image: ${template.url}');">
                            <input type="radio" id="${template.id}" name="template-select" value="${template.id}" data-resume-id="${resumeId}">
                            <span>${template.name}</span>
                        </label>
                    `;
                    
                    templateList.appendChild(listItem);
                });
            }
            
            // Add click events to all template thumbnails
            document.querySelectorAll('.preview-image').forEach(img => {
                img.addEventListener('click', function() {
                    const templateId = this.dataset.templateId;
                    showFullsizeTemplate(this.src, this.alt);
                    
                    // Also select the radio button
                    const radioBtn = document.querySelector(`input[value="${templateId}"]`);
                    if (radioBtn) {
                        radioBtn.checked = true;
                    }
                });
                
                // Add load event listener for debugging
                img.addEventListener('load', function() {
                    console.log(`Successfully loaded image: ${this.src}`);
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
            continueButton.textContent = 'Use Selected Template';
            
            // Add form submit handler 
            redirectForm.addEventListener('submit', function(event) {
                const selectedTemplate = document.querySelector('input[name="template-select"]:checked');
                if (selectedTemplate) {
                    // Set the template value in the hidden input
                    document.getElementById('template-input').value = selectedTemplate.value;
                    
                    // Show loading message
                    continueButton.textContent = 'Generating Your Resume...';
                    continueButton.disabled = true;
                    
                    // Let the form submit naturally to editor.html
                    console.log("Redirecting to editor with template:", selectedTemplate.value);
                } else {
                    event.preventDefault();
                    alert('Please select a template first');
                }
            });
            
            // Add button to form
            redirectForm.appendChild(continueButton);
            
            // Add the form to the page
            if (templateList) {
                templateList.parentNode.appendChild(redirectForm);
            }
            
            // Show the first template by default if any exist
            if (templates.length > 0) {
                const firstTemplate = templates[0];
                showFullsizeTemplate(firstTemplate.url, firstTemplate.name);
                
                // Select the first radio button
                const firstRadio = document.querySelector('input[name="template-select"]');
                if (firstRadio) {
                    firstRadio.checked = true;
                }
            }
            
        } catch (error) {
            console.error('Error fetching templates:', error);
            
            // Show a user-friendly error message
            if (templateList) {
                templateList.innerHTML = `
                    <p>Unable to load templates from the cloud. Using fallback templates instead.</p>
                    <div id="template-error-info" style="color: #666; font-size: 0.9rem; margin-top: 10px;">
                        Technical error: ${error.message}
                    </div>
                `;
            }
            
            // Show fallback template selection
            document.getElementById('fallback-selection').style.display = 'block';
        }
    }
    
    // Function to display fullsize template
    function showFullsizeTemplate(imageUrl, imageName) {
        console.log(`Showing fullsize template: ${imageUrl}`);
        const fullsizeContainer = document.getElementById('fullsizeContainer');
        
        if (fullsizeContainer) {
            fullsizeContainer.innerHTML = `
                <img src="${imageUrl}" alt="${imageName}" id="fullsizeImage" class="fullsize-image" onerror="this.onerror=null; this.src='../images/RelateLogo_proto_square.png'; console.error('Failed to load fullsize image: ${imageUrl}');">
                <div class="image-title">${imageName}</div>
            `;
        }
    }
    
    // Initial load of template images
    fetchTemplates();
}

// Initialize event listeners
document.addEventListener('DOMContentLoaded', function() {
    console.log('Template selection page loaded');
    
    // Template selection page initialization
    if (window.location.pathname.includes('templateselection.html')) {
        console.log('Initializing template selection...');
        initTemplateSelection();
        
        // Ensure fallback section is hidden initially
        const fallbackSection = document.getElementById('fallback-selection');
        if (fallbackSection) {
            fallbackSection.style.display = 'none';
        }
    }
});