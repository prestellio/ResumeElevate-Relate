const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema({
    answers: [
        {
            question: String,
            answer: String
        }
    ],
    submittedAt: { type: Date, default: Date.now }
});

// Export the model
module.exports = mongoose.model('Answer', answerSchema);
// Prevent OverwriteModelError
// const Answer = mongoose.models.Answer || mongoose.model('Answer', answerSchema);
// module.exports = Answer;
// module.exports = mongoose.model('Answer', answerSchema); // // Export the model
