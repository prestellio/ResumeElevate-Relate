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
router.get('/', async (req, res) => {
  try {
    console.log('Fetching templates from Google Cloud Storage bucket:', bucketName);
    
    // Get templates from GCS
    const [files] = await storage.bucket(bucketName).getFiles({
      prefix: 'templates/'
    });
    
    // Filter for image files and HTML files
    const imageFiles = files.filter(file => file.name.endsWith('.jpg') || file.name.endsWith('.png'));
    const htmlFiles = files.filter(file => file.name.endsWith('.html'));
    
    // Map image files to template objects
    const templates = imageFiles.map(file => {
      const filename = path.basename(file.name);
      const id = filename.replace(/\.(jpg|png)$/, '');
      
      // Find matching HTML file
      const htmlFile = htmlFiles.find(f => 
        path.basename(f.name).replace('.html', '') === id
      );
      
      const htmlUrl = htmlFile ? 
        `https://storage.googleapis.com/${bucketName}/${htmlFile.name}` : '';
      
      return {
        id: id,
        name: `Template ${id.replace('template', '')}`,
        url: `https://storage.googleapis.com/${bucketName}/${file.name}`,
        htmlUrl: htmlUrl
      };
    });
    
    console.log(`Found ${templates.length} templates`);
    res.json({ success: true, templates });
  } catch (error) {
    console.error('Error fetching templates from GCS:', error);
    
    // Fallback to local templates if GCS fails
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
          url: `/templates/${id}.jpg`,
          htmlUrl: `/templates/${file}`
        };
      });
      
      console.log(`Falling back to local templates. Found ${templates.length} templates`);
      res.json({ success: true, templates });
    } catch (localError) {
      res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch templates from both GCS and local storage',
        error: error.message
      });
    }
  }
});

// Route to get a specific template
router.get('/:id', async (req, res) => {
  const templateId = req.params.id;
  
  try {
    console.log(`Fetching template ${templateId} from GCS`);
    
    // Try to get the template from GCS
    const templateFile = storage.bucket(bucketName).file(`templates/${templateId}.html`);
    const [exists] = await templateFile.exists();
    
    if (exists) {
      const [content] = await templateFile.download();
      res.json({
        success: true,
        templateId,
        content: content.toString('utf8'),
        source: 'gcs'
      });
    } else {
      throw new Error(`Template ${templateId} not found in GCS`);
    }
  } catch (error) {
    console.error(`Error reading template file from GCS:`, error);
    
    // Try local file as fallback
    try {
      const templatePath = path.join(__dirname, `../public/templates/${templateId}.html`);
      const content = await fs.readFile(templatePath, 'utf8');
      
      res.json({
        success: true,
        templateId,
        content: content,
        source: 'local'
      });
    } catch (localError) {
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve template from both GCS and local storage',
        error: error.message
      });
    }
  }
});

module.exports = router;