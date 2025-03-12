
//Moves the user to the generate.html page
function toGenerator() {
    window.location.href="generate.html";
}
//Button with id="generator" in index.html
document.getElementById("generator").addEventListener("click", toGenerator);

//Nav bar collapse
function toggleNav() {
    var navList = document.getElementById("nav-btn");
    if (navList.style.display === "none" || navList.style.display === "") {
        navList.style.display = "flex";
    } else {
        navList.style.display = "none";
    }
}

//Nav bar mini-button
document.getElementById('navbarToggle').addEventListener('click', function() {
    var menu = document.getElementById('navbarMenu');
    if (menu.style.display === 'block') {
        menu.style.display = 'none';
    } else {
        menu.style.display = 'block';
    }
});

//Generate page submit form -------------------------------------------------------------------------
document.getElementById('resumeForm').addEventListener('submit', async function (event) {
    event.preventDefault(); // Prevent default form submission

    const formData = new FormData(this); // Capture form data
    const formObject = {};
    formData.forEach((value, key) => {
        if (formObject[key]) {
            if (!Array.isArray(formObject[key])) {
                formObject[key] = [formObject[key]];
            }
            formObject[key].push(value);
        } else {
            formObject[key] = value;
        }
    });
//Push resume template image to database
    try {
        const response = await fetch('http://localhost:3000/submit-resume', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formObject)
        });

        if (response.ok) {
            const data = await response.json();
            if (data.resumeId) {
                // **Redirect to editor.html with resumeId**
                window.location.href = `editor.html?resumeId=${data.resumeId}`;
            } else {
                alert('Error: Resume ID not received.');
            }
        } else {
            alert('Failed to submit resume.');
        }
    } catch (error) {
        console.error('Error submitting form:', error);
        alert('Error submitting resume.');
    }

        // Replace this URL with your actual API endpoint that returns the templates from your database.
        const apiEndpoint = '/api/templates';

        // Fetch the template images from the database.
        async function loadTemplates() {
          try {
            const response = await fetch(apiEndpoint);
            if (!response.ok) {
              throw new Error('Network response was not ok: ' + response.statusText);
            }
            // Expecting JSON array of objects e.g. [{ id: 1, imageUrl: "path/to/image.jpg", title: "Template 1" }, ...]
            const templates = await response.json();
    
            const templateList = document.getElementById('templateList');
    
            templates.forEach(template => {
              const li = document.createElement('li');
              // Create an image element for the preview
              const img = document.createElement('img');
              img.src = template.imageUrl;
              img.alt = template.title;
              img.classList.add('template-preview');
              // When a preview is clicked, update the main preview on the right side.
              img.addEventListener('click', () => {
                document.getElementById('templatePreview').src = template.imageUrl;
              });
              li.appendChild(img);
              templateList.appendChild(li);
            });
          } catch (error) {
            console.error('Error fetching templates:', error);
          }
        }
    
        // Initialize template loading on DOM content load.
        document.addEventListener('DOMContentLoaded', loadTemplates);
    
});

document.getElementById("template_selection").addEventListener(select)


//-------------------------------------------------------------------------------------------------------


