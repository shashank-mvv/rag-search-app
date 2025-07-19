# RAG Model with Bilingual Support (English/Hindi)

A simple Retrieval-Augmented Generation (RAG) model that can process text and document inputs to provide answers in both English and Hindi.

## Features

- **Bilingual Support**: Switch between English and Hindi for both input and output
- **Document Processing**: Upload PDFs and images (JPG, PNG) for context
- **Simple Interface**: User-friendly web interface for easy interaction
- **Responsive Design**: Works on both desktop and mobile devices

## Prerequisites

- Node.js (v14 or higher)
- npm (comes with Node.js)
- OpenAI API key

## Setup

1. **Clone the repository** (if applicable) or navigate to the project directory

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   - Copy `.env.example` to `.env`
   - Add your OpenAI API key to the `.env` file

4. **Start the server**
   ```bash
   npm start
   ```
   For development with auto-reload:
   ```bash
   npm run dev
   ```

5. **Open in browser**
   Visit `http://localhost:3001` in your web browser

## Usage

1. **Select Language**: Choose between English (en) or Hindi (hi)
2. **Enter Subject/Field**: Provide the topic or domain of your question
3. **Ask a Question**: Type your question in the text area
4. **Upload Documents (Optional)**: Add PDF or image files for context
5. **Get Answer**: Click the button to process your request
6. **View Response**: The answer will be displayed below the form

## Project Structure

```
RAG model/
├── public/                 # Static files
│   ├── js/                 # Frontend JavaScript
│   │   └── app.js          # Main application logic
│   ├── locales/            # Language files
│   │   ├── en/             # English translations
│   │   └── hi/             # Hindi translations
│   └── index.html          # Main HTML file
├── .env                   # Environment variables
├── package.json           # Project dependencies
└── server.js              # Backend server
```

## Dependencies

- **Frontend**:
  - Tailwind CSS for styling
  - i18next for internationalization
  - File and drag-and-drop handling

- **Backend**:
  - Express.js for the server
  - Multer for file uploads
  - pdf-parse for PDF processing
  - Tesseract.js for OCR (image text extraction)
  - OpenAI API for text generation

## License

This project is open source and available under the [MIT License](LICENSE).
