// utils/claudeApiHelper.js
// Improved implementation with better error handling and fallbacks
const axios = require('axios');
require('dotenv').config();

async function generateResumeContent(userData) {
  try {
    console.log('Calling Claude API for resume generation...');
    console.log('User data summary:', {
      name: userData.personalInfo?.name,
      field: userData.careerField,
      experienceCount: userData.experience?.length || 0
    });
    
    // Check if API key is available and properly formatted
    const apiKey = process.env.CLAUDE_API_KEY;
    if (!apiKey) {
      console.error('CLAUDE_API_KEY is missing in environment variables');
      return generateFallbackContent(userData);
    }
    
    if (!apiKey.startsWith('sk-')) {
      console.error('CLAUDE_API_KEY appears to be in invalid format');
      return generateFallbackContent(userData);
    }
    
    // Try the API call with improved error handling
    try {
      const apiUrl = process.env.CLAUDE_API_URL || 'https://api.anthropic.com/v1/messages';
      console.log(`Making request to Claude API at: ${apiUrl}`);
      
      const response = await axios.post(
        apiUrl,
        {
          model: "claude-3-haiku-20240307", // Use the fastest model for quicker response
          max_tokens: 4000,
          messages: [
            {
              role: "user",
              content: generatePrompt(userData)
            }
          ]
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01'
          },
          timeout: 30000 // 30 second timeout
        }
      );

      // Improve response handling
      if (!response.data || !response.data.content || !response.data.content[0]) {
        console.error('Unexpected API response format:', response.data);
        return generateFallbackContent(userData);
      }
      
      const aiResponse = response.data.content[0].text;
      console.log('Claude API response received, length:', aiResponse.length);
      
      // Log a snippet of the response for debugging
      console.log('Response preview:', aiResponse.substring(0, 200) + '...');
      
      // Always return a properly formatted JSON object
      try {
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsedResponse = JSON.parse(jsonMatch[0]);
          console.log('Successfully parsed JSON response with keys:', Object.keys(parsedResponse).join(', '));
          return parsedResponse;
        } else {
          console.warn('No JSON found in Claude response, attempting to extract structured data');
          // Attempt to extract structured data from text
          return extractStructuredData(aiResponse, userData);
        }
      } catch (parseError) {
        console.error('Error parsing Claude response:', parseError);
        console.error('Failed JSON:', jsonMatch ? jsonMatch[0].substring(0, 200) + '...' : 'No JSON found');
        return generateFallbackContent(userData);
      }
    } catch (apiError) {
      console.error('Claude API error:', apiError.message);
      if (apiError.response) {
        console.error('Status:', apiError.response.status);
        console.error('Data:', JSON.stringify(apiError.response.data, null, 2));
      } else if (apiError.request) {
        console.error('No response received from server');
      }
      return generateFallbackContent(userData);
    }
  } catch (error) {
    console.error('Unexpected error in generateResumeContent:', error);
    return generateFallbackContent(userData);
  }
}

// Helper function to extract sections from text response
function extractSection(text, sectionStart, sectionEnd) {
  if (!text) return null;
  
  // Create case-insensitive regex patterns for section start and end
  const startPattern = new RegExp(`${sectionStart}.*?:`, 'i');
  const startMatch = text.match(startPattern);
  
  if (!startMatch) return null;
  
  const startIdx = startMatch.index;
  
  // If no end section specified, go to the end of the text
  if (!sectionEnd) {
    return text.substring(startIdx);
  }
  
  const endPattern = new RegExp(`${sectionEnd}.*?:`, 'i');
  const endMatch = text.substring(startIdx).match(endPattern);
  
  // If end section not found, go to the end of the text
  if (!endMatch) {
    return text.substring(startIdx);
  }
  
  return text.substring(startIdx, startIdx + endMatch.index);
}

// Helper function to find values in text after a key
function findValue(text, key) {
  if (!text) return null;
  
  // Look for key followed by colon
  const pattern = new RegExp(`${key}.*?:\\s*(.*?)(?=\\n|$)`, 'i');
  const match = text.match(pattern);
  
  if (match && match[1]) {
    return match[1].trim();
  }
  
  return null;
}

// Helper function to extract bullet points from text
function extractBulletPoints(text) {
  if (!text) return null;
  
  // Look for bullet points indicated by -, •, *, or numbered lists
  const bulletPattern = /(?:^|\n)\s*(?:-|\*|•|\d+\.)\s*(.*?)(?=\n|$)/g;
  const bullets = [];
  let match;
  
  while ((match = bulletPattern.exec(text)) !== null) {
    if (match[1] && match[1].trim()) {
      bullets.push(match[1].trim());
    }
  }
  
  return bullets.length > 0 ? bullets : null;
}

// Helper function to extract structured data from text response
function extractStructuredData(text, userData) {
  console.log('Attempting to extract structured data from text response');
  
  // Try to find sections in the text that match expected fields
  const extractedData = {
    summary: extractSection(text, 'summary', 'education') || '',
    education: [],
    experience: [],
    skills: {
      technical: [],
      soft: [],
      languages: [],
      certifications: []
    },
    projects: []
  };
  
  // Extract education section
  const educationText = extractSection(text, 'education', 'experience');
  if (educationText) {
    // Try to find university names, degrees, etc.
    const universityMatches = educationText.match(/university.*?:/gi) || [];
    const degreeMatches = educationText.match(/degree.*?:/gi) || [];
    
    if (universityMatches.length > 0 || degreeMatches.length > 0) {
      extractedData.education.push({
        university: findValue(educationText, 'university') || 'University',
        degree: findValue(educationText, 'degree') || 'Degree',
        graduationDate: findValue(educationText, 'graduation') || findValue(educationText, 'date') || 'Graduation Date',
        gpa: findValue(educationText, 'gpa') || '3.5/4.0',
        relevantCourses: findValue(educationText, 'courses') || 'Relevant coursework'
      });
    }
  }
  
  // Extract experience
  const experienceText = extractSection(text, 'experience', 'skills');
  if (experienceText) {
    // Look for job titles, companies
    const companyMatches = experienceText.match(/company.*?:/gi) || [];
    const titleMatches = experienceText.match(/title.*?:|position.*?:/gi) || [];
    
    if (companyMatches.length > 0 || titleMatches.length > 0) {
      extractedData.experience.push({
        companyName: findValue(experienceText, 'company') || 'Company',
        jobTitle: findValue(experienceText, 'title') || findValue(experienceText, 'position') || 'Position',
        location: findValue(experienceText, 'location') || 'Location',
        dates: findValue(experienceText, 'dates') || 'Current',
        responsibilities: extractBulletPoints(experienceText) || ['Key responsibility']
      });
    }
  }
  
  // Extract skills
  const skillsText = extractSection(text, 'skills', 'projects');
  if (skillsText) {
    const technicalText = extractSection(skillsText, 'technical', 'soft');
    if (technicalText) {
      extractedData.skills.technical = extractBulletPoints(technicalText) || 
                                      [findValue(technicalText, 'technical') || 'Technical skills'];
    }
    
    const softText = extractSection(skillsText, 'soft', 'languages');
    if (softText) {
      extractedData.skills.soft = extractBulletPoints(softText) || 
                                [findValue(softText, 'soft') || 'Soft skills'];
    }
    
    const languagesText = extractSection(skillsText, 'languages', 'certifications');
    if (languagesText) {
      extractedData.skills.languages = extractBulletPoints(languagesText) || [];
    }
    
    const certificationsText = extractSection(skillsText, 'certifications', null);
    if (certificationsText) {
      extractedData.skills.certifications = extractBulletPoints(certificationsText) || [];
    }
  }
  
  // Extract projects
  const projectsText = extractSection(text, 'projects', null);
  if (projectsText) {
    const projectNameMatches = projectsText.match(/project.*?name.*?:/gi) || [];
    if (projectNameMatches.length > 0) {
      extractedData.projects.push({
        projectName: findValue(projectsText, 'project') || 'Project',
        dates: findValue(projectsText, 'dates') || 'Recent',
        description: extractBulletPoints(projectsText) || ['Project description']
      });
    }
  }
  
  // If we couldn't extract much, fall back to default content
  if (extractedData.experience.length === 0 || 
      extractedData.skills.technical.length === 0) {
    console.log('Extracted data was insufficient, using fallback content');
    return generateFallbackContent(userData);
  }
  
  return extractedData;
}

// Generate prompt for Claude API
function generatePrompt(userData) {
  // Format education data
  let educationText = 'Education: Not provided';
  if (userData.education && userData.education.length > 0) {
    educationText = 'Education:\n' + userData.education.map(edu => `
      - University: ${edu.university || 'Not provided'}
      - Degree: ${edu.degree || 'Not provided'}
      - Graduation Date: ${edu.graduationDate || 'Not provided'}
      - GPA: ${edu.gpa || 'Not provided'}
      - Relevant Courses: ${edu.relevantCourses || 'Not provided'}
    `).join('\n');
  }
  
  // Format experience data
  let experienceText = 'Work Experience: Not provided';
  if (userData.experience && userData.experience.length > 0) {
    experienceText = 'Work Experience:\n' + userData.experience.map(exp => `
      - Company: ${exp.companyName || 'Not provided'}
      - Position: ${exp.jobTitle || 'Not provided'}
      - Location: ${exp.location || 'Not provided'}
      - Dates: ${exp.dates || 'Not provided'}
      - Responsibilities: ${exp.responsibilities || 'Not provided'}
    `).join('\n');
  }
  
  // Format projects data
  let projectsText = 'Projects: Not provided';
  if (userData.projects && userData.projects.length > 0) {
    projectsText = 'Projects:\n' + userData.projects.map(proj => `
      - Project Name: ${proj.projectName || 'Not provided'}
      - Dates: ${proj.dates || 'Not provided'}
      - Description: ${proj.description || 'Not provided'}
    `).join('\n');
  }
  
  // Format skills data
  const technical = userData.skills?.technical || 'Not provided';
  const soft = userData.skills?.soft || 'Not provided';
  const languages = userData.skills?.languages || 'Not provided';
  const certifications = userData.skills?.certifications || 'Not provided';
  
  // Create a structured prompt for Claude
  return `
    You are a professional resume writer with expertise in creating compelling, achievement-oriented resumes tailored to specific career fields. Your goal is to enhance the resume content provided by making it more professional, impactful, and focused on accomplishments.

    Please create an enhanced resume based on the following information provided by the user:
    
    Career Field: ${userData.careerField || 'professional'}
    
    Personal Information:
    - Name: ${userData.personalInfo?.name || 'Not provided'}
    - Email: ${userData.personalInfo?.email || 'Not provided'}
    - Phone: ${userData.personalInfo?.phone || 'Not provided'}
    - Location: ${userData.personalInfo?.location || 'Not provided'}
    
    ${educationText}
    
    ${experienceText}
    
    ${projectsText}
    
    Skills:
    - Technical Skills: ${technical}
    - Soft Skills: ${soft}
    - Languages: ${languages}
    - Certifications: ${certifications}
    
    Professional Summary:
    ${userData.summary || 'Not provided'}
    
    Provide a JSON object with the enhanced resume content. Follow these guidelines:
    1. Make the content more professional and impactful
    2. Focus on accomplishments and quantifiable results where possible
    3. Use strong action verbs and industry-specific terminology
    4. Ensure the content reflects best practices for ${userData.careerField || 'professional'} resumes
    5. Keep the content concise and well-structured
    
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
    
    IMPORTANT: Return ONLY the JSON object without any additional text before or after.
  `;
}

// Function to generate fallback content if API call fails
function generateFallbackContent(userData) {
  console.log('Generating fallback enhanced content');
  
  // Create a basic enhanced version of the user's data
  const careerField = userData.careerField || 'professional';
  
  // Ensure array fields have at least one item
  const ensureArray = (arr, defaultItem) => {
    if (!arr || !Array.isArray(arr) || arr.length === 0) {
      return [defaultItem];
    }
    return arr;
  };
  
  // Convert string to array of strings if needed
  const stringToArray = (value) => {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    return value.split(',').map(s => s.trim()).filter(s => s);
  };
  
  // Create responsibilities array from string if needed
  const createResponsibilities = (resp) => {
    if (!resp) return ["Led key initiatives that improved team performance"];
    if (Array.isArray(resp)) return resp;
    return resp.split(/[\n;]/).map(s => s.trim()).filter(s => s);
  };
  
  return {
    summary: userData.summary || 
      `Results-driven ${careerField} professional with a proven track record of delivering high-quality solutions and driving successful outcomes. Combines technical expertise with excellent communication skills to collaborate effectively with cross-functional teams.`,
    
    education: ensureArray(userData.education, {}).map(edu => ({
      university: edu.university || "University name",
      degree: edu.degree || `Bachelor's Degree in ${careerField.charAt(0).toUpperCase() + careerField.slice(1)}`,
      graduationDate: edu.graduationDate || "Expected 2025",
      gpa: edu.gpa || "3.7/4.0",
      relevantCourses: edu.relevantCourses || "Core curriculum and specialized coursework in the field"
    })),
    
    experience: ensureArray(userData.experience, {}).map(exp => ({
      companyName: exp.companyName || "Company name",
      jobTitle: exp.jobTitle || `${careerField.charAt(0).toUpperCase() + careerField.slice(1)} Specialist`,
      location: exp.location || "City, State",
      dates: exp.dates || "2022 - Present",
      responsibilities: createResponsibilities(exp.responsibilities)
    })),
    
    skills: {
      technical: stringToArray(userData.skills?.technical) || 
        ["Project Management", "Data Analysis", "Problem Solving", "Technical Documentation"],
      
      soft: stringToArray(userData.skills?.soft) || 
        ["Communication", "Team Collaboration", "Time Management", "Leadership"],
      
      languages: stringToArray(userData.skills?.languages) || [],
      
      certifications: stringToArray(userData.skills?.certifications) || []
    },
    
    projects: ensureArray(userData.projects, {}).map(proj => ({
      projectName: proj.projectName || `${careerField.charAt(0).toUpperCase() + careerField.slice(1)} Innovation Project`,
      dates: proj.dates || "2023",
      description: Array.isArray(proj.description) ? 
        proj.description : 
        proj.description ? 
          proj.description.split(/[\n;]/).map(s => s.trim()).filter(s => s) : 
          [
            `Developed comprehensive solution that increased efficiency by 30%`,
            `Implemented industry best practices resulting in improved outcomes`
          ]
    }))
  };
}

module.exports = { generateResumeContent };