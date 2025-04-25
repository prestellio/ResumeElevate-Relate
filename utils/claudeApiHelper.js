// Enhanced Claude API Integration for Resume Enhancement
// Add this to utils/claudeApiHelper.js

const axios = require('axios');
require('dotenv').config();

async function generateResumeContent(userData) {
  try {
    console.log('Calling Claude API for resume generation...');
    
    // Make the actual API call to Claude
    const response = await axios.post(
      process.env.CLAUDE_API_URL || 'https://api.anthropic.com/v1/messages',
      {
        model: "claude-3-sonnet-20240229",
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
          'x-api-key': process.env.CLAUDE_API_KEY,
          'anthropic-version': '2023-06-01'
        }
      }
    );

    // Extract the content from Claude's response
    const aiResponse = response.data.content[0].text;
    
    // Try to extract the JSON from the response
    try {
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        // Found JSON in the response
        return jsonMatch[0];
      } else {
        console.warn('No JSON found in Claude response. Returning original response.');
        return aiResponse;
      }
    } catch (parseError) {
      console.error('Error parsing Claude response as JSON:', parseError);
      return aiResponse;
    }
  } catch (error) {
    console.error('Error calling Claude API:', error);
    
    // Return a fallback response if API call fails
    return generateFallbackResponse(userData);
  }
}

// This generates the prompt to send to Claude
function generatePrompt(userData) {
  // Extract fields from user data with fallbacks for missing data
  const careerField = userData.careerField || 'professional';
  
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
    
    Career Field: ${careerField}
    
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
    4. Ensure the content reflects best practices for ${careerField} resumes
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

// Generate a fallback response if the API call fails
function generateFallbackResponse(userData) {
  // Create a basic enhanced version of the user's data
  const fallbackData = {
    summary: userData.summary || `Results-driven ${userData.careerField || 'professional'} with a track record of delivering high-quality solutions. Combines strong technical expertise with excellent communication skills to drive successful outcomes.`,
    education: userData.education?.map(edu => ({
      university: edu.university || "University name",
      degree: edu.degree || "Degree",
      graduationDate: edu.graduationDate || "Graduation date",
      gpa: edu.gpa || "GPA",
      relevantCourses: edu.relevantCourses || "Relevant coursework includes key subjects in the field"
    })) || [{
      university: "University name",
      degree: "Degree",
      graduationDate: "Graduation date",
      gpa: "GPA",
      relevantCourses: "Relevant coursework"
    }],
    experience: userData.experience?.map(exp => ({
      companyName: exp.companyName || "Company name",
      jobTitle: exp.jobTitle || "Position title",
      location: exp.location || "Location",
      dates: exp.dates || "Employment dates",
      responsibilities: Array.isArray(exp.responsibilities) 
        ? exp.responsibilities 
        : [
            `Led key initiatives that improved processes and outcomes`,
            `Collaborated with cross-functional teams to achieve objectives`,
            `Implemented innovative solutions to complex problems`
          ]
    })) || [{
      companyName: "Company name",
      jobTitle: "Position title",
      location: "Location",
      dates: "Employment dates",
      responsibilities: [
        "Led key initiatives that improved processes and outcomes",
        "Collaborated with cross-functional teams to achieve objectives",
        "Implemented innovative solutions to complex problems"
      ]
    }],
    skills: {
      technical: typeof userData.skills?.technical === 'string' 
        ? userData.skills.technical.split(',').map(s => s.trim()) 
        : ["Technical skill 1", "Technical skill 2", "Technical skill 3"],
      soft: typeof userData.skills?.soft === 'string'
        ? userData.skills.soft.split(',').map(s => s.trim())
        : ["Communication", "Problem-solving", "Teamwork", "Leadership"],
      languages: typeof userData.skills?.languages === 'string'
        ? userData.skills.languages.split(',').map(s => s.trim())
        : [],
      certifications: typeof userData.skills?.certifications === 'string'
        ? userData.skills.certifications.split(',').map(s => s.trim())
        : []
    },
    projects: userData.projects?.map(proj => ({
      projectName: proj.projectName || "Project name",
      dates: proj.dates || "Project timeframe",
      description: Array.isArray(proj.description)
        ? proj.description
        : [
            `Developed solution that addressed key business needs`,
            `Implemented using industry best practices and modern technologies`
          ]
    })) || [{
      projectName: "Project name",
      dates: "Project timeframe",
      description: [
        "Developed solution that addressed key business needs",
        "Implemented using industry best practices and modern technologies"
      ]
    }]
  };
  
  return JSON.stringify(fallbackData);
}

module.exports = { generateResumeContent };