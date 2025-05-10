// Your Existing Tab Switching Code
function openTab(evt, tabName) {
    // Hide all tab content
    const tabContents = document.getElementsByClassName("tab-content");
    for (let i = 0; i < tabContents.length; i++) {
        tabContents[i].style.display = "none";
    }

    // Remove active class from all tab buttons
    const tabButtons = document.getElementsByClassName("tab-button");
    for (let i = 0; i < tabButtons.length; i++) {
        tabButtons[i].className = tabButtons[i].className.replace(" active", "");
    }

    // Show the selected tab content and mark the button as active
    document.getElementById(tabName).style.display = "block";
    evt.currentTarget.className += " active";

    // Ensure modal remains accessible
    const modal = document.getElementById("modal");
    if (modal) {
        document.body.appendChild(modal);
    }
}

// Wait for DOM to be fully loaded before accessing elements
document.addEventListener('DOMContentLoaded', function() {
    // Helper function to check if user is logged in using the authHandler
    function isUserLoggedIn() {
        return window.authHandler && window.authHandler.isAuthenticated();
    }

    // Helper function to show login required message
    function showLoginRequired(elementId) {
        const element = document.getElementById(elementId);
        if (element) {
            element.innerText = "No reponse generated.";
            element.style.display = "block";
        }
        
        // Show the auth modal using existing handler
        if (window.authHandler) {
            window.authHandler.showLoginPrompt();
        }
    }

    // Show home tab by default when page loads
    document.getElementById("home").style.display = "block";

    // Drag and Drop Image Upload for Multiple Drop Areas
    const dropAreas = document.querySelectorAll(".drop-area");

    // Loop through each drop area to add event listeners
    dropAreas.forEach((dropArea) => {
        const imageInput = dropArea.querySelector(".imageInput");
        const preview = dropArea.querySelector(".preview");
        const browse = dropArea.querySelector(".browse");

        if (imageInput) {
            imageInput.addEventListener("change", (event) => handleFiles(event, preview));
        }

        if (browse) {
            browse.addEventListener("click", () => imageInput.click());
        }

        dropArea.addEventListener("dragover", (e) => {
            e.preventDefault();
            dropArea.style.backgroundColor = "#e0e0e0";
        });

        dropArea.addEventListener("dragleave", () => {
            dropArea.style.backgroundColor = "#f9f9f9";
        });

        dropArea.addEventListener("drop", (e) => {
            e.preventDefault();
            dropArea.style.backgroundColor = "#f9f9f9";
            handleFiles(e, preview);
        });
    });

    // Handle Files and Display Preview
    function handleFiles(event, preview) {
        let file = event.target.files ? event.target.files[0] : event.dataTransfer.files[0];

        if (file && file.type.startsWith("image/")) {
            const reader = new FileReader();
            reader.onload = function (e) {
                preview.src = e.target.result;
                preview.style.display = "block";
            };
            reader.readAsDataURL(file);
        } else {
            alert("Please upload a valid image file.");
        }
    }

    // Check if elements exist before adding event listeners
    const openPracticesModalBtn = document.getElementById("openPracticesModalBtn");
    if (openPracticesModalBtn) {
        openPracticesModalBtn.addEventListener("click", function () {
            document.getElementById("practicesModal").style.display = "block";
            // Reset the form and response when opening modal
            document.getElementById("responsePractices").style.display = "none";
            document.getElementById("responsePractices").innerText = "";
            
            // Make sure form is visible
            const formElements = document.getElementById("practicesModal").querySelectorAll(".form-group, #submitPracticesDetails");
            formElements.forEach(el => el.style.display = "block");
        });
    }

    const closePracticesModal = document.getElementById("closePracticesModal");
    if (closePracticesModal) {
        closePracticesModal.addEventListener("click", function () {
            document.getElementById("practicesModal").style.display = "none";
        });
    }

    // Schemes Modal
    const openSchemesModalBtn = document.getElementById("openSchemesModalBtn");
    if (openSchemesModalBtn) {
        openSchemesModalBtn.addEventListener("click", function () {
            document.getElementById("schemesModal").style.display = "block";
            // Reset the form and response when opening modal
            document.getElementById("responseSchemes").style.display = "none";
            document.getElementById("responseSchemes").innerText = "";
            
            // Make sure form is visible
            document.getElementById("schemesForm").style.display = "block";
        });
    }

    const closeSchemesModal = document.getElementById("closeSchemesModal");
    if (closeSchemesModal) {
        closeSchemesModal.addEventListener("click", function () {
            document.getElementById("schemesModal").style.display = "none";
        });
    }

    // Close modals when clicking outside
    window.addEventListener("click", function (event) {
        const practicesModal = document.getElementById("practicesModal");
        const schemesModal = document.getElementById("schemesModal");
        
        if (practicesModal && event.target.id === "practicesModal") {
            practicesModal.style.display = "none";
        } else if (schemesModal && event.target.id === "schemesModal") {
            schemesModal.style.display = "none";
        }
    });

    // Submit Practices Form & Fetch AI Response
    const submitPracticesDetails = document.getElementById("submitPracticesDetails");
    if (submitPracticesDetails) {
        submitPracticesDetails.addEventListener("click", async function () {
            // Check if user is logged in
            if (!isUserLoggedIn()) {
                showLoginRequired("responsePractices");
                // Hide all form elements
                const formElements = document.getElementById("practicesModal").querySelectorAll(".form-group, #submitPracticesDetails");
                formElements.forEach(el => el.style.display = "none");
                return;
            }
            // Re-show the form elements if previously hidden
            const formElements = document.getElementById("practicesModal").querySelectorAll(".form-group, #submitPracticesDetails");
            formElements.forEach(el => el.style.display = "block");

            
            const soilType = document.getElementById("soilType").value.trim();
            const irrigation = document.getElementById("irrigation").value.trim();
            const crops = document.getElementById("crops").value.trim();
            const pestIssues = document.getElementById("pestIssues").value.trim();
            const fertilizers = document.getElementById("fertilizers").value.trim();
            const weatherIssues = document.getElementById("weatherIssues").value.trim();

            if (!soilType || !irrigation || !crops) {
                alert("Please fill all required details.");
                return;
            }

            const userPrompt = `Soil Type: ${soilType}, Irrigation: ${irrigation}, Crops: ${crops}, Pest Issues: ${pestIssues}, Fertilizers: ${fertilizers}, Weather Issues: ${weatherIssues}. Suggest best farming practices for this farmer.`;

            try {
                // Show loading message in the response element
                const responsePractices = document.getElementById("responsePractices");
                responsePractices.innerText = "Generating response...";
                responsePractices.style.display = "block";
                
                // Hide all form elements
                const formElements = document.getElementById("practicesModal").querySelectorAll(".form-group, #submitPracticesDetails");
                formElements.forEach(el => el.style.display = "none");

                const response = await fetch("/generate-response", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ prompt: userPrompt }),
                });

                const data = await response.json();

                if (data.response) {
                    responsePractices.innerText = data.response;
                } else {
                    responsePractices.innerText = "No response received.";
                }
            } catch (error) {
                console.error("Error fetching AI response:", error);
                document.getElementById("responsePractices").innerText = "Error fetching data.";
            }
        });
    }

    // Submit Schemes Form & Fetch AI Response
    const submitSchemesDetails = document.getElementById("submitSchemesDetails");
    if (submitSchemesDetails) {
        submitSchemesDetails.addEventListener("click", async function () {
            // Check if user is logged in
            if (!isUserLoggedIn()) {
                showLoginRequired("responseSchemes");
                // Hide the form completely
                document.getElementById("schemesForm").style.display = "none";
                return;
            }
            // Re-show the form if previously hidden
            document.getElementById("schemesForm").style.display = "block";

            
            const state = document.getElementById("state").value.trim();
            const landArea = document.getElementById("landArea").value.trim();
            const crops = document.getElementById("cropsSchemes").value.trim();
            const income = document.getElementById("income").value.trim();
            const kcc = document.getElementById("kcc").value.trim();
            const pmKisan = document.getElementById("pmKisan").value.trim();
            const otherDetails = document.getElementById("otherDetails").value.trim();

            if (!state || !landArea || !crops || !income) {
                alert("Please fill all required details.");
                return;
            }

            const userPrompt = `State: ${state}, Land Area: ${landArea} acres, Crops: ${crops}, Annual Income: ${income}, KCC: ${kcc}, PM-KISAN: ${pmKisan}, Other Details: ${otherDetails}. Suggest government schemes suitable for this farmer.`;

            try {
                // Show loading message in the response element
                const responseSchemes = document.getElementById("responseSchemes");
                responseSchemes.innerText = "Generating response...";
                responseSchemes.style.display = "block";
                
                // Hide the form completely
                document.getElementById("schemesForm").style.display = "none";

                const response = await fetch("/generate-response", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ prompt: userPrompt }),
                });

                const data = await response.json();

                if (data.response) {
                    responseSchemes.innerText = data.response;
                    responseSchemes.style.display = "block";
                } else {
                    responseSchemes.innerText = "No response received.";
                }
            } catch (error) {
                console.error("Error fetching AI response:", error);
                document.getElementById("responseSchemes").innerText = "Error fetching data.";
            }
        });
    }

    // Image Upload Preview (for Soil Quality Check)
    const imageUpload = document.getElementById("imageUpload");
    if (imageUpload) {
        imageUpload.addEventListener("change", function(event) {
            const preview = document.getElementById("preview");
            const file = event.target.files[0];
            
            if (file && file.type.startsWith("image/")) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    preview.src = e.target.result;
                    preview.style.display = "block";
                    const placeholder = document.querySelector(".upload-placeholder");
                    if (placeholder) {
                        placeholder.style.display = "none";
                    }
                };
                reader.readAsDataURL(file);
            }
        });
    }

    // Submit Image Analysis
    const imgSubmit = document.querySelector(".img-submit");
    if (imgSubmit) {
        imgSubmit.addEventListener("click", async function() {
            // Check if user is logged in
            if (!isUserLoggedIn()) {
                window.authHandler.showLoginPrompt();
                return;
            }
            
            const preview = document.getElementById("preview");
            
            if (!preview.src || preview.src === "") {
                alert("Please upload an image first.");
                return;
            }
            
            // Here you would send the image to your server for Gemini analysis
            // This is a placeholder for that functionality
            alert("Image analysis functionality to be implemented");
        });
    }

    // Handle image upload with proper element references
    const preview = document.getElementById('preview');
    const uploadPlaceholder = document.getElementById('uploadPlaceholder');
    const submitButton = document.getElementById('submitButton');
    const loading = document.getElementById('loading');
    const resultsContainer = document.getElementById('resultsContainer');
    const closeResults = document.getElementById('closeResults');
    
    // Check if elements exist to avoid errors
    if (imageUpload && preview && uploadPlaceholder && submitButton) {
        imageUpload.addEventListener('change', function() {
            if (this.files && this.files[0]) {
                const reader = new FileReader();
                
                reader.onload = function(e) {
                    preview.src = e.target.result;
                    preview.style.display = 'block';
                    uploadPlaceholder.style.display = 'none';
                    submitButton.disabled = false;
                    
                    // Hide results if previously shown
                    if (resultsContainer) {
                        resultsContainer.style.display = 'none';
                    }
                };
                
                reader.readAsDataURL(this.files[0]);
            }
        });
    }

    // Handle close button click for results
    if (closeResults && resultsContainer) {
        closeResults.addEventListener('click', function() {
            resultsContainer.style.display = 'none';
        });
    }

    // Handle submit button click
    if (submitButton && imageUpload && loading && resultsContainer) {
        submitButton.addEventListener('click', async function() {
            // Check if user is logged in
            if (!isUserLoggedIn()) {
                const errorContent = document.createElement('div');
                errorContent.innerHTML = `<h3>Login Required</h3><p>No response generated.</p>`;
                
                resultsContainer.innerHTML = '';
                if (closeResults) {
                    resultsContainer.appendChild(closeResults.cloneNode(true));
                    // Re-attach event listener to the cloned button
                    resultsContainer.querySelector('#closeResults').addEventListener('click', function() {
                        resultsContainer.style.display = 'none';
                    });
                }
                resultsContainer.appendChild(errorContent);
                resultsContainer.style.display = 'block';
                
                // Show the auth modal
                window.authHandler.showLoginPrompt();
                return;
            }
            
            if (!imageUpload.files || !imageUpload.files[0]) {
                return;
            }
            
            // Show loading indicator and disable submit button
            submitButton.disabled = true;
            loading.style.display = 'flex'; // Changed to flex for centering
            
            try {
                // Create form data for the API request
                const formData = new FormData();
                formData.append('image', imageUpload.files[0]);
                
                // Send the image to the server
                const response = await fetch('/analyze-soil', {
                    method: 'POST',
                    body: formData
                });
                
                if (!response.ok) {
                    throw new Error('Failed to analyze image');
                }
                
                const data = await response.json();
                
                if (data.success) {
                    // Display the results as an overlay
                    const resultContent = document.createElement('div');
                    resultContent.innerHTML = `<h3>Analysis Results</h3><p>${data.analysis.replace(/\n/g, '<br>')}</p>`;
                    
                    // Clear previous results and add new ones
                    resultsContainer.innerHTML = '';
                    if (closeResults) {
                        resultsContainer.appendChild(closeResults.cloneNode(true));
                        // Re-attach event listener to the cloned button
                        resultsContainer.querySelector('#closeResults').addEventListener('click', function() {
                            resultsContainer.style.display = 'none';
                        });
                    }
                    resultsContainer.appendChild(resultContent);
                    
                    // Show the results container
                    resultsContainer.style.display = 'block';
                } else {
                    const errorContent = document.createElement('div');
                    errorContent.innerHTML = `<h3>Error</h3><p>${data.error}</p>`;
                    
                    resultsContainer.innerHTML = '';
                    if (closeResults) {
                        resultsContainer.appendChild(closeResults.cloneNode(true));
                        // Re-attach event listener to the cloned button
                        resultsContainer.querySelector('#closeResults').addEventListener('click', function() {
                            resultsContainer.style.display = 'none';
                        });
                    }
                    resultsContainer.appendChild(errorContent);
                    
                    resultsContainer.style.display = 'block';
                }
            } catch (error) {
                console.error('Error:', error);
                
                const errorContent = document.createElement('div');
                errorContent.innerHTML = `<h3>Error</h3><p>Error analyzing image: ${error.message}</p>`;
                
                resultsContainer.innerHTML = '';
                if (closeResults) {
                    resultsContainer.appendChild(closeResults.cloneNode(true));
                    // Re-attach event listener to the cloned button
                    resultsContainer.querySelector('#closeResults').addEventListener('click', function() {
                        resultsContainer.style.display = 'none';
                    });
                }
                resultsContainer.appendChild(errorContent);
                
                resultsContainer.style.display = 'block';
            } finally {
                // Hide loading indicator and re-enable submit button
                loading.style.display = 'none';
                submitButton.disabled = false;
            }
        });
    }
});

// Keep the AuthHandler class outside the DOMContentLoaded event
// Keep the AuthHandler class outside the DOMContentLoaded event
class AuthHandler {
    constructor() {
      this.authenticated = false;
      this.authPromptShown = false;
      this.loginPromptElement = null;
      this.loadAuthStatus();
    }
  
    // Load authentication status from server
    async loadAuthStatus() {
      try {
        const response = await fetch('/auth-status');
        const data = await response.json();
        this.authenticated = data.authenticated;
        console.log('Auth status loaded:', this.authenticated);
        
        // Update header buttons after loading auth status
        this.updateHeaderButtons();
      } catch (error) {
        console.error('Failed to load auth status:', error);
        this.authenticated = false;
      }
    }
  
    // Check if user is authenticated
    isAuthenticated() {
      return this.authenticated;
    }
    
    // Update the header buttons based on authentication status
    updateHeaderButtons() {
      const heroContent = document.querySelector('.hero-content');
      if (!heroContent) return;
      
      if (this.authenticated) {
        // User is logged in, replace login/register with "Get Started"
        const existingButtons = heroContent.querySelectorAll('form');
        
        // Remove existing login/register buttons
        existingButtons.forEach(form => form.remove());
        
        // Create "Get Started" button if it doesn't already exist
        if (!heroContent.querySelector('.get-started-button')) {
          const getStartedButton = document.createElement('button');
          getStartedButton.className = 'cta-button get-started-button';
          getStartedButton.textContent = 'Get Started';
          getStartedButton.addEventListener('click', () => {
            // Scroll to features section
            const featuresSection = document.querySelector('.features-section');
            if (featuresSection) {
              featuresSection.scrollIntoView({ behavior: 'smooth' });
            }
          });
          
          heroContent.appendChild(getStartedButton);
        }
      } else {
        // User is not logged in, ensure login/register buttons are visible
        const existingGetStarted = heroContent.querySelector('.get-started-button');
        if (existingGetStarted) {
          existingGetStarted.remove();
        }
        
        // Check if the login/register buttons already exist
        const existingButtons = heroContent.querySelectorAll('form');
        if (existingButtons.length === 0) {
          // Create login button form
          const loginForm = document.createElement('form');
          loginForm.action = '/login';
          loginForm.method = 'GET';
          loginForm.style.display = 'inline';
          
          const loginButton = document.createElement('button');
          loginButton.type = 'submit';
          loginButton.className = 'cta-button';
          loginButton.textContent = 'Login';
          
          loginForm.appendChild(loginButton);
          
          // Create register button form
          const registerForm = document.createElement('form');
          registerForm.action = '/register';
          registerForm.method = 'GET';
          registerForm.style.display = 'inline';
          
          const registerButton = document.createElement('button');
          registerButton.type = 'submit';
          registerButton.className = 'cta-button';
          registerButton.textContent = 'Register';
          
          registerForm.appendChild(registerButton);
          
          // Add both forms to the hero content
          heroContent.appendChild(loginForm);
          heroContent.appendChild(registerForm);
        }
      }
    }

    // Handle protected API calls
    async fetchProtectedApi(url, options = {}) {
      try {
        const response = await fetch(url, options);
        
        // If unauthorized, show login prompt
        if (response.status === 401) {
          this.showLoginPrompt();
          return { error: 'Authentication required' };
        }
        
        return await response.json();
      } catch (error) {
        console.error('API call failed:', error);
        return { error: 'Request failed' };
      }
    }
  
    // Show login prompt
    showLoginPrompt() {
      if (this.authPromptShown) return;
      
      // Create login prompt container if it doesn't exist
      if (!this.loginPromptElement) {
        this.loginPromptElement = document.createElement('div');
        this.loginPromptElement.id = 'login-prompt-container';
        document.body.appendChild(this.loginPromptElement);
      }
      
      // Render login prompt
      this.loginPromptElement.innerHTML = `
        <div class="auth-modal-overlay">
          <div class="auth-modal">
            <div class="auth-modal-header">
              <h3>Authentication Required</h3>
              <button class="close-button">&times;</button>
            </div>
            <div class="auth-modal-body">
              <p>Please log in or register to access this feature.</p>
            </div>
            <div class="auth-modal-footer">
              <button class="login-button">Login</button>
              <button class="register-button">Register</button>
            </div>
          </div>
        </div>
      `;
      
      // Add event listeners
      const closeButton = this.loginPromptElement.querySelector('.close-button');
      const loginButton = this.loginPromptElement.querySelector('.login-button');
      const registerButton = this.loginPromptElement.querySelector('.register-button');
      
      closeButton.addEventListener('click', () => this.hideLoginPrompt());
      loginButton.addEventListener('click', () => this.redirectToLogin());
      registerButton.addEventListener('click', () => this.redirectToRegister());
      
      // Show the prompt
      this.authPromptShown = true;
      
      // Add styles
      this.addPromptStyles();
    }
  
    // Hide login prompt
    hideLoginPrompt() {
      if (this.loginPromptElement) {
        this.loginPromptElement.innerHTML = '';
        this.authPromptShown = false;
      }
    }
  
    // Redirect to login page
    redirectToLogin() {
      window.location.href = '/login';
    }
  
    // Redirect to register page
    redirectToRegister() {
      window.location.href = '/register';
    }
  
    // Add CSS styles for the prompt
    addPromptStyles() {
      const styleElement = document.createElement('style');
      styleElement.textContent = `
        .auth-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }
        
        .auth-modal {
          background-color: white;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
          width: 100%;
          max-width: 400px;
          overflow: hidden;
        }
        
        .auth-modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px;
          border-bottom: 1px solid #eee;
        }
        
        .auth-modal-header h3 {
          margin: 0;
          font-size: 18px;
        }
        
        .close-button {
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: #999;
        }
        
        .auth-modal-body {
          padding: 16px;
        }
        
        .auth-modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          padding: 16px;
          border-top: 1px solid #eee;
        }
        
        .login-button, .register-button {
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
        }
        
        .login-button {
          background-color: #4285f4;
          color: white;
          border: none;
        }
        
        .register-button {
          background-color: #f1f3f4;
          color: #333;
          border: 1px solid #ddd;
        }
      `;
      document.head.appendChild(styleElement);
    }
}
  
// Create and export auth handler instance
const authHandler = new AuthHandler();

// Make authHandler available to the window object since ES6 module export might not work in all contexts
window.authHandler = authHandler;
