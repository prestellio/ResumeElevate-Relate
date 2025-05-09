// routes/templateRoutes.js
const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');
const { Storage } = require('@google-cloud/storage');

// Initialize Google Cloud Storage
const storage = new Storage();
const bucketName = process.env.GCS_BUCKET_NAME || 'project-relate'; // Your GCS bucket name

// GET endpoint to list all template images
// In routes/templateRoutes.js
router.get('/', async (req, res) => {
  try {
    const templatesPath = path.join(__dirname, '../public/templates');
    const templateFiles = await fs.readdir(templatesPath);
    
    // Filter for HTML templates
    const htmlTemplates = templateFiles.filter(file => 
      file.endsWith('.html') && file !== 'resume_template.html'
    );

    const templates = htmlTemplates.map(file => {
      const id = file.replace('.html', '');
      return {
        id: id,
        name: `Template ${id.replace('template', '')}`,
        // Update this URL to point to the images folder instead of templates
        url: `/images/${id}.jpg`, // <-- Changed from /templates/ to /images/
        htmlUrl: `/templates/${file}`
      };
    });
    
    res.json({ success: true, templates });
  } catch (error) {
    console.error('Error fetching templates:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch templates',
      error: error.message
    });
  }
});

module.exports = router;