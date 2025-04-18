# 🌾 CropXpert

**CropXpert** is a smart AI-powered platform designed to support farmers with vital agricultural information and assistance. 
Users can upload images, input personal and farming details, and receive instant, intelligent feedback powered by the Gemini AI API.

---

## 🚀 Key Features

- 📸 **Soil & Pest Analysis via Image Upload**  
  Upload an image of your soil or pest-affected plant to get AI-generated insights and recommendations for improvement or treatment.

- 🏛️ **Government Scheme Recommender**  
  Based on your age, location, and crops grown, the app provides personalized government scheme suggestions.

- 🌱 **Best Farming Practices**  
  Get AI-curated tips for sustainable farming, low-cost soil testing methods, and organic pest control.

- 🤖 **All AI-Powered with Gemini API**  
  Every suggestion is generated using intelligent prompts through Google's Gemini API on the free tier.

---

## 🛠️ Tech Stack

- **Frontend**: HTML, CSS, JavaScript  
- **Backend**: Node.js, Express
- **DataBase**: PostgreSQL
- **AI Integration**: Gemini AI API  
- **Hosting**: Fully hosted on Railway  
- **Version Control**: Git & GitHub  
- **Collaboration**: GitHub for team contributions and workflow management

---

## 📂 Running the Project Locally

1. **Clone the repo**  
   ```bash
   git clone https://github.com/LordShen2109/farmingassistant.git
   cd farmingassistant
2. **Install all dependencies**
   ```bash
   npm i
3. **Create a .env file inside root directory**
4. **Generate your own api key at https://aistudio.google.com/app/apikey and save in .env file**
5. **Start the server**
   ```bash
   node server.js
