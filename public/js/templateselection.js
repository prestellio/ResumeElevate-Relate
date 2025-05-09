// public/js/templateselection.js
// Global variables to track templates and current selection
let allTemplates = [];
let currentTemplateIndex = 0;

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
    
    // Set resume ID in the form
    document.getElementById('resumeId-input').value = resumeId;
    
    // Update header with career field
    const headerElement = document.getElementById('career-field-header');
    if (headerElement) {
        headerElement.textContent = `${careerField ? careerField.charAt(0).toUpperCase() + careerField.slice(1) : 'All'} Resume Templates`;
    }
    
    // Set up navigation controls
    setupNavigationControls();
    
    // Function to fetch templates
    async function fetchTemplates() {
        console.log('Fetching templates from API...');
        const templateGrid = document.getElementById('template-grid');
        
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
            templateGrid.innerHTML = '';
            
            // Use the templates returned by the API
            allTemplates = data.templates;
            
            if (allTemplates.length === 0) {
                templateGrid.innerHTML = '<div class="error-message">No templates found. Please try a different career field or contact support.</div>';
                return;
            }
            
            // Log each template for debugging
            allTemplates.forEach(template => {
                console.log(`Creating template element: ${template.id} with URL: ${template.url}`);
            });
            
            // Create template cards in the grid
            allTemplates.forEach((template, index) => {
                const templateCard = document.createElement('div');
                templateCard.className = 'template-item';
                templateCard.dataset.templateId = template.id;
                templateCard.dataset.index = index;
                
                // Mark the first template as selected by default
                if (index === 0) {
                    templateCard.classList.add('selected');
                }
                
                templateCard.innerHTML = `
                    <img src="${template.url}" alt="${template.name}" 
                        onerror="this.onerror=null; this.src='../images/RelateLogo_proto_square.png'; 
                        console.error('Failed to load template image: ${template.url}');">
                    <div class="template-name">
                        <input type="radio" id="${template.id}" name="template-select" 
                            value="${template.id}" ${index === 0 ? 'checked' : ''}>
                        ${template.name}
                    </div>
                `;
                
                // Add click handler for the entire card
                templateCard.addEventListener('click', function() {
                    // Get the index from the dataset
                    const selectedIndex = parseInt(this.dataset.index);
                    selectTemplate(selectedIndex);
                });
                
                templateGrid.appendChild(templateCard);
            });
            
            // Set up form submission
            const templateForm = document.getElementById('template-form');
            
            templateForm.addEventListener('submit', function(event) {
                event.preventDefault();
                
                if (allTemplates.length > 0) {
                    // Set the template value in the hidden input
                    document.getElementById('template-input').value = allTemplates[currentTemplateIndex].id;
                    
                    // Show loading message
                    const continueBtn = document.getElementById('continue-btn');
                    continueBtn.textContent = 'Generating Your Resume...';
                    continueBtn.disabled = true;
                    
                    // Submit the form
                    console.log("Redirecting to editor with template:", allTemplates[currentTemplateIndex].id);
                    this.submit();
                } else {
                    alert('Please select a template first');
                }
            });
            
            // Show the first template by default
            selectTemplate(0);
            
        } catch (error) {
            console.error('Error fetching templates:', error);
            
            // Show a user-friendly error message
            templateGrid.innerHTML = `
                <div class="error-message">
                    <p>Unable to load templates from the server. Using fallback templates instead.</p>
                    <div style="font-size: 0.8rem; color: #ddd; margin-top: 10px;">
                        Technical error: ${error.message}
                    </div>
                </div>
            `;
            
            // Show fallback template selection
            document.getElementById('fallback-selection').style.display = 'block';
        }
    }
    
    // Function to select a template
    function selectTemplate(index) {
        if (index < 0 || index >= allTemplates.length) {
            return;
        }
        
        // Update current index
        currentTemplateIndex = index;
        
        // Update navigation buttons
        updateNavigationButtons();
        
        // Remove selected class from all cards
        document.querySelectorAll('.template-item').forEach(item => {
            item.classList.remove('selected');
        });
        
        // Add selected class to the correct card
        const selectedCard = document.querySelector(`.template-item[data-index="${index}"]`);
        if (selectedCard) {
            selectedCard.classList.add('selected');
            
            // Update the radio button
            const radio = selectedCard.querySelector('input[type="radio"]');
            if (radio) {
                radio.checked = true;
            }
            
            // Scroll the template into view if necessary
            selectedCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
        
        // Update the preview image
        const fullsizeImage = document.getElementById('fullsize-image');
        if (fullsizeImage) {
            fullsizeImage.src = allTemplates[index].url;
            fullsizeImage.alt = allTemplates[index].name;
            
            // Add error handling
            fullsizeImage.onerror = function() {
                this.onerror = null;
                this.src = '../images/RelateLogo_proto_square.png';
                console.error(`Failed to load fullsize image: ${allTemplates[index].url}`);
            };
        }
        
        // Update the template indicator
        const templateIndicator = document.getElementById('template-indicator');
        if (templateIndicator) {
            templateIndicator.textContent = `Template ${index + 1}`;
        }
        
        // Update hidden input
        document.getElementById('template-input').value = allTemplates[index].id;
    }
    
    // Setup navigation controls
    function setupNavigationControls() {
        const prevBtn = document.getElementById('prev-btn');
        const nextBtn = document.getElementById('next-btn');
        
        if (prevBtn) {
            prevBtn.addEventListener('click', function() {
                if (currentTemplateIndex > 0) {
                    selectTemplate(currentTemplateIndex - 1);
                }
            });
        }
        
        if (nextBtn) {
            nextBtn.addEventListener('click', function() {
                if (currentTemplateIndex < allTemplates.length - 1) {
                    selectTemplate(currentTemplateIndex + 1);
                }
            });
        }
    }
    
    // Update navigation buttons based on current template index
    function updateNavigationButtons() {
        const prevBtn = document.getElementById('prev-btn');
        const nextBtn = document.getElementById('next-btn');
        
        if (prevBtn) {
            prevBtn.disabled = currentTemplateIndex === 0;
        }
        
        if (nextBtn) {
            nextBtn.disabled = currentTemplateIndex === allTemplates.length - 1;
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
        
        // Create fallback templates for emergencies
        setupFallbackTemplates();
    }
});

// Setup fallback templates
function setupFallbackTemplates() {
    // Get parameters from URL
    const urlParams = new URLSearchParams(window.location.search);
    const resumeId = urlParams.get('resumeId');
    
    if (!resumeId) {
        console.error('No resumeId provided in URL parameters');
        return;
    }
    
    // Setup fallback templates
    const fallbackTemplates = [
        { id: 'template1', name: 'Classic Professional' },
        { id: 'template2', name: 'Modern Design' },
        { id: 'template3', name: 'Minimal Style' },
        { id: 'template4', name: 'Technical Layout' },
        { id: 'template5', name: 'Creative Resume' }
    ];
    
    const fallbackContainer = document.getElementById('fallback-templates');
    
    if (fallbackContainer) {
        fallbackContainer.innerHTML = ''; // Clear existing content
        
        fallbackTemplates.forEach(template => {
            const button = document.createElement('a');
            button.href = `editor.html?resumeId=${resumeId}&template=${template.id}`;
            button.className = 'fallback-button';
            button.textContent = template.name;
            
            fallbackContainer.appendChild(button);
        });
    }
    
    // Check for template loading issues after 5 seconds
    setTimeout(function() {
        const templateItems = document.querySelectorAll('.template-item');
        const loadingElement = document.querySelector('.loading');
        
        if (templateItems.length === 0 && loadingElement) {
            console.log('No templates loaded after timeout, showing fallback options');
            document.getElementById('fallback-selection').style.display = 'block';
        }
    }, 5000);
}