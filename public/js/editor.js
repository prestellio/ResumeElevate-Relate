/**
 * Document Editor with Template Support
 * 
 * This file contains the functionality for the document editor with templates.
 * It handles template application, formatting, word counting, and other editor features.
 */

document.addEventListener('DOMContentLoaded', function() {
    const editor = document.getElementById('document-editor');
    const wordCount = document.getElementById('word-count');
    const currentTemplate = document.getElementById('current-template');
    const fontSizeSelect = document.getElementById('font-size');
    
    // Initialize - if the page contains the editor elements
    if (editor && fontSizeSelect) {
        initializeEditor();
    }
    
    // Initialize the editor functionality
    function initializeEditor() {
        // Format buttons
        document.querySelectorAll('.format-button').forEach(button => {
            button.addEventListener('click', function() {
                const command = this.dataset.command;
                const value = this.dataset.value || null;
                
                if (command) {
                    document.execCommand(command, false, value);
                    editor.focus();
                }
            });
        });
        
        // Font size change
        fontSizeSelect.addEventListener('change', function() {
            document.execCommand('fontSize', false, this.value);
            editor.focus();
        });
        
        // Word count
        editor.addEventListener('input', function() {
            calculateWordCount();
        });
        
        // Template application
        document.querySelectorAll('.template-item').forEach(item => {
            item.addEventListener('click', function() {
                const templateName = this.dataset.template;
                applyTemplate(templateName);
                currentTemplate.textContent = this.querySelector('.template-name').textContent;
            });
        });
        
        // New document button
        document.getElementById('new-doc').addEventListener('click', function() {
            if (confirm('Start a new document? Any unsaved changes will be lost.')) {
                editor.innerHTML = '<h1>New Document</h1><p>Start typing here...</p>';
                applyTemplate('default');
                currentTemplate.textContent = 'Default';
                calculateWordCount();
            }
        });

        // Save document button (placeholder for now)
        const saveButton = document.getElementById('save-doc');
        if (saveButton) {
            saveButton.addEventListener('click', function() {
                saveDocument();
            });
        }

        // Open document button (placeholder for now)
        const openButton = document.getElementById('open-doc');
        if (openButton) {
            openButton.addEventListener('click', function() {
                openDocument();
            });
        }
        
        // Initial word count
        calculateWordCount();
    }
    
    // Calculate word count in the document
    function calculateWordCount() {
        const text = editor.innerText || '';
        const words = text.trim().split(/\s+/).filter(word => word !== '');
        wordCount.textContent = words.length;
    }
    
    // Apply a template to the document
    function applyTemplate(templateName) {
        // Remove previous template classes
        editor.classList.remove('template-business', 'template-creative', 'template-modern');
        
        // Clear any existing template elements
        const existingHeaders = editor.querySelectorAll('.template-header');
        const existingSections = editor.querySelectorAll('.template-section');
        const existingFooters = editor.querySelectorAll('.template-footer');
        
        existingHeaders.forEach(el => {
            const content = el.innerHTML;
            const newEl = document.createElement('div');
            newEl.innerHTML = content;
            el.parentNode.replaceChild(newEl, el);
        });
        
        existingSections.forEach(el => {
            const content = el.innerHTML;
            const newEl = document.createElement('div');
            newEl.innerHTML = content;
            el.parentNode.replaceChild(newEl, el);
        });
        
        existingFooters.forEach(el => {
            const content = el.innerHTML;
            const newEl = document.createElement('div');
            newEl.innerHTML = content;
            el.parentNode.replaceChild(newEl, el);
        });
        
        // Apply new template
        if (templateName !== 'default') {
            editor.classList.add(`template-${templateName}`);
            
            // Create template structure based on the selected template
            switch(templateName) {
                case 'business':
                    wrapFirstHeading();
                    addBusinessSections();
                    addFooter('Business Report Template • ' + new Date().toLocaleDateString());
                    break;
                case 'creative':
                    wrapFirstHeading();
                    addCreativeSections();
                    addFooter('Creative Writing Template • ' + new Date().toLocaleDateString());
                    break;
                case 'modern':
                    wrapFirstHeading();
                    addModernSections();
                    addFooter('Modern Document Template • ' + new Date().toLocaleDateString());
                    break;
                case 'resume':
                    addResumeTemplate();
                    break;
            }
        }
    }
    
    // Add this new function after the addFooter function:
    function addResumeTemplate() {
        // Replace the entire content of the editor with the resume template
        editor.innerHTML = `<!-- Professional Resume Template -->
    <div style="font-family: Arial, sans-serif; line-height: 1.5;">
      <!-- Header Section -->
      <div style="text-align: center; margin-bottom: 20px;">
        <h1 style="margin-bottom: 5px; color: #2b579a;">Your Full Name</h1>
        <p style="margin: 5px 0;">
          <span>youremail@example.com</span> | 
          <span>(123) 456-7890</span> | 
          <span>City, State</span> | 
          <span><a href="https://linkedin.com/in/yourprofile" style="color: #2b579a; text-decoration: none;">LinkedIn Profile</a></span>
        </p>
        <hr style="border: 1px solid #2b579a; margin: 10px 0;">
      </div>
    
      <!-- Professional Summary Section -->
      <div style="margin-bottom: 20px;">
        <h2 style="color: #2b579a; border-bottom: 1px solid #5b9bd5; padding-bottom: 5px;">Professional Summary</h2>
        <p>Dedicated professional with experience in [your field]. Skilled in [key skills] with a proven track record of [achievements]. Passionate about [interests/goals] and committed to [values/mission].</p>
      </div>
    
      <!-- Education Section -->
      <div style="margin-bottom: 20px;">
        <h2 style="color: #2b579a; border-bottom: 1px solid #5b9bd5; padding-bottom: 5px;">Education</h2>
        <div style="margin-bottom: 10px;">
          <div style="display: flex; justify-content: space-between;">
            <strong>University Name</strong>
            <span>Graduation Date</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <em>Degree Earned</em>
            <span>GPA: 3.X/4.0</span>
          </div>
          <ul style="margin-top: 5px;">
            <li>Relevant coursework: [Course 1], [Course 2], [Course 3]</li>
            <li>Achievements: [Honor/Award], [Honor/Award]</li>
          </ul>
        </div>
      </div>
    
      <!-- Experience Section -->
      <div style="margin-bottom: 20px;">
        <h2 style="color: #2b579a; border-bottom: 1px solid #5b9bd5; padding-bottom: 5px;">Work Experience</h2>
        
        <!-- Job 1 -->
        <div style="margin-bottom: 15px;">
          <div style="display: flex; justify-content: space-between;">
            <strong>Company Name</strong>
            <span>Start Date - End Date</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <em>Job Title</em>
            <span>City, State</span>
          </div>
          <ul style="margin-top: 5px;">
            <li>Responsibility/Achievement that showcases your skills and impact</li>
            <li>Responsibility/Achievement with quantifiable results (e.g., increased efficiency by 20%)</li>
            <li>Responsibility/Achievement that demonstrates leadership or problem-solving</li>
          </ul>
        </div>
        
        <!-- Job 2 -->
        <div style="margin-bottom: 15px;">
          <div style="display: flex; justify-content: space-between;">
            <strong>Company Name</strong>
            <span>Start Date - End Date</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <em>Job Title</em>
            <span>City, State</span>
          </div>
          <ul style="margin-top: 5px;">
            <li>Responsibility/Achievement that showcases your skills and impact</li>
            <li>Responsibility/Achievement with quantifiable results (e.g., reduced costs by 15%)</li>
            <li>Responsibility/Achievement that demonstrates teamwork or initiative</li>
          </ul>
        </div>
      </div>
    
      <!-- Projects Section -->
      <div style="margin-bottom: 20px;">
        <h2 style="color: #2b579a; border-bottom: 1px solid #5b9bd5; padding-bottom: 5px;">Projects</h2>
        
        <!-- Project 1 -->
        <div style="margin-bottom: 10px;">
          <div style="display: flex; justify-content: space-between;">
            <strong>Project Name</strong>
            <span>Completion Date</span>
          </div>
          <ul style="margin-top: 5px;">
            <li>Brief description of the project, its purpose, and your role</li>
            <li>Technologies/tools used and problems solved</li>
            <li>Results or impact of the project</li>
          </ul>
        </div>
      </div>
    
      <!-- Skills Section -->
      <div style="margin-bottom: 20px;">
        <h2 style="color: #2b579a; border-bottom: 1px solid #5b9bd5; padding-bottom: 5px;">Skills</h2>
        <div style="display: flex; flex-wrap: wrap;">
          <div style="flex: 1; min-width: 200px; margin-right: 20px;">
            <h3 style="color: #5b9bd5; margin-bottom: 5px;">Technical Skills</h3>
            <ul>
              <li>[Skill 1]</li>
              <li>[Skill 2]</li>
              <li>[Skill 3]</li>
            </ul>
          </div>
          <div style="flex: 1; min-width: 200px;">
            <h3 style="color: #5b9bd5; margin-bottom: 5px;">Soft Skills</h3>
            <ul>
              <li>[Skill 1]</li>
              <li>[Skill 2]</li>
              <li>[Skill 3]</li>
            </ul>
          </div>
        </div>
      </div>
    
      <!-- Certifications Section -->
      <div style="margin-bottom: 20px;">
        <h2 style="color: #2b579a; border-bottom: 1px solid #5b9bd5; padding-bottom: 5px;">Certifications</h2>
        <ul>
          <li><strong>[Certification Name]</strong> - Issuing Organization, Date</li>
          <li><strong>[Certification Name]</strong> - Issuing Organization, Date</li>
        </ul>
      </div>
    </div>`;
    
        // Update word count
        calculateWordCount();
        
        // Update the current template name display
        const currentTemplate = document.getElementById('current-template');
        if (currentTemplate) {
            currentTemplate.textContent = 'Professional Resume';
        }
    }
    
    // Wrap the first heading in a template header
    function wrapFirstHeading() {
        const firstHeading = editor.querySelector('h1');
        if (firstHeading) {
            const templateHeader = document.createElement('div');
            templateHeader.className = 'template-header';
            firstHeading.parentNode.insertBefore(templateHeader, firstHeading);
            templateHeader.appendChild(firstHeading);
        }
    }
    
    // Add sections for business template
    function addBusinessSections() {
        const paragraphs = editor.querySelectorAll('p');
        if (paragraphs.length > 0) {
            // Add Executive Summary section
            const execSummary = document.createElement('div');
            execSummary.className = 'template-section';
            execSummary.innerHTML = '<h2>Executive Summary</h2>';
            execSummary.appendChild(paragraphs[0].cloneNode(true));
            paragraphs[0].parentNode.replaceChild(execSummary, paragraphs[0]);
            
            // Add Content section for remaining paragraphs
            if (paragraphs.length > 1) {
                const contentSection = document.createElement('div');
                contentSection.className = 'template-section';
                contentSection.innerHTML = '<h2>Detailed Analysis</h2>';
                
                // Start from the second paragraph (index 1)
                for (let i = 1; i < paragraphs.length; i++) {
                    if (paragraphs[i].parentNode === editor) {
                        contentSection.appendChild(paragraphs[i].cloneNode(true));
                        paragraphs[i].style.display = 'none';
                    }
                }
                
                editor.appendChild(contentSection);
            }
        }
    }
    
    // Add sections for creative template
    function addCreativeSections() {
        const paragraphs = editor.querySelectorAll('p');
        if (paragraphs.length > 0) {
            // Add Introduction section
            const intro = document.createElement('div');
            intro.className = 'template-section';
            intro.innerHTML = '<h2>Introduction</h2>';
            intro.appendChild(paragraphs[0].cloneNode(true));
            paragraphs[0].parentNode.replaceChild(intro, paragraphs[0]);
            
            // Add Story section for remaining paragraphs
            if (paragraphs.length > 1) {
                const storySection = document.createElement('div');
                storySection.className = 'template-section';
                storySection.innerHTML = '<h2>Story</h2>';
                
                // Start from the second paragraph (index 1)
                for (let i = 1; i < paragraphs.length; i++) {
                    if (paragraphs[i].parentNode === editor) {
                        storySection.appendChild(paragraphs[i].cloneNode(true));
                        paragraphs[i].style.display = 'none';
                    }
                }
                
                editor.appendChild(storySection);
            }
        }
    }
    
    // Add sections for modern template
    function addModernSections() {
        const paragraphs = editor.querySelectorAll('p');
        if (paragraphs.length > 0) {
            // Add Overview section
            const overview = document.createElement('div');
            overview.className = 'template-section';
            overview.innerHTML = '<h2>Overview</h2>';
            overview.appendChild(paragraphs[0].cloneNode(true));
            paragraphs[0].parentNode.replaceChild(overview, paragraphs[0]);
            
            // Add Content section for remaining paragraphs
            if (paragraphs.length > 1) {
                const contentSection = document.createElement('div');
                contentSection.className = 'template-section';
                contentSection.innerHTML = '<h2>Content</h2>';
                
                // Start from the second paragraph (index 1)
                for (let i = 1; i < paragraphs.length; i++) {
                    if (paragraphs[i].parentNode === editor) {
                        contentSection.appendChild(paragraphs[i].cloneNode(true));
                        paragraphs[i].style.display = 'none';
                    }
                }
                
                editor.appendChild(contentSection);
            }
        }
    }
    
    // Add template footer
    function addFooter(text) {
        const footer = document.createElement('div');
        footer.className = 'template-footer';
        footer.textContent = text;
        editor.appendChild(footer);
    }
    
    // Placeholder for save document functionality
    function saveDocument() {
        // Get document content
        const documentContent = editor.innerHTML;
        const templateName = currentTemplate.textContent;
        
        // For now, we'll just show an alert - in a real app, this would save to a server
        alert(`Document would be saved with template: ${templateName}`);
    }
    
    // Placeholder for open document functionality
    function openDocument() {
        alert('Open document functionality would be implemented here.');
        
        // In a real application, this would show a dialog with saved documents
        // and load the selected document into the editor
    }
});