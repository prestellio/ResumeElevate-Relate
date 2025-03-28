
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
});


//-------------------------------------------------------------------------------------------------------

//Sleep function for timeouts
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve,ms));
}

//fade in and fade out for option-btn, next-btn, back-btn classes
//-------------------------------------------------------------------------------------------------------

function buttonFadeOut(questionDiv){
    //Sets div to fade out
    questionDiv.classList.remove('fadeIn');
    questionDiv.classList.add('fadeOut');

    //Change duration based on transition speed
    sleep(1100);      
}

//Fades the next div in
function buttonFadeIn(nextQuestion){


    let tempStr = nextQuestion.split("-");

    //Gets the div
    let nextDiv = document.getElementById(nextQuestion);
    
    nextDiv.style= "opacity:0;";

    nextDiv.classList.remove('fadeOut');
    nextDiv.classList.add('fadeIn');
}





//-------------------------------------------------------------------------------------------------------




