const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');

// GET endpoint to list all template images
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
        url: `/templates/${id}.jpg`,
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

// Route to get a specific template
router.get('/:id', async (req, res) => {
  const templateId = req.params.id;
  
  try {
    const templatePath = path.join(__dirname, `../public/templates/${templateId}.html`);
    
    // Read the template file
    const content = await fs.readFile(templatePath, 'utf8');
    
    res.json({
      success: true,
      templateId,
      content: content
    });
  } catch (error) {
    console.error('Error reading template file:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve template',
      error: error.message
    });
  }
});

module.exports = router;