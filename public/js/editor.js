/**
 * Resume Editor Functionality
 * 
 * This script provides all the functionality for the resume editor,
 * including formatting, template loading, and AI assistance.
 */

document.addEventListener('DOMContentLoaded', function() {
    // Main editor element
    const editor = document.getElementById('document-editor');
    
    // Initialize the editor
    initEditor();
    
    function initEditor() {
        // Add to your editor.js file, inside the initEditor() function

// Add a new button to the menu bar for AI enhancement
    const menuBar = document.querySelector('.menu-bar');
    const aiEnhanceButton = document.createElement('button');
    aiEnhanceButton.className = 'menu-button';
    aiEnhanceButton.style.backgroundColor = '#4CAF50';
    aiEnhanceButton.style.color = 'white';
    aiEnhanceButton.textContent = 'AI Enhance';
    menuBar.appendChild(aiEnhanceButton);

// Add event listener for the AI enhance button
aiEnhanceButton.addEventListener('click', async function() {
    // Show loading state
    this.textContent = 'Enhancing...';
    this.disabled = true;
    
    try {
        // Get the currently selected text (or section)
        const selection = window.getSelection();
        let selectedText = '';
        let selectedElement = null;
        
        if (selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            selectedText = range.toString();
            
            // If no text is selected, try to get the element under cursor
            if (!selectedText) {
                selectedElement = findClosestSection(range.startContainer);
                if (selectedElement) {
                    selectedText = selectedElement.innerHTML;
                }
            } else {
                // If text is selected, find its containing section
                selectedElement = findClosestSection(range.startContainer);
            }
        }
        
        if (!selectedText) {
            alert('Please select some text or click inside a section to enhance');
            this.textContent = 'AI Enhance';
            this.disabled = false;
            return;
        }
        
        // Send to the AI for enhancement
        const response = await fetch('/api/ai/enhance-section', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                text: selectedText,
                sectionType: getSectionType(selectedElement)
            })
        });
        
        if (!response.ok) {
            throw new Error('Failed to enhance content');
        }
        
        const data = await response.json();
        
        if (data.success && data.enhancedContent) {
            // Apply the enhanced content
            if (selectedElement) {
                // If we're enhancing a whole section
                selectedElement.innerHTML = data.enhancedContent;
            } else if (selection.rangeCount > 0) {
                // If we're enhancing just the selected text
                const range = selection.getRangeAt(0);
                range.deleteContents();
                const fragment = document.createDocumentFragment();
                const div = document.createElement('div');
                div.innerHTML = data.enhancedContent;
                while (div.firstChild) {
                    fragment.appendChild(div.firstChild);
                }
                range.insertNode(fragment);
            }
            
            // Show success message in the response output
            const responseOutput = document.querySelector('.response-output');
            responseOutput.textContent = "✓ Content enhanced successfully! I've improved the professional language and formatting.";
        } else {
            throw new Error('Invalid response from AI');
        }
    } catch (error) {
        console.error('Error enhancing content:', error);
        alert('An error occurred while enhancing the content. Please try again.');
    }
    
    // Reset button state
    this.textContent = 'AI Enhance';
    this.disabled = false;
});

// Helper function to find the closest section element
function findClosestSection(element) {
    let current = element;
    
    // Navigate up the DOM tree until we find a resume section
    while (current && !current.classList?.contains('resume-section') && 
           !current.classList?.contains('resume-item') && 
           current !== editor) {
        current = current.parentElement;
    }
    
    return current;
}

// Helper function to determine section type
function getSectionType(element) {
    if (!element) return 'unknown';
    
    // Determine section type based on content or class
    if (element.querySelector('.resume-section-title')) {
        const titleText = element.querySelector('.resume-section-title').textContent.toLowerCase();
        
        if (titleText.includes('summary')) return 'summary';
        if (titleText.includes('education')) return 'education';
        if (titleText.includes('experience') || titleText.includes('work')) return 'experience';
        if (titleText.includes('skill')) return 'skills';
        if (titleText.includes('project')) return 'projects';
    }
    
    // If we can't determine from title, try from class names
    const className = element.className || '';
    if (className.includes('summary')) return 'summary';
    if (className.includes('education')) return 'education';
    if (className.includes('experience')) return 'experience';
    if (className.includes('skill')) return 'skills';
    if (className.includes('project')) return 'projects';
    
    return 'unknown';
}


        // Format buttons
        document.querySelectorAll('.menu-button').forEach(button => {
            button.addEventListener('click', function() {
                if (this.innerHTML === '<b>B</b>') {
                    document.execCommand('bold', false, null); // Bold
                } else if (this.innerHTML === '<i>I</i>') {
                    document.execCommand('italic', false, null); // Italic
                } else if (this.innerHTML === '<u>U</u>') {
                    document.execCommand('underline', false, null); // Underline
                } else if (this.innerHTML === '–') {
                    document.execCommand('insertUnorderedList', false, null); // Unordered list dash
                } else if (this.innerHTML === '•') {
                    document.execCommand('insertUnorderedList', false, null); // Unordered list dot
                } else if (this.innerHTML === '1.') {
                    document.execCommand('insertOrderedList', false, null); // Ordered list
                } else if (this.innerHTML === '⟳') {
                    document.execCommand('redo', false, null); // Redo
                } else if (this.innerHTML === '⟲') {
                    document.execCommand('undo', false, null); // Undo
                } else if (this.innerHTML === '←') {
                    document.execCommand('align', 'left', false, null); // Left align
                } else if (this.innerHTML === '→') {
                    document.execCommand('align', 'right', false, null); // Right align
                } else if (this.innerHTML === '↔') {
                    document.execCommand('align', 'center', false, null); // Middle align
                }
                editor.focus();
            });
        });

        document.querySelectorAll('.menu-bar-btn').forEach(button => {
            button.addEventListener('click', function() {
                if (this.getAttribute('data-value') === '⟳') {
                    document.execCommand('redo', false, null);
                } else if (this.getAttribute('data-value') === '⟲') {
                    document.execCommand('undo', false, null);
                }
                editor.focus();
            });

            
        });
        
        // Submit prompt button
        document.querySelector('.submit-button').addEventListener('click', function() {
            handlePromptSubmission();
        });
        
        // Enter key in prompt textarea
        document.querySelector('.prompt-input').addEventListener('keydown', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handlePromptSubmission();
            }
        });
        
        // Redo button
        document.querySelector('.redo-button').addEventListener('click', function() {
            const responseOutput = document.querySelector('.response-output');
            responseOutput.textContent = "What specific areas of your resume would you like me to help with?";
        });
        
        // Make sure the editor is focused when clicking anywhere in the document area
        document.querySelector('.editor-area').addEventListener('click', function(e) {
            if (e.target.className === 'editor-area' || e.target.className === 'document') {
                editor.focus();
            }
        });

        // document.getElementById('prompt-submit').addEventListener('click', function () {
        //     document.getElementById('response-output').setAttribute('style', 'color: white;');
        // });
        
        // Load resume data from URL params if available
        loadResumeFromParams();
    }
    
    // Handle prompt submission
    async function handlePromptSubmission() {
        const promptInput = document.querySelector('.prompt-input');
        const responseOutput = document.querySelector('.response-output');
        const prompt = promptInput.value.trim();
        
        if (!prompt) return;
        
        // Show loading state
        responseOutput.textContent = "Analyzing your request...";
        
        try {
            // Get the current resume content
            const resumeContent = editor.innerHTML;
            
            // Send to Claude AI for assistance
            const response = await fetch('/api/ai/resume-assistant', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    prompt: prompt,
                    resumeContent: resumeContent
                })
            });
            
            if (!response.ok) {
                throw new Error('Failed to get AI assistance');
            }
            
            const data = await response.json();
            
            if (data.success) {
                // Display AI response
                responseOutput.textContent = data.response;
                
                // If the AI suggested edits, provide a button to apply them
                if (data.suggestedEdits) {
                    // Create and add an "Apply Changes" button
                    const applyButton = document.createElement('button');
                    applyButton.textContent = 'Apply Suggested Changes';
                    applyButton.className = 'apply-button';
                    applyButton.style.backgroundColor = '#4CAF50';
                    applyButton.style.color = 'white';
                    applyButton.style.border = 'none';
                    applyButton.style.padding = '8px';
                    applyButton.style.marginTop = '10px';
                    applyButton.style.cursor = 'pointer';
                    applyButton.style.width = '100%';
                    
                    applyButton.addEventListener('click', function() {
                        // Apply the suggested changes to the editor
                        if (data.suggestedHTML) {
                            editor.innerHTML = data.suggestedHTML;
                            responseOutput.textContent = "Changes applied successfully! Feel free to make additional edits.";
                            this.remove(); // Remove the button after applying
                        }
                    });
                    
                    responseOutput.appendChild(document.createElement('br'));
                    responseOutput.appendChild(applyButton);
                }
            } else {
                responseOutput.textContent = "I couldn't process your request. Please try again with more details about what you'd like help with.";
            }
        } catch (error) {
            console.error('Error getting AI assistance:', error);
            responseOutput.textContent = "Sorry, I encountered an error while processing your request. Please try again.";
        }
        
        // Clear input after submission
        promptInput.value = '';
    }
    
    // Simple prompt processing (demo only)
    function processPrompt(prompt) {
        prompt = prompt.toLowerCase();
        
        if (prompt.includes('experience') || prompt.includes('job')) {
            return "I can help enhance your work experience section. Would you like me to make it more achievement-oriented?";
        } else if (prompt.includes('education')) {
            return "Your education section looks good. Consider adding any honors or relevant coursework that might strengthen your qualifications.";
        } else if (prompt.includes('skill')) {
            return "For technical roles, I recommend organizing your skills into categories (Programming Languages, Frameworks, Tools) for better readability.";
        } else if (prompt.includes('summary') || prompt.includes('objective')) {
            return "Your professional summary should highlight your top 2-3 achievements and unique value proposition. Would you like me to help rewrite it?";
        } else if (prompt.includes('format') || prompt.includes('layout')) {
            return "This resume follows a clean, professional format well-suited for most industries. Would you like to see other formatting options?";
        } else {
            return "I'm here to help improve your resume. What specific section would you like assistance with? (Experience, Skills, Education, Summary, etc.)";
        }
    }
    
    // Load resume data from URL parameters
    function loadResumeFromParams() {
        const urlParams = new URLSearchParams(window.location.search);
        const resumeId = urlParams.get('resumeId');
        const template = urlParams.get('template');
        
        if (resumeId) {
            // In a real app, this would fetch resume data from the server
            console.log(`Loading resume ID: ${resumeId}`);
            
            // If template parameter is also specified
            if (template) {
                console.log(`Using template: ${template}`);
                // This would load a specific template
            }
            
            // For demo purposes, we'll just keep the default template
            // In a real app, this would load specific resume data
        }
    }
    
    // Save resume content
    function saveResume() {
        const content = editor.innerHTML;
        
        // In a real app, this would send data to server
        console.log("Resume content saved");
        
        // Show a confirmation message
        alert("Resume has been saved successfully!");
    }
    
    // Add save keyboard shortcut (Ctrl+S)
    document.addEventListener('keydown', function(e) {
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            saveResume();
        }
    });
});