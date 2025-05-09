// routes/templateRoutes.js
const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { Storage } = require('@google-cloud/storage');

// Initialize Google Cloud Storage
const storage = new Storage();
const bucketName = process.env.GCS_BUCKET_NAME || 'project-relate';

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
      const templateFiles = await fs.promises.readdir(templatesPath);
      
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

// Test route to verify template access
router.get('/test', (req, res) => {
  try {
    const templatesDir = path.join(__dirname, '../public/templates');
    const files = fs.readdirSync(templatesDir);
    
    res.json({
      success: true,
      message: 'Template directory accessible',
      templatesDirectory: templatesDir,
      availableTemplates: files.filter(f => f.endsWith('.html'))
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error accessing templates directory',
      error: error.message
    });
  }
});

// Route to get a specific template
router.get('/:id', async (req, res) => {
  const templateId = req.params.id;
  
  console.log(`Attempting to fetch template with ID: ${templateId}`);
  
  try {
    // Try to get from GCS first
    try {
      console.log(`Checking GCS for template: ${templateId}`);
      const gcsPath = `templates/${templateId}.html`;
      const file = storage.bucket(bucketName).file(gcsPath);
      const [exists] = await file.exists();
      
      if (exists) {
        console.log(`Found template ${templateId} in GCS`);
        const [content] = await file.download();
        return res.json({
          success: true,
          templateId,
          content: content.toString('utf8'),
          source: 'gcs'
        });
      }
    } catch (gcsError) {
      console.log(`GCS error for ${templateId}: ${gcsError.message}`);
      // Continue to local file check
    }
    
    // Try local file
    const localPath = path.join(__dirname, `../public/templates/${templateId}.html`);
    console.log(`Looking for local template at: ${localPath}`);
    console.log(`File exists: ${fs.existsSync(localPath)}`);
    
    if (fs.existsSync(localPath)) {
      const content = await fs.promises.readFile(localPath, 'utf8');
      console.log(`Template content length: ${content.length} bytes`);
      
      return res.json({
        success: true,
        templateId,
        content: content,
        source: 'local'
      });
    } else {
      console.log(`Template file not found at ${localPath}`);
      
      // Use default template if the specified one doesn't exist
      const defaultTemplate = `
        <div class="resume-header">
          <h1>Your Full Name</h1>
          <p>youremail@example.com | (123) 456-7890 | Wichita, Kansas</p>
        </div>

        <div class="resume-section">
          <h2 class="resume-section-title">Professional Summary</h2>
          <p>Dedicated professional with experience in your field. Skilled in key areas with a proven track record of achievement.</p>
        </div>

        <div class="resume-section">
          <h2 class="resume-section-title">Education</h2>
          <div class="resume-item">
            <div class="resume-item-header">
              <div class="resume-item-title">University Name</div>
              <div class="resume-item-date">Graduation Date</div>
            </div>
            <div class="resume-item-subtitle">Degree</div>
            <div>GPA: 3.8/4.0</div>
          </div>
        </div>

        <div class="resume-section">
          <h2 class="resume-section-title">Experience</h2>
          <div class="resume-item">
            <div class="resume-item-header">
              <div class="resume-item-title">Job Title</div>
              <div class="resume-item-date">Date Range</div>
            </div>
            <div class="resume-item-subtitle">Company Name, Location</div>
            <ul>
              <li>Key responsibility or achievement</li>
              <li>Key responsibility or achievement</li>
            </ul>
          </div>
        </div>

        <div class="resume-section">
          <h2 class="resume-section-title">Skills</h2>
          <ul>
            <li><strong>Category:</strong> Skill 1, Skill 2, Skill 3</li>
            <li><strong>Category:</strong> Skill 1, Skill 2, Skill 3</li>
          </ul>
        </div>
      `;
      
      return res.json({
        success: true,
        templateId: 'default',
        content: defaultTemplate,
        source: 'default'
      });
    }
  } catch (error) {
    console.error(`Error processing template ${templateId}:`, error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve template',
      error: error.message
    });
  }
});

module.exports = router;