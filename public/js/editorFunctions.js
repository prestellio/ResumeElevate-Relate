// Update/create the prompt handling in the editor
document.querySelector('.submit-button').addEventListener('click', function() {
    const promptInput = document.querySelector('.prompt-input');
    const responseOutput = document.querySelector('.response-output');
    const prompt = promptInput.value;
    
    if (!prompt) {
      responseOutput.textContent = "Please enter a question or request for assistance with your resume.";
      return;
    }
    
    // Show loading state
    responseOutput.textContent = "Analyzing your resume and generating a response...";
    
    // Get the current resume content
    const resumeContent = document.getElementById('document-editor').innerHTML;
    
    // Call the AI assistant API
    fetch('/api/ai/assistant/resume-assistant', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt: prompt,
        resumeContent: resumeContent,
        enhancedData: window.enhancedResumeData || null
      })
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
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
        responseOutput.textContent = "I couldn't process your request. Please try again with a different prompt.";
      }
      
      // Clear input after submission
      promptInput.value = '';
    })
    .catch(error => {
      console.error('Error getting AI assistance:', error);
      responseOutput.textContent = "There was an error processing your request. Please try again later.";
    });
  });