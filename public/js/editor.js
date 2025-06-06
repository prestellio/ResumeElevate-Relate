// public/js/editor.js
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
    loadTemplateFromServer(templateId);
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
      
      // Show loading state
      const editor = document.getElementById('document-editor');
      if (editor) {
        editor.innerHTML = '<div style="text-align:center; padding:50px;"><h3>Generating your AI-enhanced resume...</h3><p>Please wait while we prepare your professional resume...</p></div>';
      }
      
      // Call our API to generate the enhanced resume
      const response = await fetch(`/api/generate-complete-resume/${resumeId}/${templateId}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to generate resume: ${errorData.message || response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to generate resume');
      }
      
      // Insert the populated HTML into the editor
      if (editor) {
        editor.innerHTML = data.html;
        console.log('Editor populated with AI-enhanced content');
        
        // Store the enhanced content for the AI assistant to use
        window.enhancedResumeData = data.enhancedContent;
        
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
      
      // Show error message to user
      const editor = document.getElementById('document-editor');
      if (editor) {
        editor.innerHTML = `
          <div style="text-align:center; padding:50px; color: #d9534f;">
            <h3>Error Loading Resume</h3>
            <p>${error.message}</p>
            <p>Please try again or select a different template.</p>
          </div>
        `;
      }
      
      // Try falling back to basic template load
      setTimeout(() => {
        if (templateId) {
          loadTemplateFromServer(templateId);
        }
      }, 3000);
    }
  }

  /**
  * Loads a template without user data
  * @param {string} templateId - The ID of the template to load
  */
  async function loadTemplateFromServer(templateId) {
    try {
      console.log(`Attempting to load template ${templateId}`);
      
      // Fetch the template from our API endpoint
      const response = await fetch(`/api/templates/${templateId}`);
      
      if (!response.ok) {
        throw new Error(`Failed to load template: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Template data received:', data.success);
      
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
      
      // Show error message to user
      const editor = document.getElementById('document-editor');
      if (editor) {
        editor.innerHTML += `
          <div style="padding: 20px; background-color: #f8d7da; color: #721c24; margin: 20px 0; border-radius: 5px;">
            <p>Could not load the selected template (${templateId}). Using default template instead.</p>
            <p>Error: ${error.message}</p>
          </div>
        `;
      }
    }
  }

  // Handle AI prompt submissions
  const submitButton = document.querySelector('.submit-button');
  if (submitButton) {
    submitButton.addEventListener('click', async function() {
      const promptInput = document.querySelector('.prompt-input');
      const responseOutput = document.querySelector('.response-output');
      const prompt = promptInput.value;
      
      if (!prompt) {
        responseOutput.textContent = "Please enter a question or request about your resume.";
        return;
      }
      
      // Show loading state
      responseOutput.textContent = "Working on your request...";
      
      // Get the current resume content
      const resumeContent = document.getElementById('document-editor').innerHTML;
      
      try {
        // Call AI assistant API
        const response = await fetch('/api/ai/assistant/resume-assistant', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            prompt: prompt,
            resumeContent: resumeContent,
            enhancedData: window.enhancedResumeData || null
          })
        });
        
        if (!response.ok) {
          throw new Error(`API responded with status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success) {
          // Display the AI response
          responseOutput.textContent = data.response;
          
          // If the AI suggested edits and provided HTML, offer to apply them
          if (data.suggestEdits && data.suggestedHTML) {
            const applyButton = document.createElement('button');
            applyButton.textContent = "Apply Changes";
            applyButton.className = "apply-changes-btn";
            applyButton.style.backgroundColor = "#4CAF50";
            applyButton.style.color = "white";
            applyButton.style.border = "none";
            applyButton.style.padding = "8px 12px";
            applyButton.style.marginTop = "10px";
            applyButton.style.cursor = "pointer";
            
            applyButton.addEventListener('click', function() {
              document.getElementById('document-editor').innerHTML = data.suggestedHTML;
              this.remove(); // Remove the button after clicking
              responseOutput.textContent += "\n\nChanges applied successfully!";
            });
            
            responseOutput.appendChild(document.createElement('br'));
            responseOutput.appendChild(applyButton);
          }
        } else {
          responseOutput.textContent = "I couldn't process your request. Please try again.";
        }
        
        // Clear input after submission
        promptInput.value = '';
        
      } catch (error) {
        console.error('Error getting AI assistance:', error);
        responseOutput.textContent = "There was an error processing your request. Please try again later.";
      }
    });
  }

  // Make the editor content editable
  const editor = document.getElementById('document-editor');
  if (editor) {
    editor.contentEditable = "true";
  }

  // Setup basic formatting buttons
  setupFormattingButtons();
});

// Setup basic formatting buttons for the editor
function setupFormattingButtons() {
  const boldButton = document.querySelector('.menu-button:nth-child(2)');
  const italicButton = document.querySelector('.menu-button:nth-child(3)');
  const underlineButton = document.querySelector('.menu-button:nth-child(4)');
  const ulButton = document.querySelector('.menu-button:nth-child(5)');
  const undoButton = document.getElementById('undo-button');
  const redoButton = document.getElementById('redo-button');

  if (boldButton) {
    boldButton.addEventListener('click', function() {
      document.execCommand('bold', false, null);
    });
  }

  if (italicButton) {
    italicButton.addEventListener('click', function() {
      document.execCommand('italic', false, null);
    });
  }

  if (underlineButton) {
    underlineButton.addEventListener('click', function() {
      document.execCommand('underline', false, null);
    });
  }

  if (ulButton) {
    ulButton.addEventListener('click', function() {
      document.execCommand('insertUnorderedList', false, null);
    });
  }

  if (undoButton) {
    undoButton.addEventListener('click', function() {
      document.execCommand('undo', false, null);
    });
  }

  if (redoButton) {
    redoButton.addEventListener('click', function() {
      document.execCommand('redo', false, null);
    });
  }
}