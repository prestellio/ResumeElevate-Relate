const express = require('express');
const router = express.Router();
const { Storage } = require('@google-cloud/storage');

// Initialize Google Cloud Storage
const storage = new Storage();
const bucketName = 'project-relate'; // Your bucket name

// GET endpoint to list all template images in the bucket
router.get('/', async (req, res) => {
  try {
    console.log('Fetching templates from Google Cloud Storage bucket:', bucketName);
    
    // Create template objects manually based on the files you have in your bucket
    const templates = [
      {
        id: 'template1',
        name: 'Template 1',
        url: `https://storage.googleapis.com/${bucketName}/template1.jpg`,
        htmlUrl: `https://storage.googleapis.com/${bucketName}/template1.html`
      },
      {
        id: 'template2',
        name: 'Template 2',
        url: `https://storage.googleapis.com/${bucketName}/template2.jpg`,
        htmlUrl: `https://storage.googleapis.com/${bucketName}/template2.html`
      },
      {
        id: 'template3',
        name: 'Template 3',
        url: `https://storage.googleapis.com/${bucketName}/template3.jpg`,
        htmlUrl: `https://storage.googleapis.com/${bucketName}/template3.html`
      },
      {
        id: 'template4',
        name: 'Template 4',
        url: `https://storage.googleapis.com/${bucketName}/template4.jpg`,
        htmlUrl: `https://storage.googleapis.com/${bucketName}/template4.html`
      }
    ];
    
    console.log(`Returning ${templates.length} templates`);
    res.json({ success: true, templates });
  } catch (error) {
    console.error('Error fetching templates from GCS:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch templates',
      error: error.message
    });
  }
});

// Route to get a specific template
router.get('/:id', async (req, res) => {
  const templateId = req.params.id;
  
  try {
    // Create the URL to the HTML file
    const htmlUrl = `https://storage.googleapis.com/${bucketName}/${templateId}.html`;
    
    // Fetch the HTML content from GCS
    const response = await fetch(htmlUrl);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch template: ${response.status}`);
    }
    
    const content = await response.text();
    
    res.json({
      success: true,
      templateId,
      content: content
    });
  } catch (error) {
    console.error('Error reading template file from GCS:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve template',
      error: error.message
    });
  }
});

module.exports = router;