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
  password: process.env.DB_PASSWORD,
  port: 5432,
});
db.connect();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true })); // Add this line for form data parsing
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


app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

app.get("/", (req, res) => {
  res.sendFile(join(__dirname, 'public', 'index.html'));
});


app.post("/register", async (req, res) => {
  const email = req.body.username;
  const password = req.body.password;

  try {
    const checkResult = await db.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);

    if (checkResult.rows.length > 0) {
      res.send("Email already exists. Try logging in.");
    } else {
      const result = await db.query(
        "INSERT INTO users (email, password) VALUES ($1, $2)",
        [email, password]
      );
      console.log(result);
      res.sendFile(join(__dirname, 'public', 'index.html'));
    }
  } catch (err) {
    console.log(err);
  }
});

app.post("/login", async (req, res) => {
  const email = req.body.username;
  const password = req.body.password;

  try {
    const result = await db.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);
    if (result.rows.length > 0) {
      const user = result.rows[0];
      const storedPassword = user.password;

      if (password === storedPassword) {
        res.sendFile(join(__dirname, 'public', 'index.html'));
      } else {
        res.send("Incorrect Password");
      }
    } else {
      res.send("User not found");
    }
  } catch (err) {
    console.log(err);
  }
});


app.post("/generate-response", async (req, res) => {
    try {
        const userInput = req.body.prompt;
        const result = await model.generateContent(userInput);
        const aiResponse = result.response.text();

        res.json({ response: aiResponse });
    } catch (error) {
        console.error("Error generating AI response:", error);
        res.status(500).json({ response: "Failed to generate response. Try again later." });
    }
});

// Create uploads directory if it doesn't exist
if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads");
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage });

// Convert image file to base64 for API
function fileToGenerativePart(path, mimeType) {
  const imageBuffer = fs.readFileSync(path);
  return {
    inlineData: {
      data: imageBuffer.toString("base64"),
      mimeType,
    },
  };
}

// ✅ **FIXED: Use `gemini-1.5-pro` instead of deprecated `gemini-pro-vision`**
app.post("/analyze-soil", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No image uploaded" });
    }

    const imagePath = req.file.path;
    const mimeType = req.file.mimetype;
    const imagePart = fileToGenerativePart(imagePath, mimeType);

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

    res.json({ success: true, analysis: text });

  } catch (error) {
    console.error("Error processing image:", error);
    res.status(500).json({
      success: false,
      error: "Failed to analyze image",
      details: error.message,
    });
  }
});



app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});