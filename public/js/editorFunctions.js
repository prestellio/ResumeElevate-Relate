document.addEventListener('DOMContentLoaded', function() {
    const editor = document.getElementById('document-editor');
    
    // Format buttons
    document.querySelectorAll('.menu-button').forEach(button => {
        button.addEventListener('click', function() {
            if (this.innerHTML === '<b>B</b>') {
                document.execCommand('bold', false, null);                  // Bold
            } else if (this.innerHTML === '<i>I</i>') {
                document.execCommand('italic', false, null);                //Italic
            } else if (this.innerHTML === '<u>U</u>') {
                document.execCommand('underline', false, null);             // Underline
            } else if (this.innerHTML === '–') {
                document.execCommand('insertUnorderedList', false, null);   // Unordered list dash
            } else if (this.innerHTML === '•') {
                document.execCommand('insertUnorderedList', false, null);   // Unordered list dot
            } else if (this.innerHTML === '1.') {
                document.execCommand('insertOrderedList', false, null);     // Ordered list number
            } else if (this.innerHTML === '⟳') {
                document.execCommand('redo', false, null);                  // Redo
            } else if (this.innerHTML === '⟲') {
                document.execCommand('undo', false, null);                  // Undo
            } else if (this.innerHTML === '←') {
                document.execCommand('justifyLeft', false, null);            // Left align 
            } else if (this.innerHTML === '↔') {
                document.execCommand('justifyCenter', false, null);
            } else if (this.innerHTML === '→') {
                document.execCommand('justifyRight', false, null);
            }
            editor.focus();
        });
    });

    document.getElementById('undo-button').addEventListener("click", function () {
        document.execCommand('undo', false, null);
    });
    document.getElementById('redo-button').addEventListener("click", function () {
        document.execCommand('redo', false, null);
    });
        
    // Submit prompt button
    document.querySelector('.submit-button').addEventListener('click', function() {
        const promptInput = document.querySelector('.prompt-input');
        const responseOutput = document.querySelector('.response-output');
        
        // Simple demo response
        responseOutput.textContent = "Based on your resume, I suggest highlighting your technical skills more prominently. Would you like me to update the Skills section for you?";
        
        // Clear input after submission
        promptInput.value = '';
    });
        
    // Redo button
    document.querySelector('.redo-button').addEventListener('click', function() {
        const responseOutput = document.querySelector('.response-output');
        responseOutput.textContent = "What specific areas of your resume would you like me to help with?";
    });
});

// Show the info panel after a short delay
setTimeout(function() {
    document.getElementById('ai-info-panel').style.display = 'block';
}, 2000);

// Close button functionality
document.getElementById('close-info').addEventListener('click', function() {
    document.getElementById('ai-info-panel').style.display = 'none';
});