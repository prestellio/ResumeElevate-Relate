// utils/resumeGenerator.js
const Resume = require('../models/Resume');
const Answer = require('../models/Answer');
const axios = require('axios');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;
require('dotenv').config();

/**
 * Generates a complete resume with AI enhancement and applies it to a template
 * @param {string} resumeId - MongoDB Resume ID
 * @param {string} templateId - Template ID for formatting
 * @returns {Object} Enhanced resume content with HTML
 */
async function generateCompleteResume(resumeId, templateId) {
  try {
    console.log(`Generating complete resume for resumeId: ${resumeId}, templateId: ${templateId}`);
    
    // Step 1: Get resume data from MongoDB
    const resumeData = await Resume.findById(resumeId);
    if (!resumeData) {
      throw new Error(`Resume with ID ${resumeId} not found`);
    }
    
    // Step 2: Get template HTML from API
    const templateResponse = await axios.get(`http://localhost:${process.env.PORT || 3000}/api/templates/${templateId}`);
    
    if (!templateResponse.data.success || !templateResponse.data.content) {
      throw new Error('Failed to retrieve template content');
    }
    
    const templateHtml = templateResponse.data.content;
    
    // Step 3: Generate enhanced resume with template
    const result = await generateEnhancedResume(resumeId, templateId, templateHtml);
    
    return result;
  } catch (error) {
    console.error('Error generating complete resume:', error);
    throw error;
  }
}

/**
 * Generates an enhanced resume with AI and populates a template
 * @param {string} resumeId - MongoDB Resume ID
 * @param {string} templateId - Template ID for formatting
 * @param {string} templateHtml - HTML content of the template
 * @returns {Object} Enhanced resume content with HTML
 */
async function generateEnhancedResume(resumeId, templateId, templateHtml) {
  try {
    // Step 1: Get resume data from MongoDB
    const resumeData = await Resume.findById(resumeId);
    if (!resumeData) {
      throw new Error(`Resume with ID ${resumeId} not found`);
    }
    
    console.log(`Found resume data for ${resumeData.name}`);
    
    // Step 2: Try to get questionnaire answers that match this resume
    let questionnaireData = null;
    try {
      questionnaireData = await Answer.findOne({
        $or: [
          // Try to match by name and email
          {
            'personalInfo.name': resumeData.name,
            'personalInfo.email': resumeData.email
          },
          // Or try to match just by email
          { 'personalInfo.email': resumeData.email }
        ]
      });
      
      if (questionnaireData) {
        console.log(`Found matching questionnaire data for ${resumeData.name}`);
      } else {
        console.log('No matching questionnaire data found, will use resume data only');
      }
    } catch (err) {
      console.warn('Error finding matching questionnaire data:', err);
    }
    
    // Step 3: Combine data from both sources
    const combinedData = createCombinedData(resumeData, questionnaireData);
    
    // Step 4: Get AI enhancement from Claude
    const enhancedContent = await enhanceWithClaudeAI(combinedData);
    
    // Step 5: Apply the enhanced content to the template
    const populatedHTML = populateTemplate(templateHtml, resumeData, enhancedContent);
    
    return {
      success: true,
      resumeId,
      templateId,
      enhancedContent,
      html: populatedHTML
    };
  } catch (error) {
    console.error('Error generating enhanced resume:', error);
    throw error;
  }
}

/**
 * Combines resume and questionnaire data
 */
function createCombinedData(resumeData, questionnaireData) {
  // Base data from resume
  const combined = {
    careerField: resumeData.careerField || '',
    personalInfo: {
      name: resumeData.name || '',
      email: resumeData.email || '',
      phone: resumeData.phone || '',
      location: resumeData.education?.location || ''
    },
    summary: resumeData.summary || '',
    education: [{
      university: resumeData.education?.university || '',
      degree: resumeData.education?.degree || '',
      graduationDate: resumeData.education?.graduationDate || '',
      gpa: resumeData.education?.gpa || '',
      relevantCourses: resumeData.education?.relevantCourses || ''
    }],
    experience: resumeData.experiences?.map(exp => ({
      companyName: exp.companyName || '',
      jobTitle: exp.position || '',
      location: exp.location || '',
      dates: `${exp.startDate || ''} - ${exp.endDate || 'Present'}`,
      responsibilities: exp.responsibilities || ''
    })) || [],
    projects: resumeData.projects?.map(proj => ({
      projectName: proj.projectName || '',
      dates: proj.projectStartDate || '',
      description: proj.projectDescription || ''
    })) || [],
    skills: {
      technical: resumeData.technicalSkills?.programmingLanguages || '',
      soft: resumeData.technicalSkills?.operatingSystems || '',
      languages: '',
      certifications: ''
    }
  };
  
  // Add questionnaire data if available (supplement the resume data)
  if (questionnaireData) {
    // Fill in missing personal info
    if (!combined.personalInfo.location && questionnaireData.personalInfo?.location) {
      combined.personalInfo.location = questionnaireData.personalInfo.location;
    }
    
    // Add skills data
    if (questionnaireData.skills) {
      if (!combined.skills.languages && questionnaireData.skills.languages) {
        combined.skills.languages = questionnaireData.skills.languages;
      }
      if (!combined.skills.certifications && questionnaireData.skills.certifications) {
        combined.skills.certifications = questionnaireData.skills.certifications;
      }
    }
    
    // Add field-specific information
    if (questionnaireData.fieldSpecific) {
      combined.fieldSpecific = questionnaireData.fieldSpecific;
    }
    
    // Use questionnaire summary if resume has none
    if (!combined.summary && questionnaireData.summary) {
      combined.summary = questionnaireData.summary;
    }
  }
  
  return combined;
}

/**
 * Enhances resume data using Claude AI
 * @param {Object} resumeData - Combined resume data
 * @returns {Object} AI enhanced content
 */
async function enhanceWithClaudeAI(resumeData) {
  try {
    console.log('Calling Claude API for resume enhancement...');
    
    // Check for API key
    if (!process.env.CLAUDE_API_KEY) {
      console.warn('CLAUDE_API_KEY not found in environment variables');
      return generateFallbackContent(resumeData);
    }
    
    // Generate prompt for Claude
    const prompt = generatePrompt(resumeData);
    
    // Make API request to Claude
    const response = await axios.post(
      'https://api.anthropic.com/v1/messages',
      {
        model: "claude-3-haiku-20240307", // Use the fastest model for quicker response
        max_tokens: 4000,
        messages: [
          { role: "user", content: prompt }
        ]
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.CLAUDE_API_KEY,
          'anthropic-version': '2023-06-01'
        }
      }
    );
    
    // Extract and parse Claude's response
    const aiResponseText = response.data.content[0].text;
    
    // Try to find a JSON object in the response
    const jsonMatch = aiResponseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsedData = JSON.parse(jsonMatch[0]);
      console.log('Successfully parsed AI response');
      return parsedData;
    } else {
      console.warn('No JSON found in Claude response');
      throw new Error('Invalid response format from Claude API');
    }
  } catch (error) {
    console.error('Error calling Claude API:', error.message);
    
    // Log more details for troubleshooting
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    
    // Return fallback content
    return generateFallbackContent(resumeData);
  }
}

/**
 * Generates a prompt for Claude API based on resume data
 */
function generatePrompt(resumeData) {
  // Format education data
  let educationText = '';
  if (resumeData.education && resumeData.education.length > 0) {
    educationText = resumeData.education.map(edu => `
      - University: ${edu.university || 'Not provided'}
      - Degree: ${edu.degree || 'Not provided'}
      - Graduation Date: ${edu.graduationDate || 'Not provided'}
      - GPA: ${edu.gpa || 'Not provided'}
      - Relevant Courses: ${edu.relevantCourses || 'Not provided'}
    `).join('\n');
  } else {
    educationText = 'Not provided';
  }
  
  // Format experience data
  let experienceText = '';
  if (resumeData.experience && resumeData.experience.length > 0) {
    experienceText = resumeData.experience.map(exp => `
      - Company: ${exp.companyName || 'Not provided'}
      - Position: ${exp.jobTitle || 'Not provided'}
      - Location: ${exp.location || 'Not provided'}
      - Dates: ${exp.dates || 'Not provided'}
      - Responsibilities: ${exp.responsibilities || 'Not provided'}
    `).join('\n');
  } else {
    experienceText = 'Not provided';
  }
  
  // Format projects data
  let projectsText = '';
  if (resumeData.projects && resumeData.projects.length > 0) {
    projectsText = resumeData.projects.map(proj => `
      - Project Name: ${proj.projectName || 'Not provided'}
      - Dates: ${proj.dates || 'Not provided'}
      - Description: ${proj.description || 'Not provided'}
    `).join('\n');
  } else {
    projectsText = 'Not provided';
  }

  return `
    You are a professional resume writer with expertise in creating compelling, achievement-oriented resumes tailored to specific career fields. Your goal is to enhance the resume content provided by making it more professional, impactful, and focused on accomplishments.

    Please create an enhanced resume based on the following information provided by the user:
    
    Career Field: ${resumeData.careerField || 'professional'}
    
    Personal Information:
    - Name: ${resumeData.personalInfo?.name || 'Not provided'}
    - Email: ${resumeData.personalInfo?.email || 'Not provided'}
    - Phone: ${resumeData.personalInfo?.phone || 'Not provided'}
    - Location: ${resumeData.personalInfo?.location || 'Not provided'}
    
    Education:
    ${educationText}
    
    Work Experience:
    ${experienceText}
    
    Projects:
    ${projectsText}
    
    Skills:
    - Technical Skills: ${resumeData.skills?.technical || 'Not provided'}
    - Soft Skills: ${resumeData.skills?.soft || 'Not provided'}
    - Languages: ${resumeData.skills?.languages || 'Not provided'}
    - Certifications: ${resumeData.skills?.certifications || 'Not provided'}
    
    Professional Summary:
    ${resumeData.summary || 'Not provided'}
    
    Return ONLY a JSON object with the following structure:
    {
      "summary": "An enhanced professional summary that highlights key qualifications and career goals",
      "education": [
        {
          "university": "University name",
          "degree": "Degree",
          "graduationDate": "Graduation date",
          "gpa": "GPA",
          "relevantCourses": "Enhanced relevant courses"
        }
      ],
      "experience": [
        {
          "companyName": "Company name",
          "jobTitle": "Enhanced job title",
          "location": "Location",
          "dates": "Dates",
          "responsibilities": ["Responsibility 1 with achievement", "Responsibility 2 with achievement", "Responsibility 3 with achievement"]
        }
      ],
      "skills": {
        "technical": ["Enhanced technical skill 1", "Enhanced technical skill 2"],
        "soft": ["Enhanced soft skill 1", "Enhanced soft skill 2"],
        "languages": ["Language 1", "Language 2"],
        "certifications": ["Certification 1", "Certification 2"]
      },
      "projects": [
        {
          "projectName": "Enhanced project name",
          "dates": "Dates",
          "description": ["Description point 1 with impact", "Description point 2 with impact"]
        }
      ]
    }
    
    IMPORTANT: Return ONLY the JSON object without any additional text before or after. Make sure responsibilities and descriptions are presented as arrays of bullet points, not as single strings.
  `;
}

/**
 * Generates fallback content if Claude API fails
 */
function generateFallbackContent(resumeData) {
  console.log('Generating fallback enhanced content');
  
  // Create a basic enhanced version of the resume data
  return {
    summary: resumeData.summary || 
      `Results-driven ${resumeData.careerField || 'professional'} with a proven track record of delivering high-quality solutions. Combines technical expertise with excellent communication skills to collaborate effectively with cross-functional teams.`,
    
    education: resumeData.education.map(edu => ({
      university: edu.university || "University",
      degree: edu.degree || "Degree",
      graduationDate: edu.graduationDate || "Graduation Date",
      gpa: edu.gpa || "GPA",
      relevantCourses: edu.relevantCourses || "Relevant coursework in key areas of study"
    })),
    
    experience: resumeData.experience.map(exp => ({
      companyName: exp.companyName || "Company",
      jobTitle: exp.jobTitle || "Position",
      location: exp.location || "Location",
      dates: exp.dates || "Dates",
      responsibilities: typeof exp.responsibilities === 'string' ? 
        exp.responsibilities.split('\n').filter(item => item.trim().length > 0) : 
        [
          `Led key initiatives that improved processes and outcomes`,
          `Collaborated with cross-functional teams to achieve objectives`,
          `Implemented innovative solutions to complex problems`
        ]
    })),
    
    skills: {
      technical: typeof resumeData.skills?.technical === 'string' ? 
        resumeData.skills.technical.split(',').map(s => s.trim()) : 
        ["Technical skill 1", "Technical skill 2", "Technical skill 3"],
      
      soft: typeof resumeData.skills?.soft === 'string' ? 
        resumeData.skills.soft.split(',').map(s => s.trim()) : 
        ["Communication", "Problem-solving", "Teamwork", "Leadership"],
      
      languages: typeof resumeData.skills?.languages === 'string' ? 
        resumeData.skills.languages.split(',').map(s => s.trim()) : 
        [],
      
      certifications: typeof resumeData.skills?.certifications === 'string' ? 
        resumeData.skills.certifications.split(',').map(s => s.trim()) : 
        []
    },
    
    projects: resumeData.projects.map(proj => ({
      projectName: proj.projectName || "Project",
      dates: proj.dates || "Dates",
      description: typeof proj.description === 'string' ? 
        proj.description.split('\n').filter(item => item.trim().length > 0) : 
        [
          "Developed solution that addressed key business needs",
          "Implemented using industry best practices and modern technologies"
        ]
    }))
  };
}

/**
 * Populates template HTML with user data and AI-enhanced content
 */
function populateTemplate(templateHtml, userData, enhancedContent) {
  // Create a DOM document from the HTML string
  const dom = new JSDOM(templateHtml);
  const document = dom.window.document;
  
  // Helper function to update text content if element exists
  const updateElementText = (selector, content) => {
    const elements = document.querySelectorAll(selector);
    if (elements.length > 0) {
      elements.forEach(element => {
        if (content) {
          element.textContent = content;
        }
      });
      return true;
    }
    return false;
  };
  
  // Helper function to create list items from array
  const createListItems = (items) => {
    if (!items || !Array.isArray(items)) return '';
    return items.map(item => `<li>${item}</li>`).join('');
  };
  
  // Update personal information - try multiple possible selectors
  const nameSelectors = ['h1', '.name', '.resume-header h1', 'header h1', '.header .name'];
  const contactSelectors = ['.contact', '.resume-header p', 'header p', '.contact-info'];
  
  // Try each selector for name
  let nameUpdated = false;
  for (const selector of nameSelectors) {
    if (updateElementText(selector, userData.name)) {
      nameUpdated = true;
      break;
    }
  }
  
  // If name not updated with any selector, look for any h1 and update it
  if (!nameUpdated) {
    const h1Elements = document.querySelectorAll('h1');
    if (h1Elements.length > 0) {
      h1Elements[0].textContent = userData.name;
    }
  }
  
  // Create contact line with available information
  const email = userData.email || '';
  const phone = userData.phone || '';
  const location = userData.education?.location || '';
  const contactLine = [email, phone, location].filter(Boolean).join(' | ');
  
  // Try each selector for contact info
  let contactUpdated = false;
  for (const selector of contactSelectors) {
    const elements = document.querySelectorAll(selector);
    for (const element of elements) {
      // Only update if it looks like contact info 
      // (contains @ symbol, phone, example.com, or placeholder text)
      if (element.textContent.includes('@') || 
          element.textContent.includes('phone') || 
          element.textContent.includes('123') || 
          element.textContent.includes('example.com') ||
          element.textContent.includes('City, State')) {
        element.textContent = contactLine;
        contactUpdated = true;
        break;
      }
    }
    if (contactUpdated) break;
  }
  
  // If contact info not updated, try to add it after the name
  if (!contactUpdated) {
    const nameElement = document.querySelector('h1') || document.querySelector('.name');
    if (nameElement) {
      const contactElement = document.createElement('p');
      contactElement.className = 'contact';
      contactElement.textContent = contactLine;
      nameElement.parentNode.insertBefore(contactElement, nameElement.nextSibling);
    }
  }
  
  // Update professional summary - find the section by keyword
  const sectionTitles = document.querySelectorAll('.section-title, h2, .resume-section-title');
  for (const element of sectionTitles) {
    if (element.textContent.toLowerCase().includes('summary') || 
        element.textContent.toLowerCase().includes('profile')) {
      // Found the summary section, now find the paragraph to update
      const parentSection = element.closest('.section') || 
                          element.closest('.resume-section') || 
                          element.parentElement;
      
      if (parentSection) {
        const summaryParagraph = parentSection.querySelector('p');
        if (summaryParagraph) {
          summaryParagraph.textContent = enhancedContent.summary || userData.summary || 'Professional summary';
        }
      }
      break;
    }
  }
  
  // Update education section
  if (enhancedContent.education && enhancedContent.education.length > 0) {
    // Find education section
    let educationSection = null;
    for (const element of sectionTitles) {
      if (element.textContent.toLowerCase().includes('education')) {
        educationSection = element.closest('.section') || 
                         element.closest('.resume-section') || 
                         element.parentElement;
        break;
      }
    }
    
    if (educationSection) {
      // Clear existing education items if they have placeholders
      const educationItems = educationSection.querySelectorAll('.resume-item, .list-item, .entry');
      let shouldClearItems = false;
      
      for (const item of educationItems) {
        const text = item.textContent.toLowerCase();
        if (text.includes('university name') || 
            text.includes('degree') || 
            text.includes('gpa') ||
            text.includes('graduation')) {
          shouldClearItems = true;
          break;
        }
      }
      
      if (shouldClearItems) {
        for (const item of educationItems) {
          item.remove();
        }
        
        // Create new education section based on the first education item structure
        if (educationItems.length > 0) {
          const templateItem = educationItems[0].cloneNode(true);
          
          // Add enhanced education items
          enhancedContent.education.forEach(edu => {
            const educationItem = templateItem.cloneNode(true);
            
            // Try to update university name, degree, etc.
            const universityElements = educationItem.querySelectorAll('.resume-item-title, .entry-title');
            if (universityElements.length > 0) {
              universityElements[0].textContent = edu.university;
            }
            
            const degreeElements = educationItem.querySelectorAll('.resume-item-subtitle');
            if (degreeElements.length > 0) {
              degreeElements[0].textContent = edu.degree;
            } else {
              // If no subtitle element, try to find a div with text that looks like a degree
              const divs = educationItem.querySelectorAll('div');
              for (const div of divs) {
                if (div.textContent.includes('Bachelor') || 
                    div.textContent.includes('Master') ||
                    div.textContent.includes('Degree')) {
                  div.textContent = edu.degree;
                  break;
                }
              }
            }
            
            // Update graduation date
            const dateElements = educationItem.querySelectorAll('.resume-item-date');
            if (dateElements.length > 0) {
              dateElements[0].textContent = edu.graduationDate;
            }
            
            // Update GPA
            const gpaElements = educationItem.querySelectorAll('div');
            for (const div of gpaElements) {
              if (div.textContent.includes('GPA')) {
                div.textContent = `GPA: ${edu.gpa}`;
                break;
              }
            }
            
            // Update courses in a list if one exists
            const ulElements = educationItem.querySelectorAll('ul');
            if (ulElements.length > 0) {
              ulElements[0].innerHTML = `<li>Relevant coursework: ${edu.relevantCourses}</li>`;
            }
            
            educationSection.appendChild(educationItem);
          });
        } else {
          // Create a simple education item
          enhancedContent.education.forEach(edu => {
            const educationItem = document.createElement('div');
            educationItem.className = 'resume-item';
            educationItem.innerHTML = `
              <div class="resume-item-header">
                <div class="resume-item-title">${edu.university}</div>
                <div class="resume-item-date">${edu.graduationDate}</div>
              </div>
              <div class="resume-item-subtitle">${edu.degree}</div>
              <div>GPA: ${edu.gpa}</div>
              <ul>
                <li>Relevant coursework: ${edu.relevantCourses}</li>
              </ul>
            `;
            educationSection.appendChild(educationItem);
          });
        }
      } else {
        // Just update existing education item content
        const universityElements = educationSection.querySelectorAll('.resume-item-title, .entry-title');
        if (universityElements.length > 0 && enhancedContent.education[0]) {
          universityElements[0].textContent = enhancedContent.education[0].university;
        }
        
        const degreeElements = educationSection.querySelectorAll('.resume-item-subtitle');
        if (degreeElements.length > 0 && enhancedContent.education[0]) {
          degreeElements[0].textContent = enhancedContent.education[0].degree;
        }
      }
    }
  }
  
  // Update experience section
  if (enhancedContent.experience && enhancedContent.experience.length > 0) {
    // Find experience section
    let experienceSection = null;
    for (const element of sectionTitles) {
      if (element.textContent.toLowerCase().includes('experience') || 
          element.textContent.toLowerCase().includes('work')) {
        experienceSection = element.closest('.section') || 
                          element.closest('.resume-section') || 
                          element.parentElement;
        break;
      }
    }
    
    if (experienceSection) {
      // Clear existing experience items
      const experienceItems = experienceSection.querySelectorAll('.resume-item, .experience-item, .entry');
      
      // Check if we should remove existing items (if they contain placeholder content)
      let shouldClearItems = false;
      for (const item of experienceItems) {
        const text = item.textContent.toLowerCase();
        if (text.includes('job title') || 
            text.includes('company name') || 
            text.includes('position') ||
            text.includes('responsibilities')) {
          shouldClearItems = true;
          break;
        }
      }
      
      if (shouldClearItems && experienceItems.length > 0) {
        // Clear out existing placeholder items
        for (const item of experienceItems) {
          item.remove();
        }
        
        // Add enhanced experience items
        if (experienceItems.length > 0) {
          // Use the first item as a template
          const templateItem = experienceItems[0].cloneNode(true);
          
          enhancedContent.experience.forEach(exp => {
            const experienceItem = templateItem.cloneNode(true);
            
            // Update job title
            const titleElements = experienceItem.querySelectorAll('.resume-item-title, .experience-title, .entry-title');
            if (titleElements.length > 0) {
              titleElements[0].textContent = exp.jobTitle;
            }
            
            // Update company and location
            const subtitleElements = experienceItem.querySelectorAll('.resume-item-subtitle');
            if (subtitleElements.length > 0) {
              subtitleElements[0].textContent = `${exp.companyName}, ${exp.location}`;
            }
            
            // Update dates
            const dateElements = experienceItem.querySelectorAll('.resume-item-date');
            if (dateElements.length > 0) {
              dateElements[0].textContent = exp.dates;
            }
            
            // Update responsibilities
            const ulElements = experienceItem.querySelectorAll('ul');
            if (ulElements.length > 0) {
              ulElements[0].innerHTML = createListItems(exp.responsibilities);
            }
            
            experienceSection.appendChild(experienceItem);
          });
        } else {
          // Create simple experience items
          enhancedContent.experience.forEach(exp => {
            const experienceItem = document.createElement('div');
            experienceItem.className = 'resume-item';
            experienceItem.innerHTML = `
              <div class="resume-item-header">
                <div class="resume-item-title">${exp.jobTitle}</div>
                <div class="resume-item-date">${exp.dates}</div>
              </div>
              <div class="resume-item-subtitle">${exp.companyName}, ${exp.location}</div>
              <ul>
                ${createListItems(exp.responsibilities)}
              </ul>
            `;
            experienceSection.appendChild(experienceItem);
          });
        }
      } else {
        // Just update existing content
        const experienceArray = Array.from(experienceItems);
        enhancedContent.experience.forEach((exp, index) => {
          if (index < experienceArray.length) {
            const item = experienceArray[index];
            
            // Update job title
            const titleElements = item.querySelectorAll('.resume-item-title, .experience-title, .entry-title');
            if (titleElements.length > 0) {
              titleElements[0].textContent = exp.jobTitle;
            }
            
            // Update company and location
            const subtitleElements = item.querySelectorAll('.resume-item-subtitle');
            if (subtitleElements.length > 0) {
              subtitleElements[0].textContent = `${exp.companyName}, ${exp.location}`;
            }
            
            // Update dates
            const dateElements = item.querySelectorAll('.resume-item-date');
            if (dateElements.length > 0) {
              dateElements[0].textContent = exp.dates;
            }
            
            // Update responsibilities
            const ulElements = item.querySelectorAll('ul');
            if (ulElements.length > 0) {
              ulElements[0].innerHTML = createListItems(exp.responsibilities);
            }
          }
        });
      }
    }
  }
  
  // Update skills section
  let skillsSection = null;
  for (const element of sectionTitles) {
    if (element.textContent.toLowerCase().includes('skills') || 
        element.textContent.toLowerCase().includes('abilities')) {
      skillsSection = element.closest('.section') || 
                    element.closest('.resume-section') || 
                    element.parentElement;
      break;
    }
  }
  
  if (skillsSection && enhancedContent.skills) {
    const skillsList = skillsSection.querySelector('ul');
    if (skillsList) {
      let skillsHtml = '';
      
      // Add technical skills
      if (enhancedContent.skills.technical && enhancedContent.skills.technical.length > 0) {
        const technicalArray = Array.isArray(enhancedContent.skills.technical) ? 
          enhancedContent.skills.technical : [enhancedContent.skills.technical];
        skillsHtml += `<li><strong>Technical:</strong> ${technicalArray.join(', ')}</li>`;
      }
      
      // Add soft skills
      if (enhancedContent.skills.soft && enhancedContent.skills.soft.length > 0) {
        const softArray = Array.isArray(enhancedContent.skills.soft) ? 
          enhancedContent.skills.soft : [enhancedContent.skills.soft];
        skillsHtml += `<li><strong>Soft Skills:</strong> ${softArray.join(', ')}</li>`;
      }
      
      // Add languages if available
      if (enhancedContent.skills.languages && enhancedContent.skills.languages.length > 0 && 
          enhancedContent.skills.languages[0] !== '') {
        const languagesArray = Array.isArray(enhancedContent.skills.languages) ? 
          enhancedContent.skills.languages : [enhancedContent.skills.languages];
        skillsHtml += `<li><strong>Languages:</strong> ${languagesArray.join(', ')}</li>`;
      }
      
      // Add certifications if available
      if (enhancedContent.skills.certifications && enhancedContent.skills.certifications.length > 0 && 
          enhancedContent.skills.certifications[0] !== '') {
        const certsArray = Array.isArray(enhancedContent.skills.certifications) ? 
          enhancedContent.skills.certifications : [enhancedContent.skills.certifications];
        skillsHtml += `<li><strong>Certifications:</strong> ${certsArray.join(', ')}</li>`;
      }
      
      if (skillsHtml) {
        skillsList.innerHTML = skillsHtml;
      }
    }
  }
  
  // Update projects section
  let projectsSection = null;
  for (const element of sectionTitles) {
    if (element.textContent.toLowerCase().includes('project') || 
        element.textContent.toLowerCase().includes('portfolio')) {
      projectsSection = element.closest('.section') || 
                      element.closest('.resume-section') || 
                      element.parentElement;
      break;
    }
  }
  
  if (projectsSection && enhancedContent.projects && enhancedContent.projects.length > 0) {
    const projectItems = projectsSection.querySelectorAll('.resume-item, .project-item, .entry');
    
    // Check if we should clear out existing items
    let shouldClearItems = false;
    for (const item of projectItems) {
      const text = item.textContent.toLowerCase();
      if (text.includes('project name') || 
          text.includes('project description') || 
          text.includes('description point')) {
        shouldClearItems = true;
        break;
      }
    }
    
    if (shouldClearItems) {
      // Clear existing items
      for (const item of projectItems) {
        item.remove();
      }
      
      // Add enhanced project items
      if (projectItems.length > 0) {
        // Use the first item as a template
        const templateItem = projectItems[0].cloneNode(true);
        
        enhancedContent.projects.forEach(project => {
          const projectItem = templateItem.cloneNode(true);
          
          // Update project title
          const titleElements = projectItem.querySelectorAll('.resume-item-title, .project-title, .entry-title');
          if (titleElements.length > 0) {
            titleElements[0].textContent = project.projectName;
          }
          
          // Update dates
          const dateElements = projectItem.querySelectorAll('.resume-item-date');
          if (dateElements.length > 0) {
            dateElements[0].textContent = project.dates;
          }
          
          // Update description
          const ulElements = projectItem.querySelectorAll('ul');
          if (ulElements.length > 0) {
            ulElements[0].innerHTML = createListItems(project.description);
          }
          
          projectsSection.appendChild(projectItem);
        });
      } else {
        // Create simple project items
        enhancedContent.projects.forEach(project => {
          const projectItem = document.createElement('div');
          projectItem.className = 'resume-item';
          projectItem.innerHTML = `
            <div class="resume-item-header">
              <div class="resume-item-title">${project.projectName}</div>
              <div class="resume-item-date">${project.dates}</div>
            </div>
            <ul>
              ${createListItems(project.description)}
            </ul>
          `;
          projectsSection.appendChild(projectItem);
        });
      }
    } else {
      // Just update existing content
      const projectArray = Array.from(projectItems);
      enhancedContent.projects.forEach((project, index) => {
        if (index < projectArray.length) {
          const item = projectArray[index];
          
          // Update project title
          const titleElements = item.querySelectorAll('.resume-item-title, .project-title, .entry-title');
          if (titleElements.length > 0) {
            titleElements[0].textContent = project.projectName;
          }
          
          // Update dates
          const dateElements = item.querySelectorAll('.resume-item-date');
          if (dateElements.length > 0) {
            dateElements[0].textContent = project.dates;
          }
          
          // Update description
          const ulElements = item.querySelectorAll('ul');
          if (ulElements.length > 0) {
            ulElements[0].innerHTML = createListItems(project.description);
          }
        }
      });
    }
  }
  
  // Return the serialized HTML
  return dom.serialize();
}

module.exports = {
  generateEnhancedResume,
  generateCompleteResume
};