// Tailwind Configuration
tailwind.config = {
    theme: {
      extend: {
        colors: { primary: "#2563eb", secondary: "#64748b" },
        borderRadius: {
          none: "0px",
          sm: "4px",
          DEFAULT: "8px",
          md: "12px",
          lg: "16px",
          xl: "20px",
          "2xl": "24px",
          "3xl": "32px",
          full: "9999px",
          button: "8px",
        },
      },
    },
  };
  
  // Wait for DOM to be fully loaded
  document.addEventListener('DOMContentLoaded', function() {
    // Mobile menu toggle
    const menuButton = document.querySelector('button.md\\:hidden');
    const mobileMenu = document.querySelector('.md\\:flex.items-center.space-x-8');
    
    if (menuButton && mobileMenu) {
      menuButton.addEventListener('click', function() {
        // Toggle mobile menu visibility
        if (mobileMenu.classList.contains('hidden')) {
          mobileMenu.classList.remove('hidden');
          mobileMenu.classList.add('flex', 'flex-col', 'absolute', 'top-16', 'left-0', 'w-full', 'bg-white', 'p-4', 'shadow-md', 'z-50');
        } else {
          mobileMenu.classList.add('hidden');
          mobileMenu.classList.remove('flex', 'flex-col', 'absolute', 'top-16', 'left-0', 'w-full', 'bg-white', 'p-4', 'shadow-md', 'z-50');
        }
      });
    }
  
    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function(e) {
        e.preventDefault();
        
        const targetId = this.getAttribute('href');
        const targetElement = document.querySelector(targetId);
        
        if (targetElement) {
          window.scrollTo({
            top: targetElement.offsetTop - 80, // Offset for fixed header
            behavior: 'smooth'
          });
          
          // Close mobile menu if open
          if (mobileMenu && !mobileMenu.classList.contains('hidden')) {
            mobileMenu.classList.add('hidden');
          }
        }
      });
    });
  
    // File upload functionality
    const uploadButton = document.querySelector('.border-dashed button');
    const fileInput = document.getElementById('files');
    let isFileProcessing = false; // Flag to prevent double file picker
    let isSubmitting = false; // Flag to prevent double submission
    
    if (uploadButton && fileInput) {
      // Prevent the upload button from submitting the form
      uploadButton.type = 'button';
      
      // Handle file button click
      uploadButton.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        // Only open file picker if we're not processing files or submitting
        if (!isFileProcessing && !isSubmitting) {
          fileInput.click();
        }
      });
      
      // Handle file selection
      fileInput.addEventListener('change', function() {
        if (isFileProcessing) return; // Prevent double processing
        isFileProcessing = true;
        
        try {
          if (this.files && this.files.length > 0) {
            // Validate file types
            const invalidFiles = Array.from(this.files).filter(file => 
              !file.type.includes('pdf') && !file.name.toLowerCase().endsWith('.pdf')
            );
            
            if (invalidFiles.length > 0) {
              alert('Only PDF files are allowed');
              this.value = ''; // Clear selection if invalid files
              document.getElementById('fileList').innerHTML = '';
              return;
            }
            
            // Show selected files
            const fileNames = Array.from(this.files)
              .map(file => `<div class="flex items-center text-sm text-gray-700 mt-2">
                <i class="ri-file-pdf-line text-primary mr-2"></i>${file.name}
              </div>`).join('');
            
            document.getElementById('fileList').innerHTML = fileNames;
          }
        } finally {
          isFileProcessing = false;
        }
      });
    }
  
    // Form submission handler with Google Apps Script integration
    const contactForm = document.getElementById('ideaForm');
    
    if (contactForm) {
      contactForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        if (isSubmitting) return; // Prevent double submission
        isSubmitting = true;
        
        // Validate required fields
        const formData = {
          fullName: document.getElementById('fullName').value,
          email: document.getElementById('email').value,
          college: document.getElementById('college').value,
          subject: document.getElementById('subject').value,
          message: document.getElementById('message').value,
          timestamp: new Date().toISOString(),
          files: []
        };
  
        // Get file input and validate
        if (fileInput.files.length < 2) {
          alert('Please upload at least 2 PDF files');
          isSubmitting = false;
          return;
        }
  
        // Show loading state
        const submitButton = contactForm.querySelector('button[type="submit"]');
        const originalButtonText = submitButton.innerHTML;
        submitButton.disabled = true;
        submitButton.innerHTML = 'Submitting...';
  
        try {
          // Convert files to Base64
          for (const file of fileInput.files) {
            if (!file.type.includes('pdf') && !file.name.toLowerCase().endsWith('.pdf')) {
              throw new Error('Only PDF files are allowed');
            }
  
            const base64Content = await convertFileToBase64(file);
            formData.files.push({
              name: file.name,
              type: file.type,
              content: base64Content
            });
          }
  
          // Google Apps Script Web App URL
          const GOOGLE_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbz8lFohctA11bsEGaTunCzZfIz5GQGn3nC_aEuHKn7s55r2ymzUTae3b7dj2fEvtMlH1A/exec';
  
          // Send data to Google Apps Script
          const response = await fetch(GOOGLE_APPS_SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify(formData)
          });
  
          const result = await response.json();
  
          if (result.success) {
            alert('Form submitted successfully!');
            // Reset the form first
            contactForm.reset();
            // Then clear file-related elements
            document.getElementById('fileList').innerHTML = '';
            // Finally clear the file input
            fileInput.value = '';
          } else {
            throw new Error(result.error || 'Submission failed');
          }
        } catch (error) {
          console.error('Submission error:', error);
          alert(`Error: ${error.message}`);
        } finally {
          // Reset states
          submitButton.disabled = false;
          submitButton.innerHTML = originalButtonText;
          isSubmitting = false;
        }
      });
    }
  
    // Helper function to convert file to Base64
    function convertFileToBase64(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          // Extract base64 content without the data URL prefix
          const base64Content = reader.result.split(',')[1];
          resolve(base64Content);
        };
        reader.onerror = () => reject(new Error('File conversion failed'));
        reader.readAsDataURL(file);
      });
    }
  
    // Helper functions
    function highlightInvalid(element) {
      element.classList.add('border-red-500');
      element.classList.remove('focus:border-primary');
      
      // Add error message if not exists
      if (!element.nextElementSibling || !element.nextElementSibling.classList.contains('text-red-500')) {
        const errorMsg = document.createElement('p');
        errorMsg.className = 'text-red-500 text-xs mt-1';
        errorMsg.textContent = 'This field is required';
        element.parentNode.insertBefore(errorMsg, element.nextSibling);
      }
    }
    
    function removeHighlight(element) {
      element.classList.remove('border-red-500');
      element.classList.add('focus:border-primary');
      
      // Remove error message if exists
      if (element.nextElementSibling && element.nextElementSibling.classList.contains('text-red-500')) {
        element.nextElementSibling.remove();
      }
    }
    
    function isValidEmail(email) {
      const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
      return re.test(String(email).toLowerCase());
    }
  });
