//templatesRoutes.js (stored in Routes folder)

const express = require('express');
const router = express.Router();
const { Storage } = require('@google-cloud/storage');

// Initialize Google Cloud Storage with credentials
// The easiest approach is to set GOOGLE_APPLICATION_CREDENTIALS environment variable 
// pointing to your JSON key file before starting your application
const storage = new Storage({
  // You can specify the path to your service account key JSON file directly here if needed
  // keyFilename: '/path/to/your-project-credentials.json',
  
  // Or you can specify project ID explicitly if needed
  // projectId: 'your-project-id'
});
const bucketName = 'project-relate'; // Your bucket name
  
// GET endpoint to list all template images in the bucket
router.get('/get-templates', async (req, res) => {
  try {
    console.log('Fetching templates from Google Cloud Storage bucket:', bucketName);
    
    // Get all files from the bucket
    const [files] = await storage.bucket(bucketName).getFiles();
    
    // Filter for image files only (in case bucket contains other files)
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
      
      // Generate a signed URL if you want the images to be private
      // Or use a public URL if the bucket/objects are publicly accessible
      const url = `https://storage.googleapis.com/${bucketName}/${file.name}`;
      
      return {
        id: templateId,
        name: `Template ${templateId}`,
        url: url
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