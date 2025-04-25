// Create this file as utils/apiDiagnostics.js

const axios = require('axios');
require('dotenv').config();

/**
 * Tests the Claude API configuration and connection
 */
async function testClaudeApiConnection() {
  console.log('Running Claude API diagnostics...');
  
  // Step 1: Check if API key is set
  const apiKey = process.env.CLAUDE_API_KEY;
  if (!apiKey) {
    console.error('❌ ERROR: CLAUDE_API_KEY environment variable is not set');
    console.log('  Please add your API key to your .env file:');
    console.log('  CLAUDE_API_KEY=sk-ant-api...');
    return false;
  }
  
  // Step 2: Check API key format
  if (!apiKey.startsWith('sk-ant-api')) {
    console.error('❌ ERROR: CLAUDE_API_KEY has incorrect format');
    console.log('  Claude API keys should start with "sk-ant-api"');
    console.log('  Current format:', apiKey.substring(0, 10) + '...');
    return false;
  }
  
  console.log('✓ API key is present and has the correct format');
  
  // Step 3: Test a simple API call
  try {
    console.log('Testing API connection with a simple request...');
    
    // Make a simple request
    const response = await axios.post(
      'https://api.anthropic.com/v1/messages',
      {
        model: "claude-3-haiku-20240307",
        max_tokens: 50,
        messages: [{ role: "user", content: "Say hello in one short sentence." }]
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01'
        }
      }
    );
    
    // Check response
    if (response.status === 200 && response.data.content) {
      console.log('✓ API connection successful!');
      console.log('Response:', response.data.content[0].text);
      return true;
    } else {
      console.error('❌ ERROR: Unexpected API response format');
      console.log('  Response:', response.data);
      return false;
    }
  } catch (error) {
    console.error('❌ ERROR: Failed to connect to Claude API:', error.message);
    
    // Provide more details based on error type
    if (error.response) {
      console.error('  Status:', error.response.status);
      console.error('  Data:', error.response.data);
      
      // Specific status code guidance
      if (error.response.status === 401) {
        console.log('  This is an authentication error. Your API key may be invalid or expired.');
      } else if (error.response.status === 404) {
        console.log('  This is a "not found" error. The API endpoint URL may be incorrect or the API version may have changed.');
        console.log('  Please check the Anthropic API documentation for the latest endpoint URLs.');
      } else if (error.response.status === 429) {
        console.log('  This is a rate limit error. You may have exceeded your API usage quota.');
      }
    } else if (error.request) {
      console.error('  No response received. Check your internet connection.');
    }
    
    return false;
  }
}

// If this file is run directly, execute the test
if (require.main === module) {
  testClaudeApiConnection()
    .then(success => {
      if (success) {
        console.log('All diagnostics passed. Your Claude API integration should work.');
      } else {
        console.log('Some diagnostics failed. Please fix the issues above before continuing.');
      }
    })
    .catch(err => {
      console.error('Uncaught error during diagnostics:', err);
    });
}

// Export the functions for use in other modules
module.exports = {
  testClaudeApiConnection
};