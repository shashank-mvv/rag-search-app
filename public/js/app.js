// Initialize i18next
i18next
  .use(i18nextBrowserLanguageDetector)
  .use(i18nextHttpBackend)
  .init({
    fallbackLng: 'en',
    debug: true,
    interpolation: {
      escapeValue: false,
    },
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    },
    detection: {
      order: ['querystring', 'navigator'],
      lookupQuerystring: 'lng'
    }
  });

// Update content when language changes
function updateContent() {
  document.querySelectorAll('[data-i18n]').forEach(element => {
    const key = element.getAttribute('data-i18n');
    if (key) {
      element.innerHTML = i18next.t(key);
    }
  });
}

// Prevent default event behavior
function preventDefaults(e) {
  e.preventDefault();
  e.stopPropagation();
}

// Update file list UI with all selected files
function updateFileUI(files) {
  console.log('Updating file UI with files:', files.length);
  
  const fileList = document.getElementById('fileList');
  const fileLabel = document.querySelector('.file-upload-label');
  const uploadText = fileLabel?.querySelector('.upload-text');
  const fileCountIndicator = document.getElementById('fileCountIndicator');
  
  if (!fileList || !fileLabel) {
    console.error('Required elements not found in the DOM');
    return;
  }
  
  // Clear existing file list
  fileList.innerHTML = '';
  
  // Update file count indicator
  if (fileCountIndicator) {
    fileCountIndicator.textContent = `${files.length}/5 files selected`;
  }
  
  // If no files, reset the UI
  if (files.length === 0) {
    resetFileUI();
    return;
  }
  
  // Update file label styling to show active state
  fileLabel.classList.remove('border-gray-300', 'hover:border-blue-500');
  fileLabel.classList.add('border-blue-400', 'bg-blue-50');
  
  // Update upload text to show number of files and allow adding more
  if (uploadText) {
    uploadText.innerHTML = `
      <div class="flex flex-col items-center space-y-2">
        <div class="flex items-center space-x-2">
          <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
          </svg>
          <span class="text-blue-700 font-medium">Add more files</span>
        </div>
        <p class="text-sm text-gray-500">or drag and drop files here</p>
      </div>
    `;
  }
  
  // Add each file to the file list
  Array.from(files).forEach((file, index) => {
    const fileItem = document.createElement('div');
    fileItem.className = 'flex items-center justify-between bg-gray-50 p-2 rounded-md';
    fileItem.innerHTML = `
      <div class="flex items-center space-x-2">
        <svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
        </svg>
        <span class="text-sm text-gray-700 truncate max-w-xs" title="${file.name}">${file.name}</span>
        <span class="text-xs text-gray-500">(${formatFileSize(file.size)})</span>
      </div>
      <button type="button" class="text-red-500 hover:text-red-700" data-file-index="${index}">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
        </svg>
      </button>
    `;
    fileList.appendChild(fileItem);
  });
}

// Reset file upload UI to initial state
function resetFileUI() {
  console.log('Resetting file UI');
  
  const fileList = document.getElementById('fileList');
  const fileLabel = document.querySelector('.file-upload-label');
  const fileInput = document.getElementById('documents');
  const uploadText = fileLabel?.querySelector('.upload-text');
  const fileCountIndicator = document.getElementById('fileCountIndicator');
  
  if (!fileList || !fileLabel || !fileInput) {
    console.error('Required elements not found in the DOM');
    return;
  }
  
  // Reset file input
  fileInput.value = '';
  
  // Clear file list
  fileList.innerHTML = '';
  
  // Reset file count indicator
  if (fileCountIndicator) {
    fileCountIndicator.textContent = '0/5 files selected';
  }
  
  // Reset file label styling
  fileLabel.classList.remove('border-blue-400', 'bg-blue-50');
  fileLabel.classList.add('border-gray-300', 'hover:border-blue-500', 'border-dashed');
  
  // Reset upload text
  if (uploadText) {
    uploadText.innerHTML = `
      <div class="flex flex-col items-center space-y-2">
        <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
        </svg>
        <p class="text-lg font-medium text-gray-700" data-i18n="dragAndDrop">Drop files here or click to browse</p>
        <p class="text-sm text-gray-500" data-i18n="fileTypes">PDF, TXT, DOCX, and image files supported (max 5 files, 10MB each)</p>
      </div>
    `;
  }
}

// Format file size to human readable format
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Handle file drop
document.addEventListener('drop', (e) => {
  preventDefaults(e);
  
  const dt = e.dataTransfer;
  const files = dt.files;
  const fileInput = document.getElementById('documents');
  
  if (!fileInput) return;
  
  // Create a new DataTransfer object
  const dataTransfer = new DataTransfer();
  
  // Add existing files
  if (fileInput.files) {
    Array.from(fileInput.files).forEach(file => {
      dataTransfer.items.add(file);
    });
  }
  
  // Add new files (up to 5 total)
  const remainingSlots = 5 - (fileInput.files?.length || 0);
  if (remainingSlots > 0) {
    const filesToAdd = Math.min(remainingSlots, files.length);
    Array.from(files).slice(0, filesToAdd).forEach(file => {
      dataTransfer.items.add(file);
    });
  } else {
    alert('Maximum of 5 files allowed');
  }
  
  // Update the file input
  fileInput.files = dataTransfer.files;
  
  // Update the UI
  updateFileUI(fileInput.files);
});

// Handle file input change
document.getElementById('documents')?.addEventListener('change', (e) => {
  updateFileUI(e.target.files);
});

// Handle form submission
async function handleSubmit(e) {
  // Prevent default form submission if it's triggered by a form
  if (e) e.preventDefault();
  
  const subject = document.getElementById('subject')?.value.trim();
  const question = document.getElementById('question')?.value.trim();
  const fileInput = document.getElementById('documents');
  const language = document.getElementById('languageSelector')?.value || 'en';
  const submitBtn = document.getElementById('submitBtn');
  
  // Validate required fields
  if (!subject || !question) {
    alert(i18next.t('fillRequiredFields') || 'Please fill in all required fields');
    return;
  }

  try {
    // Show loading state with hourglass icon
    submitBtn.disabled = true;
    submitBtn.innerHTML = `
      <svg class="animate-spin h-5 w-5 inline-block mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      ${i18next.t('processing') || 'Processing...'}
    `;
    
    // Create form data
    const formData = new FormData();
    formData.append('subject', subject);
    formData.append('question', question);
    formData.append('language', language);
    
    // Add files if any
    if (fileInput && fileInput.files.length > 0) {
      Array.from(fileInput.files).forEach((file, index) => {
        formData.append('documents', file);
      });
    }

    const response = await fetch('/api/process', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    const data = await response.json();
    
    // Display response
    const responseContainer = document.getElementById('responseContainer');
    const responseContent = document.getElementById('responseContent');
    
    if (responseContainer && responseContent) {
      responseContent.textContent = data.response;
      responseContainer.classList.remove('hidden');
      
      // Scroll to response
      responseContainer.scrollIntoView({ behavior: 'smooth' });
      
      // Show copy button
      const copyBtn = document.getElementById('copyBtn');
      if (copyBtn) {
        copyBtn.style.display = 'block';
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
    alert(i18next.t('errorOccurred') || 'An error occurred while processing your request');
  } finally {
    // Reset button state
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = i18next.t('getAnswer') || 'Get Answer';
    }
  }
}

// Clear form functionality
function clearForm() {
  // Reset form fields
  const subjectInput = document.getElementById('subject');
  const questionInput = document.getElementById('question');
  const responseContainer = document.getElementById('responseContainer');
  const copyBtn = document.getElementById('copyBtn');
  
  if (subjectInput) subjectInput.value = '';
  if (questionInput) questionInput.value = '';
  if (responseContainer) responseContainer.classList.add('hidden');
  if (copyBtn) copyBtn.style.display = 'none';
  
  // Reset file upload
  resetFileUI();
}

// Initialize UI components and event listeners
function initializeUI() {
  // Add event listeners
  document.getElementById('submitBtn')?.addEventListener('click', handleSubmit);
  document.getElementById('clearFormBtn')?.addEventListener('click', clearForm);
  
  // Add language change handler
  const languageSelector = document.getElementById('languageSelector');
  if (languageSelector) {
    languageSelector.addEventListener('change', (e) => {
      i18next.changeLanguage(e.target.value);
    });
  }
  
  // Add drag and drop event listeners
  const dropArea = document.querySelector('.file-upload-label');
  if (dropArea) {
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
      dropArea.addEventListener(eventName, preventDefaults, false);
    });
  }
  
  // Initialize i18n
  i18next.on('languageChanged', updateContent);
  updateContent();
}

// Initialize everything when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM fully loaded, initializing...');
  initializeUI();
});

// Copy to clipboard
document.getElementById('copyBtn')?.addEventListener('click', () => {
  const responseContent = document.getElementById('responseContent');
  if (responseContent) {
    navigator.clipboard.writeText(responseContent.textContent)
      .then(() => {
        const copyBtn = document.getElementById('copyBtn');
        if (copyBtn) {
          const originalText = copyBtn.textContent;
          copyBtn.textContent = 'Copied!';
          setTimeout(() => {
            copyBtn.textContent = originalText;
          }, 2000);
        }
      })
      .catch(err => {
        console.error('Failed to copy text: ', err);
      });
  }
});
