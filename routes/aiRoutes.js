const express = require('express');
const router = express.Router();
const { generateResumeContent } = require('../utils/claudeApiHelper.js');

// Endpoint to generate resume content
router.post('/generate-resume', async (req, res) => {
  try {
    const userData = req.body;
    
    // Validate required user data
    if (!userData || !userData.personalInfo || !userData.careerField) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required resume data' 
      });
    }
    
    // Get AI-generated content
    const enhancedContent = await generateResumeContent(userData);
    
    // Parse JSON from Claude's response
    let parsedContent;
    try {
      // Find the JSON object in the response
      const jsonMatch = enhancedContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedContent = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No valid JSON found in response');
      }
    } catch (parseError) {
      console.error('Error parsing Claude response:', parseError);
      return res.status(500).json({
        success: false,
        message: 'Failed to parse AI-generated content'
      });
    }
    
    return res.status(200).json({
      success: true,
      enhancedContent: parsedContent
    });
  } catch (error) {
    console.error('Error in generate-resume endpoint:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate resume content'
    });
  }
});

module.exports = router;