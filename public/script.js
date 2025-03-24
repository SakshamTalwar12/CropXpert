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

// Show home tab by default when page loads
window.onload = function () {
    document.getElementById("home").style.display = "block";
};

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

// Practices Modal
document.getElementById("openPracticesModalBtn").addEventListener("click", function () {
    document.getElementById("practicesModal").style.display = "block";
    // Reset the form and response when opening modal
    document.getElementById("responsePractices").style.display = "none";
    document.getElementById("responsePractices").innerText = "";
    
    // Make sure form is visible
    const formElements = document.getElementById("practicesModal").querySelectorAll(".form-group, #submitPracticesDetails");
    formElements.forEach(el => el.style.display = "block");
});

document.getElementById("closePracticesModal").addEventListener("click", function () {
    document.getElementById("practicesModal").style.display = "none";
});

// Schemes Modal
document.getElementById("openSchemesModalBtn").addEventListener("click", function () {
    document.getElementById("schemesModal").style.display = "block";
    // Reset the form and response when opening modal
    document.getElementById("responseSchemes").style.display = "none";
    document.getElementById("responseSchemes").innerText = "";
    
    // Make sure form is visible
    document.getElementById("schemesForm").style.display = "block";
});

document.getElementById("closeSchemesModal").addEventListener("click", function () {
    document.getElementById("schemesModal").style.display = "none";
});

// Close modals when clicking outside
window.addEventListener("click", function (event) {
    if (event.target.id === "practicesModal") {
        document.getElementById("practicesModal").style.display = "none";
    } else if (event.target.id === "schemesModal") {
        document.getElementById("schemesModal").style.display = "none";
    }
});

// Submit Practices Form & Fetch AI Response
document.getElementById("submitPracticesDetails").addEventListener("click", async function () {
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
        document.getElementById("responsePractices").innerText = "Generating response...";
        document.getElementById("responsePractices").style.display = "block";
        
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
            document.getElementById("responsePractices").innerText = data.response;
        } else {
            document.getElementById("responsePractices").innerText = "No response received.";
        }
    } catch (error) {
        console.error("Error fetching AI response:", error);
        document.getElementById("responsePractices").innerText = "Error fetching data.";
    }
});

// Submit Schemes Form & Fetch AI Response
document.getElementById("submitSchemesDetails").addEventListener("click", async function () {
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
        document.getElementById("responseSchemes").innerText = "Generating response...";
        document.getElementById("responseSchemes").style.display = "block";
        
        // Hide the form completely
        document.getElementById("schemesForm").style.display = "none";

        const response = await fetch("/generate-response", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ prompt: userPrompt }),
        });

        const data = await response.json();

        if (data.response) {
            document.getElementById("responseSchemes").innerText = data.response;
            document.getElementById("responseSchemes").style.display = "block";
        } else {
            document.getElementById("responseSchemes").innerText = "No response received.";
        }
    } catch (error) {
        console.error("Error fetching AI response:", error);
        document.getElementById("responseSchemes").innerText = "Error fetching data.";
    }
});

// Image Upload Preview (for Soil Quality Check)
document.getElementById("imageUpload").addEventListener("change", function(event) {
    const preview = document.getElementById("preview");
    const file = event.target.files[0];
    
    if (file && file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = function(e) {
            preview.src = e.target.result;
            preview.style.display = "block";
            document.querySelector(".upload-placeholder").style.display = "none";
        };
        reader.readAsDataURL(file);
    }
});

// Submit Image Analysis
document.querySelector(".img-submit").addEventListener("click", async function() {
    const preview = document.getElementById("preview");
    
    if (!preview.src || preview.src === "") {
        alert("Please upload an image first.");
        return;
    }
    
    // Here you would send the image to your server for Gemini analysis
    // This is a placeholder for that functionality
    alert("Image analysis functionality to be implemented");
});


//  const imageUpload = document.getElementById('imageUpload');
const preview = document.getElementById('preview');
const uploadPlaceholder = document.getElementById('uploadPlaceholder');
const submitButton = document.getElementById('submitButton');
const loading = document.getElementById('loading');
const resultsContainer = document.getElementById('resultsContainer');
const closeResults = document.getElementById('closeResults');

// Handle image upload
imageUpload.addEventListener('change', function() {
    if (this.files && this.files[0]) {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            preview.src = e.target.result;
            preview.style.display = 'block';
            uploadPlaceholder.style.display = 'none';
            submitButton.disabled = false;
            
            // Hide results if previously shown
            resultsContainer.style.display = 'none';
        };
        
        reader.readAsDataURL(this.files[0]);
    }
});

// Handle close button click for results
closeResults.addEventListener('click', function() {
    resultsContainer.style.display = 'none';
});

// Handle submit button click
submitButton.addEventListener('click', async function() {
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
            resultsContainer.appendChild(closeResults);
            resultsContainer.appendChild(resultContent);
            
            // Show the results container
            resultsContainer.style.display = 'block';
        } else {
            const errorContent = document.createElement('div');
            errorContent.innerHTML = `<h3>Error</h3><p>${data.error}</p>`;
            
            resultsContainer.innerHTML = '';
            resultsContainer.appendChild(closeResults);
            resultsContainer.appendChild(errorContent);
            
            resultsContainer.style.display = 'block';
        }
    } catch (error) {
        console.error('Error:', error);
        
        const errorContent = document.createElement('div');
        errorContent.innerHTML = `<h3>Error</h3><p>Error analyzing image: ${error.message}</p>`;
        
        resultsContainer.innerHTML = '';
        resultsContainer.appendChild(closeResults);
        resultsContainer.appendChild(errorContent);
        
        resultsContainer.style.display = 'block';
    } finally {
        // Hide loading indicator and re-enable submit button
        loading.style.display = 'none';
        submitButton.disabled = false;
    }
});