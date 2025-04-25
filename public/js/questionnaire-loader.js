const express = require('express');
const router = express.Router();
const { Storage } = require('@google-cloud/storage');

// Initialize Google Cloud Storage
const storage = new Storage();
const bucketName = 'project-relate'; // Your bucket name
let questions = [];

// GET endpoint to list all questions in the bucket
router.get('/', async (req, res) => {
  try {
    console.log('Fetching questions from Google Cloud Storage bucket:', bucketName);
    
    // Create question objects manually based on the files you have in your bucket

    questions = [
      {
        id: 'question1',
        name: 'Question 1',
        url: `https://storage.googleapis.com/${bucketName}/questions/question1.html`
      },
      {
        id: 'question2',
        name: 'Template 2',
        url: `https://storage.googleapis.com/${bucketName}/questions/question2.html`,
      }
    ];
    
    console.log(`Returning ${questions.length} questions`);
    res.json({ success: true, questions });
  } catch (error) {
    console.error('Error fetching questions from GCS:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch questions',
      error: error.message
    });
  }
});

// Route to get a specific question
router.get('/:id', async (req, res) => {
  const questionId = req.params.id;
  
  try {
    // Create the URL to the HTML file
    const url = `https://storage.googleapis.com/${bucketName}/questions/${questionId}.html`;
    
    // Fetch the HTML content from GCS
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch question: ${response.status}`);
    }
    
    const content = await response.text();
    
    res.json({
      success: true,
      questionId,
      content: content
    });
  } catch (error) {
    console.error('Error reading question file from GCS:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve question',
      error: error.message
    });
  }
});

module.exports = router;

async function InitQuestionnaire() {
        
    const questionContainer = document.getElementById('question-loader');

    questions.forEach( question => {
        try{
            let div = document.createElement('div');
            questionHTML = FetchQuestion(questionId);
            div.innerHTML = questionHTML;
            questionContainer.appendChild(div)

        } catch (error) {
            console.error('Error loading question:', error);
            alert(`Could not load the question (${questionId}).`);
        }

    });
    
}

async function FetchQuestion(questionId) {
    response = await fetch(`api/questions/${questionId}`);
    return await response.json();
}

document.addEventListener('DOMContentLoaded', function() {
    // Questionnaire page initialization
    if (window.location.pathname.includes('questionnaire.html')) {
        InitQuestionnaire();
    }
});

