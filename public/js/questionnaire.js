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
        // Get all education sections
        const educationSections = document.querySelectorAll('#education-sections .section-container');
        
        resumeData.education = []; // Clear existing education data
        
        // Iterate through each education section
        educationSections.forEach(section => {
            // Find the inputs within this section specifically
            const university = section.querySelector('input[id^="university"]')?.value || '';
            const degree = section.querySelector('input[id^="degree"]')?.value || '';
            const graduationDate = section.querySelector('input[id^="graduation-date"]')?.value || '';
            const gpa = section.querySelector('input[id^="gpa"]')?.value || '';
            const relevantCourses = section.querySelector('input[id^="relevant-courses"]')?.value || '';
            
            const edu = {
                university,
                degree,
                graduationDate,
                gpa,
                relevantCourses
            };
            
            resumeData.education.push(edu);
        });
        
        console.log("Collected education data:", JSON.stringify(resumeData.education));
    }
    
    function collectExperienceInfo() {
        // Get all experience sections
        const experienceSections = document.querySelectorAll('#experience-sections .section-container');
        
        resumeData.experience = []; // Clear existing experience data
        
        // Iterate through each experience section
        experienceSections.forEach(section => {
            // Find the inputs within this section specifically
            const companyName = section.querySelector('input[id^="company-name"]')?.value || '';
            const jobTitle = section.querySelector('input[id^="job-title"]')?.value || '';
            const location = section.querySelector('input[id^="job-location"]')?.value || '';
            const dates = section.querySelector('input[id^="employment-dates"]')?.value || '';
            const responsibilities = section.querySelector('textarea[id^="job-responsibilities"]')?.value || '';
            
            const exp = {
                companyName,
                jobTitle,
                location,
                dates,
                responsibilities
            };
            
            resumeData.experience.push(exp);
        });
        
        console.log("Collected experience data:", JSON.stringify(resumeData.experience));
    }
    
    function collectProjectsInfo() {
        // Get all project sections
        const projectSections = document.querySelectorAll('#project-sections .section-container');
        
        resumeData.projects = []; // Clear existing projects data
        
        // Iterate through each project section
        projectSections.forEach(section => {
            // Find the inputs within this section specifically
            const projectName = section.querySelector('input[id^="project-name"]')?.value || '';
            const dates = section.querySelector('input[id^="project-dates"]')?.value || '';
            const description = section.querySelector('textarea[id^="project-description"]')?.value || '';
            
            const proj = {
                projectName,
                dates,
                description
            };
            
            resumeData.projects.push(proj);
        });
        
        console.log("Collected projects data:", JSON.stringify(resumeData.projects));
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

// UPDATED: Enhanced version of submitQuestionnaire with AI integration
function submitQuestionnaire() {
    // Collect all data before submitting
    collectPersonalInfo();
    collectEducationInfo();
    collectExperienceInfo();
    collectProjectsInfo();
    collectSkillsInfo();
    
    // If a field-specific collection function exists for the selected career field, call it
    if (resumeData.careerField === 'engineering' && typeof collectEngineeringInfo === 'function') {
        collectEngineeringInfo();
    } else if (resumeData.careerField === 'business' && typeof collectBusinessInfo === 'function') {
        collectBusinessInfo();
    } else if (resumeData.careerField === 'technology' && typeof collectTechnologyInfo === 'function') {
        collectTechnologyInfo();
    } else if (resumeData.careerField === 'healthcare' && typeof collectHealthcareInfo === 'function') {
        collectHealthcareInfo();
    } else if (resumeData.careerField === 'education' && typeof collectEducationFieldInfo === 'function') {
        collectEducationFieldInfo();
    } else if (resumeData.careerField === 'arts' && typeof collectArtsInfo === 'function') {
        collectArtsInfo();
    } else if (resumeData.careerField === 'science' && typeof collectScienceInfo === 'function') {
        collectScienceInfo();
    }
    
    // Collect summary information
    collectSummary();

    // Log the complete data to verify it's all there
    console.log('Complete resume data to submit:', JSON.stringify(resumeData, null, 2));
    
    // Show loading state
    const submitButton = document.getElementById('submit-resume');
    submitButton.innerHTML = '<span class="spinner"></span>Processing...';
    submitButton.disabled = true;
    
    // Save key information in session storage for easy access
    sessionStorage.setItem('userName', resumeData.personalInfo.name || '');
    sessionStorage.setItem('userEmail', resumeData.personalInfo.email || '');
    sessionStorage.setItem('userPhone', resumeData.personalInfo.phone || '');
    sessionStorage.setItem('userLocation', resumeData.personalInfo.location || '');
    sessionStorage.setItem('careerField', resumeData.careerField || '');
    
    // First save the user's answers to the database
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
        
        // Now send data to Claude AI for enhancement
        console.log('Sending data to Claude AI endpoint...');
        return fetch('/api/ai/resume/generate-resume', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(resumeData)
        });
    })
    .then(response => {
        console.log('AI response status:', response.status);
        if (!response.ok) {
            console.error('AI response not OK:', response.statusText);
            throw new Error('AI enhancement failed');
        }
        return response.json();
    })
    .then(aiData => {
        console.log('AI data received:', aiData);
        
        // Store enhanced content in session storage for use in template selection
        if (aiData.success && aiData.enhancedContent) {
            sessionStorage.setItem('enhancedContent', JSON.stringify(aiData.enhancedContent));
            
            // Now submit to the resume endpoint with the enhanced content
            return fetch('/submit-resume', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(convertToResumeFormat(resumeData, aiData.enhancedContent))
            });
        } else {
            throw new Error('Invalid AI response format');
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Resume generation failed');
        }
        return response.json();
    })
    .then(data => {
        if (data.resumeId) {
            // Add the career field to the redirect URL
            window.location.href = `templateselection.html?resumeId=${data.resumeId}&career=${resumeData.careerField}`;
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

    // NEW: Function to convert data to the resume format
    function convertToResumeFormat(questionnaire, enhancedContent) {
        // Start with the original conversion
        const resumeFormat = {
            name: questionnaire.personalInfo.name,
            email: questionnaire.personalInfo.email,
            phone: questionnaire.personalInfo.phone,
            
            // Store career field
            careerField: questionnaire.careerField,
            
            // Enhanced summary from AI
            summary: enhancedContent.summary || questionnaire.summary || "",
            
            // Basic education info
            university: questionnaire.education[0]?.university || "",
            universityLocation: questionnaire.personalInfo.location,
            degree: questionnaire.education[0]?.degree || "",
            gpa: questionnaire.education[0]?.gpa || "",
            
            // Enhanced relevant courses
            relevantCourse: enhancedContent.education[0]?.relevantCourses || 
                questionnaire.education[0]?.relevantCourses || "",
            
            graduationDate: questionnaire.education[0]?.graduationDate || "",
            
            // Enhanced skills
            programmingLanguages: Array.isArray(enhancedContent.skills?.technical) ? 
                enhancedContent.skills.technical.join(", ") : 
                (enhancedContent.skills?.technical || questionnaire.skills.technical || ""),
            
            operatingSystems: Array.isArray(enhancedContent.skills?.soft) ? 
                enhancedContent.skills.soft.join(", ") : 
                (enhancedContent.skills?.soft || questionnaire.skills.soft || ""),
            
            // Enhanced experience fields as arrays for multiple entries
            companyName: enhancedContent.experience?.map(exp => exp.companyName) || 
                questionnaire.experience.map(exp => exp.companyName || ""),
            
            position: enhancedContent.experience?.map(exp => exp.jobTitle) || 
                questionnaire.experience.map(exp => exp.jobTitle || ""),
            
            location: enhancedContent.experience?.map(exp => exp.location) || 
                questionnaire.experience.map(exp => exp.location || ""),
            
            // Enhanced responsibilities as bullet points
            responsibilities: enhancedContent.experience?.map(exp => 
                Array.isArray(exp.responsibilities) ? exp.responsibilities.join("\n") : 
                (exp.responsibilities || "")) || 
                questionnaire.experience.map(exp => exp.responsibilities || ""),
            
            // Parse dates into start and end
            startDate: questionnaire.experience.map(exp => {
                const dates = exp.dates || "";
                return dates.split('-')[0]?.trim() || "";
            }),
            
            endDate: questionnaire.experience.map(exp => {
                const dates = exp.dates || "";
                return dates.split('-')[1]?.trim() || "Present";
            }),
            
            // Enhanced projects
            projectName: enhancedContent.projects?.map(proj => proj.projectName) || 
                questionnaire.projects.map(proj => proj.projectName || ""),
            
            projectDescription: enhancedContent.projects?.map(proj => 
                Array.isArray(proj.description) ? proj.description.join("\n") : 
                (proj.description || "")) || 
                questionnaire.projects.map(proj => proj.description || ""),
            
            projectStartDate: questionnaire.projects.map(proj => proj.dates || "")
        };
        
        // Also store the full enhanced content for template filling
        resumeFormat.enhancedContent = JSON.stringify(enhancedContent);
        
        return resumeFormat;
    }

    // Section addition functions
    function addEducationSection() {
        const educationSections = document.getElementById('education-sections');
        const existingSections = educationSections.querySelectorAll('.section-container');
        const newSection = existingSections[0].cloneNode(true);
        
        // Clear input values in the new section
        newSection.querySelectorAll('input, textarea').forEach(input => {
            input.value = '';
            // Update IDs to make them unique
            if (input.id) {
                input.id = input.id + '-' + (existingSections.length + 1);
            }
        });
        
        // Add a remove button to the new section
        const removeBtn = document.createElement('button');
        removeBtn.innerHTML = 'Remove';
        removeBtn.className = 'remove-btn';
        removeBtn.onclick = function() {
            this.parentNode.remove();
        };
        newSection.appendChild(removeBtn);
        
        educationSections.appendChild(newSection);
    }

    function addExperienceSection() {
        const experienceSections = document.getElementById('experience-sections');
        const existingSections = experienceSections.querySelectorAll('.section-container');
        const newSection = existingSections[0].cloneNode(true);
        
        // Clear input values in the new section
        newSection.querySelectorAll('input, textarea').forEach(input => {
            input.value = '';
            // Update IDs to make them unique
            if (input.id) {
                input.id = input.id + '-' + (existingSections.length + 1);
            }
        });
        
        // Add a remove button to the new section
        const removeBtn = document.createElement('button');
        removeBtn.innerHTML = 'Remove';
        removeBtn.className = 'remove-btn';
        removeBtn.onclick = function() {
            this.parentNode.remove();
        };
        newSection.appendChild(removeBtn);
        
        experienceSections.appendChild(newSection);
    }

    function addProjectSection() {
        const projectSections = document.getElementById('project-sections');
        const existingSections = projectSections.querySelectorAll('.section-container');
        const newSection = existingSections[0].cloneNode(true);
        
        // Clear input values in the new section
        newSection.querySelectorAll('input, textarea').forEach(input => {
            input.value = '';
            // Update IDs to make them unique
            if (input.id) {
                input.id = input.id + '-' + (existingSections.length + 1);
            }
        });
        
        // Add a remove button to the new section
        const removeBtn = document.createElement('button');
        removeBtn.innerHTML = 'Remove';
        removeBtn.className = 'remove-btn';
        removeBtn.onclick = function() {
            this.parentNode.remove();
        };
        newSection.appendChild(removeBtn);
        
        projectSections.appendChild(newSection);
    }
}

// Initialize event listeners for questionnaire page
document.addEventListener('DOMContentLoaded', function() {
    // Questionnaire page initialization
    if (window.location.pathname.includes('questionnaire.html')) {
        initQuestionnaire();
    }
});