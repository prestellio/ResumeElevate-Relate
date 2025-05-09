// routes/aiRoutes.js
const express = require('express');
const router = express.Router();
const axios = require('axios');
require('dotenv').config();

// Endpoint to generate AI-enhanced resume content from questionnaire/resume data
router.post('/generate-resume', async (req, res) => {
  try {
    const userData = req.body;
    
    console.log('Resume generation request received for:', userData.careerField);
    
    // Validate required user data
    if (!userData) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing resume data' 
      });
    }
    
    // Try to get AI-enhanced content
    try {
      const enhancedContent = await callClaudeAPI(userData);
      
      // Return the enhanced content
      return res.status(200).json({
        success: true,
        enhancedContent
      });
    } catch (apiError) {
      console.error('Error calling Claude API:', apiError);
      
      // Generate fallback content if API call fails
      const fallbackContent = generateFallbackContent(userData);
      
      return res.status(200).json({
        success: true,
        enhancedContent: fallbackContent,
        notice: 'Using generated content due to API limitations'
      });
    }
  } catch (error) {
    console.error('Error in generate-resume endpoint:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate resume content',
      error: error.message
    });
  }
});

/**
 * Calls Claude API to enhance resume content
 * @param {Object} userData - User data from questionnaire/resume
 * @returns {Object} - Enhanced content
 */
async function callClaudeAPI(userData) {
  try {
    // Check API key is available
    if (!process.env.CLAUDE_API_KEY) {
      throw new Error('CLAUDE_API_KEY is not configured in environment variables');
    }
    
    // Create the prompt for Claude
    const prompt = generatePrompt(userData);
    
    console.log('Calling Claude API...');
    
    // Call the Claude API with the latest API version
    const response = await axios.post(
      'https://api.anthropic.com/v1/messages',
      {
        model: "claude-3-haiku-20240307", // Use haiku model (faster, cheaper)
        max_tokens: 4000,
        messages: [{ role: "user", content: prompt }]
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.CLAUDE_API_KEY,
          'anthropic-version': '2023-06-01'
        }
      }
    );
    
    // Extract the response text
    const aiResponseText = response.data.content[0].text;
    console.log('Claude API response received');
    
    // Parse the JSON response
    try {
      // Look for a JSON object in the response
      const jsonMatch = aiResponseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      } else {
        console.warn('No JSON found in Claude response');
        throw new Error('Invalid response format from Claude API');
      }
    } catch (parseError) {
      console.error('Error parsing Claude response:', parseError);
      throw new Error('Failed to parse AI response');
    }
  } catch (error) {
    console.error('Error in Claude API call:', error.message);
    
    // Log detailed info for API errors
    if (error.response) {
      console.error('API Response Status:', error.response.status);
      console.error('API Response Headers:', error.response.headers);
      console.error('API Response Data:', error.response.data);
    }
    
    throw error; // Re-throw to be handled by the caller
  }
}

/**
 * Generates a prompt for Claude API
 * @param {Object} userData - User data
 * @returns {string} - Formatted prompt
 */
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
  
  // Return the formatted prompt
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

/**
 * Generates fallback content if API call fails
 * @param {Object} userData - User data
 * @returns {Object} - Fallback enhanced content
 */
function generateFallbackContent(userData) {
  // Create a basic enhanced version of the user's data
  const careerField = userData.careerField || 'professional';
  
  return {
    summary: userData.summary || 
      `Results-driven ${careerField} professional with a proven track record of delivering high-quality solutions and driving successful outcomes. Combines technical expertise with excellent communication skills to collaborate effectively with cross-functional teams.`,
    
    education: userData.education?.map(edu => ({
      university: edu.university || "University name",
      degree: edu.degree || "Degree",
      graduationDate: edu.graduationDate || "Graduation date",
      gpa: edu.gpa || "GPA",
      relevantCourses: edu.relevantCourses || "Core curriculum in the field plus specialized electives"
    })) || [{
      university: "University name",
      degree: "Degree",
      graduationDate: "Graduation date",
      gpa: "GPA",
      relevantCourses: "Relevant coursework"
    }],
    
    experience: userData.experience?.map(exp => ({
      companyName: exp.companyName || "Company name",
      jobTitle: exp.jobTitle || "Position",
      location: exp.location || "Location",
      dates: exp.dates || "Dates",
      responsibilities: Array.isArray(exp.responsibilities) ? 
        exp.responsibilities : 
        exp.responsibilities ? 
          exp.responsibilities.split('\n').filter(item => item.trim().length > 0) : 
          [
            `Led key initiatives that improved processes and outcomes`,
            `Collaborated with cross-functional teams to achieve objectives`,
            `Implemented innovative solutions to complex problems`
          ]
    })) || [{
      companyName: "Company name",
      jobTitle: "Position",
      location: "Location",
      dates: "Dates",
      responsibilities: [
        "Led key initiatives that improved processes and outcomes",
        "Collaborated with cross-functional teams to achieve objectives",
        "Implemented innovative solutions to complex problems"
      ]
    }],
    
    skills: {
      technical: Array.isArray(userData.skills?.technical) ? 
        userData.skills.technical : 
        userData.skills?.technical ? 
          userData.skills.technical.split(',').map(s => s.trim()) : 
          ["Technical skill 1", "Technical skill 2", "Technical skill 3"],
      
      soft: Array.isArray(userData.skills?.soft) ? 
        userData.skills.soft : 
        userData.skills?.soft ? 
          userData.skills.soft.split(',').map(s => s.trim()) : 
          ["Communication", "Problem-solving", "Teamwork", "Leadership"],
      
      languages: Array.isArray(userData.skills?.languages) ? 
        userData.skills.languages : 
        userData.skills?.languages ? 
          userData.skills.languages.split(',').map(s => s.trim()) : 
          [],
      
      certifications: Array.isArray(userData.skills?.certifications) ? 
        userData.skills.certifications : 
        userData.skills?.certifications ? 
          userData.skills.certifications.split(',').map(s => s.trim()) : 
          []
    },
    
    projects: userData.projects?.map(proj => ({
      projectName: proj.projectName || "Project name",
      dates: proj.dates || "Dates",
      description: Array.isArray(proj.description) ? 
        proj.description : 
        proj.description ? 
          proj.description.split('\n').filter(item => item.trim().length > 0) : 
          [
            "Developed solution that addressed key business needs",
            "Implemented using industry best practices and modern technologies"
          ]
    })) || [{
      projectName: "Project name",
      dates: "Dates",
      description: [
        "Developed solution that addressed key business needs",
        "Implemented using industry best practices and modern technologies"
      ]
    }]
  };
}

module.exports = router;