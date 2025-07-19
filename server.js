const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const fsPromises = fs.promises;
const pdf = require('pdf-parse');
const { createWorker } = require('tesseract.js');
const { OpenAI } = require('openai');
const i18n = require('i18n');
require('dotenv').config();

// Initialize Express app
const app = express();
const port = process.env.PORT || 3001;

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf' || file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only PDF and image files are allowed'));
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
    files: 5 // Maximum 5 files per upload
  }
});

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Configure i18n for language support
i18n.configure({
  locales: ['en', 'hi'],
  directory: path.join(__dirname, 'public', 'locales'),
  defaultLocale: 'en',
  objectNotation: true,
  updateFiles: false
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));
app.use(i18n.init);

// Routes
app.post('/api/process', upload.array('documents', 5), async (req, res) => {
  try {
    const { subject, question, language = 'en' } = req.body;
    let textContent = '';

    // Process uploaded files if they exist
    if (req.files && req.files.length > 0) {
      const processPromises = req.files.map(async (file) => {
        try {
          let fileContent = '';
          if (file.mimetype === 'application/pdf') {
            const dataBuffer = await fsPromises.readFile(file.path);
            const data = await pdf(dataBuffer);
            fileContent = data.text;
          } else if (file.mimetype.startsWith('image/')) {
            const worker = await createWorker();
            await worker.loadLanguage('eng+hin');
            await worker.initialize('eng+hin');
            const { data: { text } } = await worker.recognize(file.path);
            await worker.terminate();
            fileContent = text;
          }
          return fileContent;
        } catch (error) {
          console.error('Error processing file:', file.originalname, error);
          return ''; // Skip files that fail to process
        } finally {
          // Clean up uploaded file
          try {
            await fsPromises.unlink(file.path);
          } catch (error) {
            console.error('Error cleaning up file:', file.originalname, error);
          }
        }
      });

      // Wait for all files to be processed and combine their content
      const fileContents = await Promise.all(processPromises);
      textContent = fileContents.join('\n\n');
    }

    // Generate response using RAG
    const response = await generateRAGResponse({
      subject,
      question,
      context: textContent,
      language
    });

    res.json({
      success: true,
      response,
      language
    });
  } catch (error) {
    console.error('Error processing request:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Generate RAG response with strict subject enforcement
async function generateRAGResponse({ subject, question, context, language }) {
  // First, check if the question is related to the subject
  const relevanceCheckPrompt = `Determine if the following question is related to the subject "${subject}". 
  Question: "${question}"
  
  Respond ONLY with "true" if the question is related to ${subject}, or "false" if it is not.`;

  try {
    // Check relevance first
    const relevanceCheck = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { 
          role: 'system', 
          content: 'You are a relevance checker. Your only job is to determine if a question is related to a given subject. Respond with "true" or "false" only.'
        },
        { 
          role: 'user', 
          content: relevanceCheckPrompt
        }
      ],
      temperature: 0.1, // Keep it deterministic
      max_tokens: 5
    });

    const isRelevant = relevanceCheck.choices[0]?.message?.content.trim().toLowerCase() === 'true';

    if (!isRelevant) {
      return language === 'hi' 
        ? 'क्षमा करें, आपका प्रश्न वर्तमान विषय से संबंधित नहीं है। कृपया विषय या प्रश्न बदलें।' 
        : 'I\'m sorry, but your question is outside the current subject scope. Please change the subject or ask a question related to ' + subject + '.';
    }

    // If relevant, proceed with the full response
    const prompt = `You are an AI assistant specialized in ${subject}. You must ONLY answer questions that are directly related to ${subject} and its core topics.
    
    Context: ${context}\n\nQuestion: ${question}\n\n`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { 
          role: 'system', 
          content: `You are a helpful assistant that provides accurate and detailed answers exclusively about ${subject}.You are to always answer in ${language} and answer should be final not additonal tasks for user. Extrasct data you can as a last and only application being used.You may use online tools if needed but redirect user to other apps or other tasks unless it absoulutely required. You can use online tools if needed but redirect user to other apps or other tasks unless it absoulutely required.if search or analysis is given as a task you may return few links that are most relevant as part of your search or create a reply based of your research or analysis. 
          If a question is not directly related to ${subject}, respond with a polite message explaining that the question is outside your scope.`
        },
        { 
          role: 'user', 
          content: prompt 
        }
      ],
      temperature: 0.7,
    });

    let response = completion.choices[0]?.message?.content || 'Sorry, I could not generate a response.';
    
    // Double-check the response for relevance
    const verificationPrompt = `Is the following response strictly about "${subject}" and does it avoid answering questions outside this scope?
    Response: "${response}"
    
    Respond with "true" if the response is properly scoped, or "false" if it answers questions outside the specified subject.`;
    
    const verification = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { 
          role: 'system', 
          content: 'You are a response verifier. Your only job is to check if a response stays strictly within the given subject scope.'
        },
        { 
          role: 'user', 
          content: verificationPrompt
        }
      ],
      temperature: 0.1,
      max_tokens: 5
    });

    const isResponseRelevant = verification.choices[0]?.message?.content.trim().toLowerCase() === 'true';
    
    if (!isResponseRelevant) {
      return language === 'hi' 
        ? 'क्षमा करें, आपका प्रश्न वर्तमान विषय से संबंधित नहीं है। कृपया विषय या प्रश्न बदलें।' 
        : 'I\'m sorry, but your question is outside the current subject scope. Please change the subject or ask a question related to ' + subject + '.';
    }

    return response;
    
  } catch (error) {
    console.error('Error in generateRAGResponse:', error);
    return 'An error occurred while processing your request. Please try again.';
  }
}

// Ensure uploads directory exists
const ensureUploadsDir = async () => {
  const uploadsDir = path.join(__dirname, 'uploads');
  try {
    await fsPromises.access(uploadsDir);
  } catch (error) {
    await fsPromises.mkdir(uploadsDir, { recursive: true });
  }
};

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });});

// Start server
const startServer = async () => {
  try {
    await ensureUploadsDir();
    
    app.listen(port, '0.0.0.0', () => {
      console.log(`Server running on http://localhost:${port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
