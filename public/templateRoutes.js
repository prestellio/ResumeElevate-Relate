// Add this to your server.js or routes file
const express = require('express');
const router = express.Router();
const { Storage } = require('@google-cloud/storage');

// Initialize Google Cloud Storage
// Make sure you have your service account key JSON file correctly set up
const storage = new Storage({
  // If running locally, point to your service account key file
  // keyFilename: 'path/to/your-project-credentials.json'
  // If deployed to Google Cloud, authentication is automatic
});

const bucketName = 'project-relate'; // Your GCS bucket name

// GET endpoint to retrieve all templates from GCS bucket
router.get('/get-templates', async (req, res) => {
  try {
    const [files] = await storage.bucket(bucketName).getFiles({
      prefix: 'templates/', // Assuming templates are in a 'templates/' folder
    });

    // Filter for image files only
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const templateFiles = files.filter(file => {
      const filename = file.name.toLowerCase();
      return imageExtensions.some(ext => filename.endsWith(ext));
    });

    // Format the response
    const templates = templateFiles.map(file => {
      const filename = file.name.split('/').pop(); // Remove folder path if any
      const templateId = filename.split('.')[0]; // Remove extension to get id
      
      return {
        id: templateId,
        name: templateId.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()), // Convert filename to title case
        url: `https://storage.googleapis.com/${bucketName}/${file.name}`
      };
    });

    res.json({ success: true, templates });
  } catch (error) {
    console.error('Error fetching templates from GCS:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch templates' });
  }
});

module.exports = router;

// In your main server.js file, add:
// app.use('/api', require('./path/to/this/file'));