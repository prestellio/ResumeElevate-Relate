// Questionnaire page initialization
function initQuestionnaire() {
    // Section IDs in order of appearance
    const sectionIds = [
        'career-selection',
        'personal-info',
        'education-info',
        'experience-info', 
        'projects-info',
        'skills-info',
        'summary-section'
    ];

    // Field-specific sections mapped by career choice
    const fieldSpecificSections = {
        'engineering': 'engineering-questions',
        'business': 'business-questions',
        'technology': 'technology-questions',
        'healthcare': 'healthcare-questions',
        'education': 'education-questions',
        'arts': 'arts-questions',
        'science': 'science-questions'
    };

    // Current workflow of sections
    let currentWorkflow = [...sectionIds];
    
    // Track current section index
    let currentSectionIndex = 0;
    
    // Career choice
    let selectedCareer = '';

    // Resume data object to store all responses
    const resumeData = {
        careerField: '',
        personalInfo: {},
        education: [],
        experience: [],
        projects: [],
        skills: {},
        fieldSpecific: {},
        summary: ''
    };

    // Career selection buttons
    const careerButtons = document.querySelectorAll('.option-btn[data-career]');
    careerButtons.forEach(button => {
        button.addEventListener('click', function() {
            selectedCareer = this.getAttribute('data-career');
            resumeData.careerField = selectedCareer;
            
            // Update workflow to include field-specific questions
            if (fieldSpecificSections[selectedCareer]) {
                // Insert field-specific section before summary
                const summaryIndex = currentWorkflow.indexOf('summary-section');
                currentWorkflow.splice(summaryIndex, 0, fieldSpecificSections[selectedCareer]);
            }
            
            // Move to next section
            moveToNextSection();
        });
    });

    // Setup navigation buttons
    document.getElementById('personal-back').addEventListener('click', moveToPreviousSection);
    document.getElementById('personal-next').addEventListener('click', function() {
        collectPersonalInfo();
        moveToNextSection();
    });

    document.getElementById('education-back').addEventListener('click', moveToPreviousSection);
    document.getElementById('education-next').addEventListener('click', function() {
        collectEducationInfo();
        moveToNextSection();
    });

    document.getElementById('experience-back').addEventListener('click', moveToPreviousSection);
    document.getElementById('experience-next').addEventListener('click', function() {
        collectExperienceInfo();
        moveToNextSection();
    });

    document.getElementById('projects-back').addEventListener('click', moveToPreviousSection);
    document.getElementById('projects-next').addEventListener('click', function() {
        collectProjectsInfo();
        moveToNextSection();
    });

    document.getElementById('skills-back').addEventListener('click', moveToPreviousSection);
    document.getElementById('skills-next').addEventListener('click', function() {
        collectSkillsInfo();
        moveToNextSection();
    });

    // Career-specific section buttons
    setupFieldSpecificButtons();

    document.getElementById('summary-back').addEventListener('click', moveToPreviousSection);
    document.getElementById('submit-resume').addEventListener('click', function() {
        collectSummary();
        submitQuestionnaire();
    });
    
    // Setup "Add More" buttons
    document.getElementById('add-education').addEventListener('click', addEducationSection);
    document.getElementById('add-experience').addEventListener('click', addExperienceSection);
    document.getElementById('add-project').addEventListener('click', addProjectSection);
    
    // Update progress bar
    updateProgressBar();

    function setupFieldSpecificButtons() {
        // Engineering specific section
        if (document.getElementById('engineering-back')) {
            document.getElementById('engineering-back').addEventListener('click', moveToPreviousSection);
            document.getElementById('engineering-next').addEventListener('click', function() {
                collectEngineeringInfo();
                moveToNextSection();
            });
        }

        // Business specific section
        if (document.getElementById('business-back')) {
            document.getElementById('business-back').addEventListener('click', moveToPreviousSection);
            document.getElementById('business-next').addEventListener('click', function() {
                collectBusinessInfo();
                moveToNextSection();
            });
        }

        // Technology specific section
        if (document.getElementById('technology-back')) {
            document.getElementById('technology-back').addEventListener('click', moveToPreviousSection);
            document.getElementById('technology-next').addEventListener('click', function() {
                collectTechnologyInfo();
                moveToNextSection();
            });
        }

        // Healthcare specific section
        if (document.getElementById('healthcare-back')) {
            document.getElementById('healthcare-back').addEventListener('click', moveToPreviousSection);
            document.getElementById('healthcare-next').addEventListener('click', function() {
                collectHealthcareInfo();
                moveToNextSection();
            });
        }

        // Education specific section
        if (document.getElementById('education-back')) {
            document.getElementById('education-back').addEventListener('click', moveToPreviousSection);
            document.getElementById('education-next').addEventListener('click', function() {
                collectEducationFieldInfo();
                moveToNextSection();
            });
        }

        // Arts specific section
        if (document.getElementById('arts-back')) {
            document.getElementById('arts-back').addEventListener('click', moveToPreviousSection);
            document.getElementById('arts-next').addEventListener('click', function() {
                collectArtsInfo();
                moveToNextSection();
            });
        }

        // Science specific section
        if (document.getElementById('science-back')) {
            document.getElementById('science-back').addEventListener('click', moveToPreviousSection);
            document.getElementById('science-next').addEventListener('click', function() {
                collectScienceInfo();
                moveToNextSection();
            });
        }
    }

    function moveToNextSection() {
        // Hide current section
        document.getElementById(currentWorkflow[currentSectionIndex]).classList.add('hidden');
        
        // Move to next section index
        currentSectionIndex++;
        
        // Show next section
        document.getElementById(currentWorkflow[currentSectionIndex]).classList.remove('hidden');
        
        // Update progress bar
        updateProgressBar();
    }

    function moveToPreviousSection() {
        // Hide current section
        document.getElementById(currentWorkflow[currentSectionIndex]).classList.add('hidden');
        
        // Move to previous section index
        currentSectionIndex--;
        
        // Show previous section
        document.getElementById(currentWorkflow[currentSectionIndex]).classList.remove('hidden');
        
        // Update progress bar
        updateProgressBar();
    }

    function updateProgressBar() {
        const progressPercentage = ((currentSectionIndex) / (currentWorkflow.length - 1)) * 100;
        document.getElementById('progressBar').style.width = `${progressPercentage}%` ;
    }

    // Data collection functions
    function collectPersonalInfo() {
        resumeData.personalInfo = {
            name: document.getElementById('full-name').value,
            email: document.getElementById('email').value,
            phone: document.getElementById('phone').value,
            location: document.getElementById('location').value
        };
    }

    function collectEducationInfo() {
        // Simple version - just collect the first education entry
        resumeData.education = [{
            university: document.getElementById('university').value,
            degree: document.getElementById('degree').value,
            graduationDate: document.getElementById('graduation-date').value,
            gpa: document.getElementById('gpa').value,
            relevantCourses: document.getElementById('relevant-courses').value
        }];
    }

    function collectExperienceInfo() {
        // Simple version - just collect the first experience entry
        resumeData.experience = [{
            companyName: document.getElementById('company-name').value,
            jobTitle: document.getElementById('job-title').value,
            location: document.getElementById('job-location').value,
            dates: document.getElementById('employment-dates').value,
            responsibilities: document.getElementById('job-responsibilities').value
        }];
    }

    function collectProjectsInfo() {
        // Simple version - just collect the first project entry
        resumeData.projects = [{
            projectName: document.getElementById('project-name').value,
            dates: document.getElementById('project-dates').value,
            description: document.getElementById('project-description').value
        }];
    }

    function collectSkillsInfo() {
        resumeData.skills = {
            technical: document.getElementById('technical-skills').value,
            soft: document.getElementById('soft-skills').value,
            languages: document.getElementById('languages').value,
            certifications: document.getElementById('certifications').value
        };
    }

    // Field-specific collection functions
    function collectEngineeringInfo() {
        resumeData.fieldSpecific.engineering = {
            discipline: document.getElementById('engineering-type').value,
            software: document.getElementById('engineering-software').value,
            projects: document.getElementById('engineering-projects').value
        };
    }

    function collectBusinessInfo() {
        resumeData.fieldSpecific.business = {
            specialty: document.getElementById('business-specialty').value,
            software: document.getElementById('business-software').value,
            certifications: document.getElementById('business-certifications').value,
            achievements: document.getElementById('business-achievements').value
        };
    }

    function collectTechnologyInfo() {
        resumeData.fieldSpecific.technology = {
            specialty: document.getElementById('tech-specialty').value,
            programmingLanguages: document.getElementById('programming-languages').value,
            frameworks: document.getElementById('tech-frameworks').value,
            projects: document.getElementById('tech-projects').value
        };
    }

    function collectHealthcareInfo() {
        resumeData.fieldSpecific.healthcare = {
            specialty: document.getElementById('healthcare-specialty').value,
            certifications: document.getElementById('healthcare-certifications').value,
            skills: document.getElementById('healthcare-skills').value,
            experience: document.getElementById('healthcare-experience').value
        };
    }

    function collectEducationFieldInfo() {
        resumeData.fieldSpecific.education = {
            level: document.getElementById('education-level').value,
            subjects: document.getElementById('teaching-subjects').value,
            certifications: document.getElementById('teaching-certifications').value,
            methods: document.getElementById('teaching-methods').value
        };
    }

    function collectArtsInfo() {
        resumeData.fieldSpecific.arts = {
            specialty: document.getElementById('arts-specialty').value,
            software: document.getElementById('creative-software').value,
            portfolioLink: document.getElementById('portfolio-link').value,
            projects: document.getElementById('creative-projects').value
        };
    }

    function collectScienceInfo() {
        resumeData.fieldSpecific.science = {
            field: document.getElementById('science-specialty').value,
            methods: document.getElementById('research-methods').value,
            publications: document.getElementById('publications').value,
            projects: document.getElementById('research-projects').value
        };
    }

    function collectSummary() {
        resumeData.summary = document.getElementById('professional-summary').value;
    }

    // Submit questionnaire to backend
    function submitQuestionnaire() {
        // Show loading state
        const submitButton = document.getElementById('submit-resume');
        submitButton.innerHTML = '<span class="spinner"></span>Processing...';
        submitButton.disabled = true;
        
        // Send data to server
        fetch('/save-answers', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ answers: resumeData })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            console.log('Answers saved successfully');
            
            // Now submit to the resume endpoint to generate a resume
            return fetch('/submit-resume', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(convertToResumeFormat(resumeData))
            });
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Resume generation failed');
            }
            return response.json();
        })
        .then(data => {
            if (data.resumeId) {
                // Redirect to template selection with the resume ID and career field
                window.location.href = `templateselection.html?resumeId=${data.resumeId}&career=${selectedCareer}`;
            } else {
                alert('Error: Failed to generate resume. Please try again.');
                submitButton.innerHTML = 'Generate Resume';
                submitButton.disabled = false;
            }
        })
        .catch(error => {
            console.error('Error submitting questionnaire:', error);
            alert('Error: Failed to submit questionnaire. Please try again.');
            submitButton.innerHTML = 'Generate Resume';
            submitButton.disabled = false;
        });
    }

    // Convert questionnaire data to resume format expected by the existing submit-resume endpoint
    function convertToResumeFormat(questionnaire) {
        const resumeFormat = {
            name: questionnaire.personalInfo.name,
            email: questionnaire.personalInfo.email,
            phone: questionnaire.personalInfo.phone,
            
            // Store career field
            careerField: questionnaire.careerField,
            
            // Education
            university: questionnaire.education[0]?.university || "",
            universityLocation: questionnaire.personalInfo.location,
            degree: questionnaire.education[0]?.degree || "",
            gpa: questionnaire.education[0]?.gpa || "",
            relevantCourse: questionnaire.education[0]?.relevantCourses || "",
            graduationDate: questionnaire.education[0]?.graduationDate || "",
            
            // Technical skills
            programmingLanguages: questionnaire.skills.technical || "",
            operatingSystems: questionnaire.skills.soft || "",
            
            // Store summary
            summary: questionnaire.summary || "",
            
            // Experience fields as arrays for multiple entries
            companyName: questionnaire.experience.map(exp => exp.companyName),
            position: questionnaire.experience.map(exp => exp.jobTitle),
            location: questionnaire.experience.map(exp => exp.location),
            responsibilities: questionnaire.experience.map(exp => exp.responsibilities),
            startDate: questionnaire.experience.map(exp => exp.dates.split('-')[0]?.trim() || ""),
            endDate: questionnaire.experience.map(exp => exp.dates.split('-')[1]?.trim() || ""),
            
            // Projects
            projectName: questionnaire.projects.map(proj => proj.projectName),
            projectDescription: questionnaire.projects.map(proj => proj.description),
            projectStartDate: questionnaire.projects.map(proj => proj.dates)
        };
        
        return resumeFormat;
    }

    // Section addition functions
    function addEducationSection() {
        alert("This function will add another education section. For simplicity, this feature is disabled in the demo.");
    }

    function addExperienceSection() {
        alert("This function will add another experience section. For simplicity, this feature is disabled in the demo.");
    }

    function addProjectSection() {
        alert("This function will add another project section. For simplicity, this feature is disabled in the demo.");
    }
}

// Initialize event listeners for questionnaire page
document.addEventListener('DOMContentLoaded', function() {
    // Questionnaire page initialization
    if (window.location.pathname.includes('questionnaire.html')) {
        initQuestionnaire();
    }
});