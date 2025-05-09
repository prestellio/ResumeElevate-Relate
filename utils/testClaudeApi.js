// utils/testClaudeApi.js
const axios = require('axios');
require('dotenv').config();

async function testClaudeApi() {
  try {
    const apiKey = process.env.CLAUDE_API_KEY;
    
    if (!apiKey) {
      console.error('CLAUDE_API_KEY not found in environment variables');
      return false;
    }
    
    const response = await axios.post(
      'https://api.anthropic.com/v1/messages',
      {
        model: "claude-3-haiku-20240307",
        max_tokens: 100,
        messages: [{ role: "user", content: "Test connection. Respond with 'Connection successful.'" }]
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01'
        }
      }
    );
    
    console.log('Claude API Response:', response.data.content[0].text);
    return true;
  } catch (error) {
    console.error('Error testing Claude API:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', JSON.stringify(error.response.data));
    }
    return false;
  }
}

// Run the test when this script is executed directly
if (require.main === module) {
  testClaudeApi()
    .then(result => {
      if (result) {
        console.log('Claude API test successful!');
      } else {
        console.log('Claude API test failed.');
      }
      process.exit(0);
    })
    .catch(err => {
      console.error('Unexpected error:', err);
      process.exit(1);
    });
}

module.exports = { testClaudeApi };