// Login/Registration form handling
async function handleRegistration(event) {
    event.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const email = document.getElementById('email').value;

    // Send POST request to the server
    const response = await fetch('/register', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password, email })
    });

    if (response.ok) {
        // If registration is successful, redirect to the generate page
        window.location.href = 'generate.html';
    } else {
        const result = await response.text();
        document.getElementById('result').innerText = result;
    }
}

// Initialize event listeners for login page
document.addEventListener('DOMContentLoaded', function() {
    // Login page registration form handler
    const registrationForm = document.getElementById('registrationForm');
    if (registrationForm) {
        registrationForm.addEventListener('submit', handleRegistration);
    }
    
    // Navigation to generator page
    const generatorButton = document.getElementById("generator");
    if (generatorButton) {
        generatorButton.addEventListener("click", toGenerator);
    }
});