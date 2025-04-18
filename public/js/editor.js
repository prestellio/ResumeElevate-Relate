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
        // Format buttons
        document.querySelectorAll('.menu-button').forEach(button => {
            button.addEventListener('click', function() {
                if (this.innerHTML === '<b>B</b>') {
                    document.execCommand('bold', false, null);
                } else if (this.innerHTML === '<i>I</i>') {
                    document.execCommand('italic', false, null);
                } else if (this.innerHTML === '<u>U</u>') {
                    document.execCommand('underline', false, null);
                } else if (this.innerHTML === '–') {
                    document.execCommand('insertUnorderedList', false, null);
                } else if (this.innerHTML === '•') {
                    document.execCommand('insertUnorderedList', false, null);
                } else if (this.innerHTML === '1.') {
                    document.execCommand('insertOrderedList', false, null);
                } else if (this.innerHTML === '⟳') {
                    document.execCommand('redo', false, null);
                } else if (this.innerHTML === '⟲') {
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
        
        // Load resume data from URL params if available
        loadResumeFromParams();
    }
    
    // Handle prompt submission
    function handlePromptSubmission() {
        const promptInput = document.querySelector('.prompt-input');
        const responseOutput = document.querySelector('.response-output');
        const prompt = promptInput.value.trim();
        
        if (!prompt) return;
        
        // Process the prompt and generate appropriate response
        // This is a simplified demo - in a real app, this would call an AI API
        let response = processPrompt(prompt);
        responseOutput.textContent = response;
        
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