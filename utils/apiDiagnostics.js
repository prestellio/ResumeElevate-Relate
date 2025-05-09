// utils/apiDiagnostics.js
const axios = require('axios');
require('dotenv').config();

async function runApiDiagnostics() {
  console.log('Running Claude API diagnostics...');
  
  // Check for API key
  const apiKey = process.env.CLAUDE_API_KEY;
  if (!apiKey) {
    console.error('❌ ERROR: CLAUDE_API_KEY not found in environment variables');
    console.log('  Make sure you have added the API key to your .env file');
    return false;
  } else if (!apiKey.startsWith('sk-ant-api')) {
    console.error('❌ ERROR: CLAUDE_API_KEY has invalid format');
    console.log('  Claude API keys typically start with "sk-ant-api"');
    return false;
  } else {
    console.log('✓ API key is present and has the correct format');
  }
  
  // Test API connection
  console.log('Testing API connection with a simple request...');
  try {
    const response = await axios.post(
      'https://api.anthropic.com/v1/messages',
      {
        model: "claude-3-haiku-20240307",
        max_tokens: 50,
        messages: [{ role: "user", content: "Say 'Hello.'" }]
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01'
        }
      }
    );
    
    const responseText = response.data.content[0].text.trim();
    console.log(`✓ API connection successful!\nResponse: ${responseText}`);
  } catch (error) {
    console.error(`❌ ERROR: Failed to connect to Claude API: ${error.message}`);
    if (error.response) {
      console.error(`  Status: ${error.response.status}`);
      console.error(`  Data: ${JSON.stringify(error.response.data, null, 2)}`);
      
      if (error.response.status === 401) {
        console.log('  This is an authentication error. Your API key may be invalid or expired.');
      } else if (error.response.status === 429) {
        console.log('  This is a rate limit error. You may have exceeded your API quota.');
      }
    } else if (error.request) {
      console.error('  No response received from server. Check your internet connection.');
    }
    return false;
  }
  
  // Check for MongoDB connection
  if (!process.env.MONGODB_URI) {
    console.warn('⚠️ WARNING: MONGODB_URI not found in environment variables');
    console.log('  MongoDB integration may not work properly');
  }
  
  // Check for GCS configuration
  if (!process.env.GCS_BUCKET_NAME) {
    console.warn('⚠️ WARNING: GCS_BUCKET_NAME not found in environment variables');
    console.log('  Google Cloud Storage integration may not work properly');
    console.log('  Templates will fall back to local files');
  }
  
  console.log('All diagnostics passed. Your Claude API integration should work.');
  return true;
}

// Run diagnostics if called directly
if (require.main === module) {
  runApiDiagnostics()
    .then(result => {
      if (!result) {
        console.log('Some diagnostics failed. Please fix the issues above before continuing.');
        process.exit(1);
      }
    })
    .catch(err => {
      console.error('Unexpected error during diagnostics:', err);
      process.exit(1);
    });
}

module.exports = { runApiDiagnostics };