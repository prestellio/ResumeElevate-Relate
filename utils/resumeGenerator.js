// utils/resumeGenerator.js
const Resume = require('../models/Resume');
const Answer = require('../models/Answer');
const axios = require('axios');
require('dotenv').config();

/**
 * Generates a complete resume with AI enhancement
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
                'personalInfo.name': resumeData.name,
                'personalInfo.email': resumeData.email
            });
            
            if (questionnaireData) {
                console.log(`Found matching questionnaire data for ${resumeData.name}`);
            }
        } catch (err) {
            console.warn('Error finding matching questionnaire data:', err);
        }
        
        // Step 3: Combine data from both sources
        const combinedData = createCombinedData(resumeData, questionnaireData);
        
        // Step 4: Get AI enhancement from Claude
        const enhancedContent = await enhanceWithClaudeAI(combinedData);
        
        // Step 5: Apply the enhanced content to the template
        const populatedHTML = populateTemplate(templateHtml, enhancedContent);
        
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
                model: "claude-3-haiku-20240307",
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
            return JSON.parse(jsonMatch[0]);
        } else {
            console.warn('No JSON found in Claude response');
            throw new Error('Invalid response format from Claude API');
        }
    } catch (error) {
        console.error('Error calling Claude API:', error);
        return generateFallbackContent(resumeData);
    }
}

/**
 * Generates a prompt for Claude API based on resume data
 */
function generatePrompt(resumeData) {
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
        ${resumeData.education.map(edu => `
          - University: ${edu.university || 'Not provided'}
          - Degree: ${edu.degree || 'Not provided'}
          - Graduation Date: ${edu.graduationDate || 'Not provided'}
          - GPA: ${edu.gpa || 'Not provided'}
          - Relevant Courses: ${edu.relevantCourses || 'Not provided'}
        `).join('\n')}
        
        Work Experience:
        ${resumeData.experience.map(exp => `
          - Company: ${exp.companyName || 'Not provided'}
          - Position: ${exp.jobTitle || 'Not provided'}
          - Location: ${exp.location || 'Not provided'}
          - Dates: ${exp.dates || 'Not provided'}
          - Responsibilities: ${exp.responsibilities || 'Not provided'}
        `).join('\n')}
        
        Projects:
        ${resumeData.projects.map(proj => `
          - Project Name: ${proj.projectName || 'Not provided'}
          - Dates: ${proj.dates || 'Not provided'}
          - Description: ${proj.description || 'Not provided'}
        `).join('\n')}
        
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
 * Populates template with enhanced content
 */
function populateTemplate(templateHtml, enhancedContent) {
    let populatedHtml = templateHtml;
    
    // Replace personal information placeholders
    populatedHtml = populatedHtml.replace(/Your (Full )?Name|YOUR NAME/g, enhancedContent.personalInfo?.name || 'Your Name');
    populatedHtml = populatedHtml.replace(/youremail@example\.com|Email@domain\.tld/g, enhancedContent.personalInfo?.email || 'email@example.com');
    populatedHtml = populatedHtml.replace(/\(123\) 456-7890|\(Num\)ber-call/g, enhancedContent.personalInfo?.phone || '(123) 456-7890');
    populatedHtml = populatedHtml.replace(/Wichita, Kansas|City, State/g, enhancedContent.personalInfo?.location || 'City, State');
    
    // Replace summary section
    const summary = enhancedContent.summary || 'Professional summary';
    populatedHtml = populatedHtml.replace(
        /Dedicated professional with experience in \[your field\].*?results\./g, 
        summary
    );
    populatedHtml = populatedHtml.replace(
        /Experienced \[your profession\].*?career goal\./g, 
        summary
    );
    populatedHtml = populatedHtml.replace(
        /Results-driven professional with.*?outcomes\./g, 
        summary
    );
    
    // For education, we need to find and replace the education section
    if (enhancedContent.education && enhancedContent.education.length > 0) {
        // This is a simplified approach - a more robust solution would use DOM parsing
        const educationSectionRegex = /<div[^>]*class="resume-section"[^>]*>[\s\S]*?<h2[^>]*>Education<\/h2>[\s\S]*?<\/div>/i;
        const educationMatch = templateHtml.match(educationSectionRegex);
        
        if (educationMatch) {
            let educationHtml = '';
            
            enhancedContent.education.forEach(edu => {
                educationHtml += `
                <div class="resume-item">
                    <div class="resume-item-header">
                        <div class="resume-item-title">${edu.university}</div>
                        <div class="resume-item-date">Graduation: ${edu.graduationDate}</div>
                    </div>
                    <div class="resume-item-subtitle">${edu.degree}</div>
                    <div>GPA: ${edu.gpa}</div>
                    <ul>
                        <li>Relevant coursework: ${edu.relevantCourses}</li>
                    </ul>
                </div>
                `;
            });
            
            const newEducationSection = `
            <div class="resume-section">
                <h2 class="resume-section-title">Education</h2>
                ${educationHtml}
            </div>
            `;
            
            populatedHtml = populatedHtml.replace(educationSectionRegex, newEducationSection);
        }
    }
    
    // Similar approach for experience and other sections
    // This is simplified - a production solution would use a DOM parser
    
    return populatedHtml;
}

module.exports = {
    generateEnhancedResume
};