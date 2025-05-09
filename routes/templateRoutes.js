// routes/templateRoutes.js
const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { Storage } = require('@google-cloud/storage');

// Initialize Google Cloud Storage
let storage;
try {
  storage = new Storage();
} catch (error) {
  console.warn('Google Cloud Storage initialization failed:', error.message);
  console.warn('Falling back to local file system for templates');
}

const bucketName = process.env.GCS_BUCKET_NAME || 'project-relate';

// GET endpoint to list all templates
router.get('/', async (req, res) => {
  try {
    console.log('Fetching templates...');
    let templates = [];
    
    // First try Google Cloud Storage
    if (storage) {
      try {
        console.log('Attempting to fetch from GCS bucket:', bucketName);
        const [files] = await storage.bucket(bucketName).getFiles();
        
        // Filter for template image files and HTML files
        const imageFiles = files.filter(file => 
          file.name.toLowerCase().endsWith('.jpg') || 
          file.name.toLowerCase().endsWith('.jpeg') || 
          file.name.toLowerCase().endsWith('.png')
        );
        
        const htmlFiles = files.filter(file => 
          file.name.toLowerCase().endsWith('.html') &&
          !file.name.includes('index') // Exclude index.html
        );
        
        console.log(`Found ${imageFiles.length} template images and ${htmlFiles.length} HTML templates in GCS`);
        
        // Map image files to template objects
        if (imageFiles.length > 0) {
          templates = imageFiles.map(file => {
            const filename = path.basename(file.name);
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
              name: `Template ${id.replace(/template/i, '').replace(/[^0-9]/g, '')}`,
              url: url,
              htmlUrl: htmlUrl
            };
          });
        }
      } catch (gcsError) {
        console.error('Error fetching from GCS:', gcsError);
      }
    }
    
    // If no templates found from GCS, try local files
    if (templates.length === 0) {
      try {
        console.log('Falling back to local templates');
        const templatesDir = path.join(__dirname, '../public/templates');
        
        // Create templates directory if it doesn't exist
        if (!fs.existsSync(templatesDir)) {
          fs.mkdirSync(templatesDir, { recursive: true });
          console.log('Created templates directory');
        }
        
        const templateFiles = fs.readdirSync(templatesDir);
        
        // Filter for image and HTML files
        const imageTemplates = templateFiles.filter(file => 
          file.endsWith('.jpg') || file.endsWith('.jpeg') || file.endsWith('.png')
        );
        
        const htmlTemplates = templateFiles.filter(file => 
          file.endsWith('.html')
        );
        
        console.log(`Found ${imageTemplates.length} local template images`);
        
        // If no image templates found, create fallback templates
        if (imageTemplates.length === 0) {
          // Create three default templates
          templates = [
            {
              id: 'template1',
              name: 'Classic Professional',
              url: '/images/template1-thumbnail.jpg',
              htmlUrl: '/templates/template1.html'
            },
            {
              id: 'template2',
              name: 'Modern Design',
              url: '/images/template2-thumbnail.jpg',
              htmlUrl: '/templates/template2.html'
            },
            {
              id: 'template3',
              name: 'Technical Layout',
              url: '/images/template3-thumbnail.jpg',
              htmlUrl: '/templates/template3.html'
            }
          ];
        } else {
          // Map image files to template objects
          templates = imageTemplates.map(file => {
            const id = file.replace(/\.(jpg|jpeg|png)$/i, '');
            const htmlFile = htmlTemplates.find(h => h.replace('.html', '') === id);
            
            return {
              id: id,
              name: `Template ${id.replace('template', '')}`,
              url: `/templates/${file}`,
              htmlUrl: htmlFile ? `/templates/${htmlFile}` : ''
            };
          });
        }
      } catch (localError) {
        console.error('Error with local templates:', localError);
        
        // Create fallback templates if all else fails
        templates = [
          {
            id: 'template1',
            name: 'Classic Professional',
            url: '/images/RelateLogo_proto_square.png',
            htmlUrl: ''
          },
          {
            id: 'template2',
            name: 'Modern Design',
            url: '/images/RelateLogo_proto_square.png',
            htmlUrl: ''
          },
          {
            id: 'template3',
            name: 'Technical Layout',
            url: '/images/RelateLogo_proto_square.png',
            htmlUrl: ''
          }
        ];
      }
    }
    
    console.log(`Returning ${templates.length} templates`);
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

// Route to get a specific template
router.get('/:id', async (req, res) => {
  const templateId = req.params.id;
  
  console.log(`Fetching template with ID: ${templateId}`);
  
  try {
    let templateContent = null;
    
    // First try Google Cloud Storage
    if (storage) {
      try {
        // Try different possible paths in GCS
        const possiblePaths = [
          `${templateId}.html`,
          `templates/${templateId}.html`,
          `public/templates/${templateId}.html`
        ];
        
        // Try each path
        for (const gcsPath of possiblePaths) {
          try {
            console.log(`Checking GCS for path: ${gcsPath}`);
            const file = storage.bucket(bucketName).file(gcsPath);
            const [exists] = await file.exists();
            
            if (exists) {
              console.log(`Found template in GCS at: ${gcsPath}`);
              const [content] = await file.download();
              templateContent = content.toString('utf8');
              break;
            }
          } catch (pathError) {
            // Continue to try next path
          }
        }
      } catch (gcsError) {
        console.warn('Error fetching from GCS:', gcsError.message);
      }
    }
    
    // If not found in GCS, try local file
    if (!templateContent) {
      try {
        // Try looking in /templates and /public/templates
        const possibleLocalPaths = [
          path.join(__dirname, `../public/templates/${templateId}.html`),
          path.join(__dirname, `../templates/${templateId}.html`)
        ];
        
        for (const localPath of possibleLocalPaths) {
          if (fs.existsSync(localPath)) {
            console.log(`Found template locally at: ${localPath}`);
            templateContent = fs.readFileSync(localPath, 'utf8');
            break;
          }
        }
      } catch (localError) {
        console.warn('Error reading local template:', localError.message);
      }
    }
    
    // If still not found, use default template
    if (!templateContent) {
      console.log(`Template not found anywhere, using default template`);
      templateContent = getDefaultTemplate();
    }
    
    return res.json({
      success: true,
      templateId,
      content: templateContent
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