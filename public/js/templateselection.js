function initTemplateSelection() {
    // Configuration
    const apiEndpoint = '/api/templates'; // The endpoint we've defined in routes/templateRoutes.js
    
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
    
    // Function to fetch templates
    async function fetchTemplates() {
        const templateList = document.getElementById('template-select-ul');
        
        if (templateList) {
            templateList.innerHTML = '<div class="loading">Loading templates...</div>';
        }
        
        try {
            // Fetch templates from our backend API
            const response = await fetch(apiEndpoint);
            
            if (!response.ok) {
                throw new Error(`API responded with status: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('Template data received:', data);
            
            if (!data.success || !data.templates || !Array.isArray(data.templates)) {
                throw new Error('Invalid response format from API');
            }
            
            // Filter templates based on career field if specified
            let filteredTemplates = data.templates;
            
            if (careerField) {
                // Filter templates by career field
                filteredTemplates = data.templates.filter(template => {
                    const templateName = template.name.toLowerCase();
                    const templateId = template.id.toLowerCase();
                    return templateName.includes(careerField.toLowerCase()) || 
                           templateId.includes(careerField.toLowerCase()) ||
                           templateId.includes('general') || 
                           true; // Show all templates for now
                });
            }
            
            // Create template options from the filtered templates
            if (filteredTemplates.length === 0) {
                if (templateList) {
                    templateList.innerHTML = '<p>No templates found for this career field. Please select from our general templates:</p>';
                }
                // If no templates match the filter, show all templates
                filteredTemplates = data.templates;
            }
            
            // Call our new function to create template items
            createTemplateItems(filteredTemplates);
            
            // Create a form for proper redirection
            const redirectForm = document.createElement('form');
            redirectForm.action = 'editor.html';
            redirectForm.method = 'GET';
            redirectForm.className = 'redirect-form';
            
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
            
            // Add the form to the page - putting it outside the scrollable area
            const asideElement = document.querySelector('aside');
            if (asideElement) {
                asideElement.appendChild(redirectForm);
            }
            
            // Show the first template by default if any exist
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
            const templateList = document.getElementById('template-select-ul');
            if (templateList) {
                templateList.innerHTML = `<p>Error loading templates: ${error.message}. Please try again later.</p>`;
            }
        }
    }
    
    // Function to create template items with proper structure for scrolling
    function createTemplateItems(templates) {
        const templateGrid = document.getElementById('template-select-ul');
        
        if (templateGrid) {
            // Clear previous content including loading message
            templateGrid.innerHTML = '';
            
            // Add header for the templates
            const headerElement = document.createElement('h2');
            headerElement.className = 'template-header';
            headerElement.textContent = `${careerField ? careerField.charAt(0).toUpperCase() + careerField.slice(1) : 'All'} Resume Templates`;
            
            // Make sure the templateGrid has the right class for scrolling
            templateGrid.className = 'template-grid';
            
            templates.forEach(template => {
                const templateCard = document.createElement('div');
                templateCard.className = 'template-card';
                
                templateCard.innerHTML = `
                    <label>
                        <img src="${template.url}" alt="${template.name}" class="preview-image" data-fullsize="${template.url}" data-html-url="${template.htmlUrl || ''}" data-template-id="${template.id}">
                        <div class="template-name">${template.name}</div>
                        <input type="radio" id="${template.id}" name="template-select" value="${template.id}" data-resume-id="${resumeId}">
                    </label>
                `;
                
                templateGrid.appendChild(templateCard);
            });
            
            // Add click events to all template thumbnails
            document.querySelectorAll('.preview-image').forEach(img => {
                img.addEventListener('click', function() {
                    const fullsizeUrl = this.dataset.fullsize;
                    const templateName = this.alt;
                    const templateId = this.dataset.templateId;
                    
                    showFullsizeTemplate(fullsizeUrl, templateName);
                    
                    // Also select the radio button
                    const radioBtn = this.nextElementSibling.nextElementSibling;
                    if (radioBtn) {
                        radioBtn.checked = true;
                    }
                });
            });
            
            // Add navigation controls if needed
            setupNavigationControls();
        }
    }

    // Function to set up navigation controls
    function setupNavigationControls() {
        // Create navigation controls
        const controls = document.createElement('div');
        controls.className = 'template-nav-controls';
        controls.innerHTML = `
            <button id="prev-template" class="nav-btn">← Previous</button>
            <button id="next-template" class="nav-btn">Next →</button>
        `;
        
        const asideElement = document.querySelector('aside');
        if (asideElement) {
            // Insert before the redirect form if it exists
            const redirectForm = asideElement.querySelector('.redirect-form');
            if (redirectForm) {
                asideElement.insertBefore(controls, redirectForm);
            } else {
                asideElement.appendChild(controls);
            }
        }
        
        // Add event listeners
        let currentIndex = 0;
        const templates = document.querySelectorAll('.template-card');
        
        document.getElementById('prev-template').addEventListener('click', () => {
            if (currentIndex > 0) {
                currentIndex--;
                templates[currentIndex].querySelector('.preview-image').click();
                templates[currentIndex].scrollIntoView({ behavior: 'smooth' });
            }
        });
        
        document.getElementById('next-template').addEventListener('click', () => {
            if (currentIndex < templates.length - 1) {
                currentIndex++;
                templates[currentIndex].querySelector('.preview-image').click();
                templates[currentIndex].scrollIntoView({ behavior: 'smooth' });
            }
        });
    }
    
    // Function to display fullsize template
    function showFullsizeTemplate(imageUrl, imageName) {
        const fullsizeContainer = document.getElementById('fullsizeContainer');
        
        if (fullsizeContainer) {
            fullsizeContainer.innerHTML = `
                <img src="${imageUrl}" alt="${imageName}" id="fullsizeImage" class="fullsize-image">
                <div class="image-title">${imageName}</div>
            `;
        }
    }
    
    // Initial load of template images
    fetchTemplates();
}

// Initialize event listeners
document.addEventListener('DOMContentLoaded', function() {
    // Template selection page initialization
    if (window.location.pathname.includes('templateselection.html')) {
        initTemplateSelection();
        
        // Add necessary CSS for scrolling if not already in the stylesheet
        const style = document.createElement('style');
        style.textContent = `
            .template-grid {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 20px;
                max-height: 70vh;
                overflow-y: auto;
                padding: 20px;
                scrollbar-width: thin;
            }
            
            .template-grid::-webkit-scrollbar {
                width: 8px;
            }
            
            .template-grid::-webkit-scrollbar-track {
                background: rgba(0, 0, 0, 0.1);
                border-radius: 10px;
            }
            
            .template-grid::-webkit-scrollbar-thumb {
                background: rgba(0, 0, 0, 0.3);
                border-radius: 10px;
            }
            
            .template-grid::-webkit-scrollbar-thumb:hover {
                background: rgba(0, 0, 0, 0.5);
            }
            
            .template-card {
                background: white;
                border: 1px solid #ddd;
                border-radius: 5px;
                padding: 10px;
                text-align: center;
                transition: transform 0.2s, box-shadow 0.2s;
            }
            
            .template-card:hover {
                transform: translateY(-5px);
                box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
            }
            
            .template-card img {
                width: 100%;
                height: auto;
                border: 1px solid #eee;
                margin-bottom: 10px;
            }
            
            .template-name {
                font-weight: bold;
                margin-bottom: 5px;
            }
            
            .template-nav-controls {
                display: flex;
                justify-content: space-between;
                padding: 10px 20px;
                margin-top: 10px;
            }
            
            .nav-btn {
                background: #225bb2;
                color: white;
                border: none;
                padding: 8px 15px;
                border-radius: 5px;
                cursor: pointer;
                transition: background 0.2s;
            }
            
            .nav-btn:hover {
                background: #1a4585;
            }
            
            .redirect-form {
                margin: 20px 0;
                text-align: center;
            }
            
            .continue-btn {
                background-color: #225bb2;
                color: white;
                border: none;
                padding: 12px 25px;
                font-size: 1.2rem;
                border-radius: 10px;
                cursor: pointer;
                transition: background 0.3s ease;
                width: 80%;
                max-width: 300px;
            }
            
            .continue-btn:hover {
                background-color: #1a4585;
            }
        `;
        document.head.appendChild(style);
    }
});