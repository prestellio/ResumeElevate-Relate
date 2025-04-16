// Editor_review page - Load resume data
async function loadResumeDataForReview() {
    const urlParams = new URLSearchParams(window.location.search);
    const resumeId = urlParams.get('resumeId');

    if (!resumeId) {
        console.error("No resume ID found in the URL.");
        return;
    }

    try {
        const response = await fetch(`/get-resume/${resumeId}`);
        const resume = await response.json();
        console.log("Fetched Resume Data:", resume); // Debugging Log

        if (resume) {
            document.getElementById('name').innerText = resume.name || "Full Name";
            document.getElementById('email').innerText = resume.email || "Email Not Provided";
            document.getElementById('phone').innerText = resume.phone || "Phone Not Provided";

            // Initialize Quill editors
            var quillEducation = new Quill('#education-container', { theme: 'snow', placeholder: 'Add education details...' });
            var quillExperience = new Quill('#experience-container', { theme: 'snow', placeholder: 'Add work experience...' });
            var quillProjects = new Quill('#projects-container', { theme: 'snow', placeholder: 'Add project details...' });
            var quillLeadership = new Quill('#leadership-container', { theme: 'snow', placeholder: 'Add leadership experience...' });

            // Populate Quill editors with correct data
            quillEducation.root.innerHTML = `<p><strong>${resume.education.degree || "Degree Not Provided"}</strong>, ${resume.education.university || "University Not Provided"}, ${resume.education.location || "Location Not Provided"}</p>
                                             <p>GPA: ${resume.education.gpa || "N/A"}</p>
                                             <p>Relevant Courses: ${resume.education.relevantCourses || "Not Provided"}</p>`;

            quillExperience.root.innerHTML = resume.experiences.length > 0 ? 
                resume.experiences.map(exp => `<p><strong>${exp.position || "Position Not Provided"}</strong> at ${exp.companyName || "Company Not Provided"} (${exp.startDate || "Start Date"} - ${exp.endDate || "End Date"})<br>${exp.responsibilities || "Responsibilities not provided."}</p>`).join('') :
                `<p>No experience added.</p>`;

            quillProjects.root.innerHTML = resume.projects.length > 0 ? 
                resume.projects.map(proj => `<p><strong>${proj.projectName || "Project Name Not Provided"}</strong> - ${proj.projectDescription || "Description Not Provided"} (Started: ${proj.projectStartDate || "Start Date"})</p>`).join('') :
                `<p>No projects added.</p>`;

            quillLeadership.root.innerHTML = resume.leadership.length > 0 ? 
                resume.leadership.map(lead => `<p><strong>${lead.leadershipPosition || "Position Not Provided"}</strong> at ${lead.groupName || "Group Not Provided"} (${lead.leadershipStartDate || "Start Date"} - ${lead.leadershipEndDate || "End Date"})</p>`).join('') :
                `<p>No leadership experience added.</p>`;

            // Set up save button handler
            document.getElementById('saveResume').addEventListener('click', async () => {
                await saveResumeReview(resumeId, quillEducation, quillExperience, quillProjects, quillLeadership);
            });
        }
    } catch (error) {
        console.error('Error fetching resume data:', error);
    }
}

// Save resume review data
async function saveResumeReview(resumeId, quillEducation, quillExperience, quillProjects, quillLeadership) {
    if (!resumeId) {
        alert("Error: Resume ID is missing.");
        return;
    }

    const updatedData = {
        resumeId,
        educationContent: quillEducation.root.innerHTML,
        experienceContent: quillExperience.root.innerHTML,
        projectsContent: quillProjects.root.innerHTML,
        leadershipContent: quillLeadership.root.innerHTML
    };

    try {
        const response = await fetch('/save-resume', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedData)
        });

        if (response.ok) {
            alert('Resume saved successfully!');
        } else {
            alert('Failed to save resume.');
        }
    } catch (error) {
        console.error('Error saving resume:', error);
    }
}

// Initialize event listeners for editor_review page
document.addEventListener('DOMContentLoaded', function() {
    // Editor_review page - Load resume data if the page is editor_review.html
    if (window.location.pathname.includes('editor_review.html')) {
        loadResumeDataForReview();
    }
});