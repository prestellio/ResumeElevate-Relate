// Enhanced AI Routes for Resume Content Generation
// Add or update this in routes/aiRoutes.js

const express = require('express');
const router = express.Router();
const axios = require('axios');
require('dotenv').config();

// Endpoint to generate AI-enhanced resume content from questionnaire/resume data
router.post('/generate-resume', async (req, res) => {
  try {
    const userData = req.body;
    
    console.log('Resume generation request received:', userData.careerField);
    
    // Validate required user data
    if (!userData) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing resume data' 
      });
    }
    
    // Call Claude API for enhancement
    try {
      const enhancedContent = await callClaudeAPI(userData);
      
      // Parse the response
      let parsedContent;
      try {
        // If the response is already a JSON string
        if (typeof enhancedContent === 'string') {
          // Find the JSON object in the response
          const jsonMatch = enhancedContent.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            parsedContent = JSON.parse(jsonMatch[0]);
          } else {
            throw new Error('No valid JSON found in response');
          }
        } else {
          // If it's already an object
          parsedContent = enhancedContent;
        }
      } catch (parseError) {
        console.error('Error parsing Claude response:', parseError);
        return res.status(500).json({
          success: false,
          message: 'Failed to parse AI-generated content'
        });
      }
      
      // Return the enhanced content
      return res.status(200).json({
        success: true,
        enhancedContent: parsedContent
      });
    } catch (apiError) {
      console.error('Error calling Claude API:', apiError);
      return res.status(500).json({
        success: false,
        message: 'Failed to generate enhanced content',
        error: apiError.message
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

// Endpoint to enhance a specific section of the resume
router.post('/enhance-section', async (req, res) => {
  try {
    const { text, sectionType } = req.body;
    
    if (!text) {
      return res.status(400).json({
        success: false,
        message: 'Missing section text'
      });
    }
    
    // Create a prompt for Claude to enhance this specific section
    const enhancedContent = await enhanceSectionWithClaudeAPI(text, sectionType);
    
    return res.status(200).json({
      success: true,
      enhancedContent
    });
  } catch (error) {
    console.error('Error in enhance-section endpoint:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to enhance section content',
      error: error.message
    });
  }
});

/**
 * Calls Claude API to enhance resume content
 * @param {Object} userData - User data from questionnaire/resume
 * @returns {string|Object} - Enhanced content
 */
async function callClaudeAPI(userData) {
  try {
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
    
    // Create the prompt for Claude
    const prompt = `
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
    
    // Call the Claude API
    const response = await axios.post(
      process.env.CLAUDE_API_URL || 'https://api.anthropic.com/v1/messages',
      {
        model: "claude-3-sonnet-20240229",
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
    
    // Extract the response from Claude
    return response.data.content[0].text;
  } catch (error) {
    console.error('Error calling Claude API:', error);
    // Generate fallback content if API call fails
    return generateFallbackContent(userData);
  }
}

/**
 * Calls Claude API to enhance a specific section of the resume
 * @param {string} text - The text to enhance
 * @param {string} sectionType - The type of section (summary, experience, etc.)
 * @returns {string} - Enhanced content
 */
async function enhanceSectionWithClaudeAPI(text, sectionType) {
  try {
    // Create a prompt for Claude
    const prompt = `
      You are a professional resume writer. Please enhance the following ${sectionType || 'resume'} section to make it more impactful, professional, and achievement-oriented:
      
      "${text}"
      
      Guidelines:
      1. Use strong action verbs
      2. Focus on achievements and quantifiable results
      3. Use industry-appropriate terminology
      4. Keep the enhancement concise and powerful
      5. Maintain the original structure while improving the content
      
      Return ONLY the enhanced content without any explanations or additional formatting.
    `;
    
    // Call the Claude API
    const response = await axios.post(
      process.env.CLAUDE_API_URL || 'https://api.anthropic.com/v1/messages',
      {
        model: "claude-3-sonnet-20240229",
        max_tokens: 1000,
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
    
    // Extract and return the enhanced content
    return response.data.content[0].text.trim();
  } catch (error) {
    console.error('Error enhancing section with Claude API:', error);
    
    // Provide a basic enhancement as fallback
    let enhancedContent = text;
    
    // Apply some basic enhancements based on section type
    if (sectionType === 'summary') {
      enhancedContent = `Results-driven professional with a proven track record of success in delivering impactful solutions. ${text}`;
    } else if (sectionType === 'experience') {
      // Add action verbs to responsibilities
      const lines = text.split('\n');
      enhancedContent = lines.map(line => {
        if (line.trim() && !line.includes(':')) {
          return `Successfully ${line.trim()} resulting in measurable improvements.`;
        }
        return line;
      }).join('\n');
    }
    
    return enhancedContent;
  }
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
    summary: userData.summary || `Results-driven ${careerField} with a track record of delivering high-quality solutions. Combines strong technical expertise with excellent communication skills to drive successful outcomes.`,
    
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
}

module.exports = router;