const axios = require('axios');
require('dotenv').config();

async function generateResumeContent(userData) {
  try {
    console.log('Calling Claude API for resume generation...');
    
    // For now, return a placeholder response to test the flow
    // In production, this would make the actual API call to Claude
    return JSON.stringify({
      summary: "Professional with experience in software development focused on delivering high-quality solutions.",
      education: [
        {
          university: userData.education[0]?.university || "University name",
          degree: userData.education[0]?.degree || "Degree",
          graduationDate: userData.education[0]?.graduationDate || "Graduation date",
          gpa: userData.education[0]?.gpa || "GPA",
          relevantCourses: "Enhanced relevant courses including data structures, algorithms, and software engineering"
        }
      ],
      experience: [
        {
          companyName: userData.experience[0]?.companyName || "Company name",
          jobTitle: "Enhanced " + (userData.experience[0]?.jobTitle || "job title"),
          location: userData.experience[0]?.location || "Location",
          dates: userData.experience[0]?.dates || "Dates",
          responsibilities: [
            "Developed and implemented key features resulting in 25% performance improvement",
            "Collaborated with cross-functional teams to deliver projects on time",
            "Optimized processes resulting in significant cost savings"
          ]
        }
      ],
      skills: {
        technical: ["JavaScript", "React", "Node.js", "Python"],
        soft: ["Communication", "Problem-solving", "Team collaboration"],
        languages: ["English", "Spanish"],
        certifications: ["AWS Certified Developer"]
      },
      projects: [
        {
          projectName: userData.projects[0]?.projectName || "Project name",
          dates: userData.projects[0]?.dates || "Dates",
          description: [
            "Designed and implemented a comprehensive solution addressing key business needs",
            "Utilized industry best practices resulting in a robust, scalable system"
          ]
        }
      ]
    });
    
    // When ready to implement the actual Claude API call, uncomment this code:
    /*
    const response = await axios.post(
      process.env.CLAUDE_API_URL,
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

    return response.data.content[0].text;
    */
  } catch (error) {
    console.error('Error calling Claude API:', error);
    throw new Error('Failed to generate resume content');
  }
}

function generatePrompt(userData) {
  // Create a structured prompt for Claude based on user data
  return `
    You are a professional resume writer. Create an enhanced resume based on the following information provided by the user:
    
    Career Field: ${userData.careerField}
    
    Personal Information:
    - Name: ${userData.personalInfo.name}
    - Email: ${userData.personalInfo.email}
    - Phone: ${userData.personalInfo.phone}
    - Location: ${userData.personalInfo.location}
    
    Education:
    ${userData.education.map(edu => `
    - University: ${edu.university}
    - Degree: ${edu.degree}
    - Graduation Date: ${edu.graduationDate}
    - GPA: ${edu.gpa}
    - Relevant Courses: ${edu.relevantCourses}
    `).join('\n')}
    
    Work Experience:
    ${userData.experience.map(exp => `
    - Company: ${exp.companyName}
    - Position: ${exp.jobTitle}
    - Location: ${exp.location}
    - Dates: ${exp.dates}
    - Responsibilities: ${exp.responsibilities}
    `).join('\n')}
    
    Projects:
    ${userData.projects.map(proj => `
    - Project Name: ${proj.projectName}
    - Dates: ${proj.dates}
    - Description: ${proj.description}
    `).join('\n')}
    
    Skills:
    - Technical Skills: ${userData.skills.technical}
    - Soft Skills: ${userData.skills.soft}
    - Languages: ${userData.skills.languages}
    - Certifications: ${userData.skills.certifications}
    
    Professional Summary:
    ${userData.summary}
    
    Return a JSON object with the following structure:
    {
      "summary": "An enhanced professional summary",
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
          "responsibilities": ["Responsibility 1", "Responsibility 2", "Responsibility 3"]
        }
      ],
      "skills": {
        "technical": ["Skill 1", "Skill 2"],
        "soft": ["Skill 1", "Skill 2"],
        "languages": ["Language 1", "Language 2"],
        "certifications": ["Certification 1", "Certification 2"]
      },
      "projects": [
        {
          "projectName": "Project name",
          "dates": "Dates",
          "description": ["Description point 1", "Description point 2"]
        }
      ]
    }
    
    Focus on enhancing the content with professional language, quantifiable achievements, and industry-specific terminology for ${userData.careerField}. Format responsibilities and descriptions as bullet points in the JSON arrays.
  `;
}

module.exports = { generateResumeContent };