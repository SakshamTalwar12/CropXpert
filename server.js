import express from "express";
import bodyParser from "body-parser";
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { GoogleGenerativeAI } from "@google/generative-ai";
import session from "express-session";
import multer from "multer";
import path from "path";
import fs from "fs";
import pg from "pg";
import "dotenv/config";

const app = express();
const port = 3000;

const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "cropxpert",
  password: process.env.PGPASSWORD,
  port: 5432,
});
db.connect();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(dirname(fileURLToPath(import.meta.url)), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Function to convert file to Generative AI part
function fileToGenerativePart(filePath, mimeType) {
  const fileData = fs.readFileSync(filePath);
  return {
    inlineData: {
      data: Buffer.from(fileData).toString('base64'),
      mimeType: mimeType
    }
  };
}

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Routes for login and register
app.get('/login', (req, res) => {
    res.sendFile(join(__dirname, 'public', 'login.html'));
});

app.get('/register', (req, res) => {
    res.sendFile(join(__dirname, 'public', 'register.html'));
});

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

app.use(express.static("public"));
app.use(session({
  secret: process.env.SESSION_SECRET,  // Replace with a strong secret key
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: process.env.NODE_ENV === 'production', // Set to true in production
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

app.get("/", (req, res) => {
  res.sendFile(join(__dirname, 'public', 'index.html'));
});

const isAuthenticated = (req, res, next) => {
  if (req.session && req.session.userId) {
    return next();
  }
  return res.status(401).json({ 
    success: false, 
    error: "Authentication required", 
    message: "Please login/register to use this feature" 
  });
};

app.post("/register", async (req, res) => {
  const email = req.body.username;
  const password = req.body.password;
  
  try {
    const checkResult = await db.query("SELECT * FROM users WHERE email = $1", [email]);
    
    if (checkResult.rows.length > 0) {
      res.status(400).json({ success: false, message: "Email already exists. Try logging in." });
    } else {
      const result = await db.query(
        "INSERT INTO users (email, password) VALUES ($1, $2) RETURNING id",
        [email, password]
      );
      
      // Set user session
      req.session.userId = result.rows[0].id;
      req.session.email = email;
      
      // Perform direct redirect instead of returning JSON
      res.redirect('/');
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Update your login route to set the session
app.post("/login", async (req, res) => {
  const email = req.body.username;
  const password = req.body.password;
  
  try {
    const result = await db.query("SELECT * FROM users WHERE email = $1", [email]);
    
    if (result.rows.length > 0) {
      const user = result.rows[0];
      const storedPassword = user.password;
      
      if (password === storedPassword) {
        // Set user session
        req.session.userId = user.id;
        req.session.email = user.email;
        
        // Perform direct redirect instead of returning JSON
        res.redirect('/');
      } else {
        res.status(400).json({ success: false, message: "Incorrect Password" });
      }
    } else {
      res.status(404).json({ success: false, message: "User not found" });
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Add logout route
app.get("/logout", (req, res) => {
  req.session.destroy(err => {
    if (err) {
      return res.status(500).json({ success: false, message: "Logout failed" });
    }
    res.status(200).json({ success: true, message: "Logout successful" });
  });
});

// Check authentication status route
app.get("/auth-status", (req, res) => {
  if (req.session && req.session.userId) {
    res.json({ authenticated: true, email: req.session.email });
  } else {
    res.json({ authenticated: false });
  }
});

// Protect generate-response route
// Route handler for generating AI responses with authentication
// Route handler for generating AI responses with authentication
app.post("/generate-response", isAuthenticated, async (req, res) => {
  
  try {
    const userInput = req.body.prompt;
    
    // Validate input
    if (!userInput || typeof userInput !== 'string') {
      return res.status(400).json({ 
        error: "Invalid input",
        message: "Please provide a valid prompt" 
      });
    }
    
    // Generate AI response
    const result = await model.generateContent(userInput);
    const aiResponse = result.response.text();
    
    // Return successful response
    res.json({ response: aiResponse });
    
  } catch (error) {
    console.error("Error generating AI response:", error);
    res.status(500).json({ 
      error: "Server error", 
      message: "Failed to generate response. Please try again later." 
    });
  }
});// Protect analyze-soil route
// Route handler for soil analysis with image upload and authentication
// Route handler for soil analysis with image upload and authentication
app.post("/analyze-soil", isAuthenticated, (req, res) => {
  // Use multer middleware for file upload
  upload.single("image")(req, res, async (err) => {
    // Handle file upload errors
    if (err) {
      return res.status(400).json({
        success: false,
        error: "File upload failed",
        message: err.message
      });
    }
    
    try {
      // Check if a file was uploaded
      if (!req.file) {
        return res.status(400).json({ 
          success: false,
          error: "No image uploaded",
          message: "Please upload an image for analysis" 
        });
      }
      
      const imagePath = req.file.path;
      const mimeType = req.file.mimetype;
      
      // Validate image mime type
      const validImageTypes = ['image/jpeg', 'image/png', 'image/jpg'];
      if (!validImageTypes.includes(mimeType)) {
        // Delete invalid file
        fs.unlinkSync(imagePath);
        return res.status(400).json({
          success: false,
          error: "Invalid file type",
          message: "Please upload a valid image file (JPEG, PNG)"
        });
      }
      
      // Convert file to generative part
      const imagePart = fileToGenerativePart(imagePath, mimeType);
      
      // Create the prompt for AI analysis
      const prompt = `Analyze this image and provide detailed insights based on its content:
        - If the image is of soil:
          1. Provide a rough soil quality assessment based on visible indicators.
          2. Suggest simple and low-cost techniques to check soil quality at home.
          3. Offer advice on improving soil health and boosting crop yield.
          
        - If the image shows an infected crop:
          1. Identify any visible pests or signs of infestation.
          2. Suggest effective control methods for managing the issue.
          3. Provide guidance on early detection, preventive measures, and ongoing monitoring to reduce future risks.`;
      
      // Send image & prompt to the AI
      const result = await model.generateContent([prompt, imagePart]);
      const response = await result.response;
      const text = response.text();
      
      // Delete the uploaded file after processing
      fs.unlinkSync(imagePath);
      
      // Return successful response
      res.json({ 
        success: true, 
        analysis: text 
      });
      
    } catch (error) {
      console.error("Error processing image:", error);
      
      // Attempt to delete the uploaded file if it exists
      if (req.file && req.file.path) {
        try {
          fs.unlinkSync(req.file.path);
        } catch (unlinkError) {
          console.error("Error deleting file:", unlinkError);
        }
      }
      
      res.status(500).json({
        success: false,
        error: "Failed to analyze image",
        message: "Something went wrong during analysis. Please try again later.",
        details: error.message
      });
    }
  });
});
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});