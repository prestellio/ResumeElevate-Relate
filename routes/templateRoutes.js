// routes/templateRoutes.js
const express = require('express');
const router = express.Router();
const path = require('path');
const { Storage } = require('@google-cloud/storage');
const fs = require('fs');

// Initialize Google Cloud Storage
const storage = new Storage();
const bucketName = process.env.GCS_BUCKET_NAME || 'project-relate';

// GET endpoint to list all templates
router.get('/', async (req, res) => {
  try {
    console.log('Fetching templates from Google Cloud Storage bucket:', bucketName);
    
    // Get all files from the bucket
    const [files] = await storage.bucket(bucketName).getFiles();
    console.log(`Total files in bucket: ${files.length}`);
    
    // Debug: List all files to see what's available
    files.forEach(file => {
      console.log(`File in bucket: ${file.name}`);
    });
    
    // Filter for JPG/JPEG/PNG files only - without restricting to a specific folder
    const imageFiles = files.filter(file => 
      file.name.toLowerCase().endsWith('.jpg') || 
      file.name.toLowerCase().endsWith('.jpeg') || 
      file.name.toLowerCase().endsWith('.png')
    );
    
    // Filter for HTML template files
    const htmlFiles = files.filter(file => 
      file.name.toLowerCase().endsWith('.html') &&
      !file.name.includes('index') // Exclude index.html
    );
    
    console.log(`Found ${imageFiles.length} template images`);
    console.log(`Found ${htmlFiles.length} HTML templates`);
    
    // Map image files to template objects
    const templates = imageFiles.map(file => {
      const filename = path.basename(file.name);
      
      // Extract template ID (remove file extension)
      const id = filename.replace(/\.(jpg|jpeg|png)$/i, '');
      
      // Find matching HTML file
      const htmlFile = htmlFiles.find(f => {
        const htmlBasename = path.basename(f.name).toLowerCase();
        const idLower = id.toLowerCase();
        return htmlBasename.replace('.html', '') === idLower;
      });
      
      // Create public URL for the files
      const url = `https://storage.googleapis.com/${bucketName}/${file.name}`;
      const htmlUrl = htmlFile ? 
        `https://storage.googleapis.com/${bucketName}/${htmlFile.name}` : '';
      
      return {
        id: id,
        name: `Template ${id.replace(/template/i, '')}`,
        url: url,
        htmlUrl: htmlUrl
      };
    });
    
    console.log(`Returning ${templates.length} templates`);
    templates.forEach(template => {
      console.log(`Template: ${template.id}, URL: ${template.url}`);
    });
    
    res.json({ success: true, templates });
  } catch (error) {
    console.error('Error fetching templates from GCS:', error);
    
    // Fallback to local templates if GCS fails
    try {
      console.log('Falling back to local templates');
      const templatesPath = path.join(__dirname, '../public/templates');
      const templateFiles = fs.readdirSync(templatesPath);
      
      // Filter for template files
      const imageTemplates = templateFiles.filter(file => 
        file.endsWith('.jpg') || file.endsWith('.jpeg') || file.endsWith('.png')
      );
      
      const htmlTemplates = templateFiles.filter(file => 
        file.endsWith('.html')
      );
      
      // Create template objects
      const templates = imageTemplates.map(file => {
        const id = file.replace(/\.(jpg|jpeg|png)$/i, '');
        const htmlFile = htmlTemplates.find(h => h.replace('.html', '') === id);
        
        return {
          id: id,
          name: `Template ${id.replace('template', '')}`,
          url: `/templates/${file}`,
          htmlUrl: htmlFile ? `/templates/${htmlFile}` : ''
        };
      });
      
      console.log(`Falling back to ${templates.length} local templates`);
      res.json({ success: true, templates });
    } catch (localError) {
      console.error('Error with local fallback:', localError);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch templates from both GCS and local storage',
        error: error.message,
        localError: localError.message
      });
    }
  }
});

// Route to get a specific template
router.get('/:id', async (req, res) => {
  const templateId = req.params.id;
  
  console.log(`Attempting to fetch template with ID: ${templateId}`);
  
  try {
    // Try to find the template HTML in different locations in GCS
    const possiblePaths = [
      `${templateId}.html`,                // Root level
      `templates/${templateId}.html`,      // templates/ folder
      `public/templates/${templateId}.html` // public/templates/ folder
    ];
    
    // Try each possible path in GCS
    for (const gcsPath of possiblePaths) {
      try {
        console.log(`Checking GCS for path: ${gcsPath}`);
        const file = storage.bucket(bucketName).file(gcsPath);
        const [exists] = await file.exists();
        
        if (exists) {
          console.log(`Found template ${templateId} at path: ${gcsPath}`);
          const [content] = await file.download();
          return res.json({
            success: true,
            templateId,
            content: content.toString('utf8'),
            source: 'gcs',
            path: gcsPath
          });
        }
      } catch (pathError) {
        console.log(`Error checking path ${gcsPath}:`, pathError.message);
        // Continue to try next path
      }
    }
    
    // If not found in GCS, try local file
    const localPath = path.join(__dirname, `../public/templates/${templateId}.html`);
    console.log(`Looking for local template at: ${localPath}`);
    
    if (fs.existsSync(localPath)) {
      const content = fs.readFileSync(localPath, 'utf8');
      console.log(`Found local template. Content length: ${content.length} bytes`);
      
      return res.json({
        success: true,
        templateId,
        content: content,
        source: 'local'
      });
    }
    
    // If template not found anywhere, use default template
    console.log(`Template ${templateId} not found in any location, using default`);
    return res.json({
      success: true,
      templateId: 'default',
      content: getDefaultTemplate(),
      source: 'default'
    });
  } catch (error) {
    console.error(`Error processing template ${templateId}:`, error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve template',
      error: error.message
    });
  }
});

function getDefaultTemplate() {
  return `
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
}

module.exports = router;