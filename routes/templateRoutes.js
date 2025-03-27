  //templatesRoutes.js (stored in Routes folder)

  const express = require('express');
  const router = express.Router();
  const { Storage } = require('@google-cloud/storage');

  // Initialize Google Cloud Storage
  const storage = new Storage();
  const bucketName = 'project-relate'; // Your bucket name

  // GET endpoint to list all template images in the bucket
  router.get('/get-templates', async (req, res) => {
    try {
      console.log('Fetching templates from Google Cloud Storage bucket:', bucketName);
      
      // Get all files from the bucket
      const [files] = await storage.bucket(bucketName).getFiles();
      
      // Filter for image files only
      const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
      const templateFiles = files.filter(file => {
        const filename = file.name.toLowerCase();
        return imageExtensions.some(ext => filename.endsWith(ext));
      });
      
      console.log(`Found ${templateFiles.length} template images in bucket`);
      
      // Format the response
      const templates = templateFiles.map(file => {
        const filename = file.name.split('/').pop(); // Remove folder path if any
        const templateId = filename.split('.')[0]; // Remove extension to get id
        
        return {
          id: templateId,
          name: `Template ${templateId}`,
          url: `https://storage.googleapis.com/${bucketName}/${file.name}`
        };
      });
      
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

  module.exports = router;