const express = require('express');
const router = express.Router();
const axios = require('axios');
require('dotenv').config();

// Endpoint for resume editing assistance
router.post('/resume-assistant', async (req, res) => {
  try {
    const { prompt, resumeContent } = req.body;
    
    if (!prompt || !resumeContent) {
      return res.status(400).json({
        success: false,
        message: 'Missing prompt or resume content'
      });
    }
    
    // Create a prompt for Claude with the user's question and resume content
    const aiPrompt = `
      You are an expert resume editor and career counselor. The user has the following resume content:
      
      ${resumeContent}
      
      The user is asking for your help with this prompt:
      "${prompt}"
      
      Provide helpful, professional advice based on best practices for resumes. If the user is asking for specific changes to the resume, suggest the exact text changes they should make.
      
      If appropriate, provide specific text they could use to replace or enhance sections of their resume. Format your response with clear next steps.
      
      Response format:
      {
        "response": "Your helpful advice text here, written in a friendly professional tone",
        "suggestEdits": boolean, // true if you're suggesting specific text changes
        "suggestedHTML": "If suggesting edits, include the full HTML with your changes here"
      }
    `;
    
    // Call Claude API
    const response = await axios.post(
      process.env.CLAUDE_API_URL,
      {
        model: "claude-3-sonnet-20240229",
        max_tokens: 4000,
        messages: [
          {
            role: "user",
            content: aiPrompt
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

    // Extract the JSON response from Claude
    const aiResponse = response.data.content[0].text;
    let parsedResponse;
    
    try {
      // Find JSON in the response
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedResponse = JSON.parse(jsonMatch[0]);
      } else {
        // If no JSON found, create a simple response
        parsedResponse = {
          response: aiResponse,
          suggestEdits: false
        };
      }
    } catch (parseError) {
      console.error('Error parsing Claude response:', parseError);
      parsedResponse = {
        response: "I understood your request, but couldn't format a specific edit. Here's my advice: " + aiResponse,
        suggestEdits: false
      };
    }
    
    return res.status(200).json({
      success: true,
      ...parsedResponse
    });
  } catch (error) {
    console.error('Error calling Claude API:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get AI assistance'
    });
  }
});

module.exports = router;