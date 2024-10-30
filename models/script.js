// Function to format text (bold, italic, underline, etc.)
function formatText(command) {
    document.execCommand(command, false, null);
}

// Function to change block element type (paragraph, heading, etc.)
function formatBlock(tag) {
    document.execCommand('formatBlock', false, tag);
}

// Function to insert unordered/ordered list
function insertList(command) {
    document.execCommand(command, false, null);
}

// Function to create a hyperlink
function createLink() {
    const url = prompt('Enter the URL:');
    if (url) {
        document.execCommand('createLink', false, url);
    }
}

// Function to save the content as HTML
function saveContent() {
    const content = document.getElementById('editor').innerHTML;
    document.getElementById('saved-content').value = content;
    alert('Content saved!');
}

// Function to export the content as a PDF
function exportPDF() {
    const content = document.getElementById('editor').innerHTML;
    const pdfWindow = window.open('', '', 'width=800,height=600');
    pdfWindow.document.write(`
        <html>
            <head><title>Export PDF</title></head>
            <body>${content}</body>
        </html>
    `);
    pdfWindow.document.close();
    pdfWindow.print();
}

// Optional: Load saved content from localStorage
window.addEventListener('DOMContentLoaded', () => {
    const savedContent = localStorage.getItem('editorContent');
    if (savedContent) {
        document.getElementById('editor').innerHTML = savedContent;
    }
});

// Save content to localStorage on unload (for persistence)
window.addEventListener('beforeunload', () => {
    const content = document.getElementById('editor').innerHTML;
    localStorage.setItem('editorContent', content);
});
