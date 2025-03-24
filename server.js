import express from "express";
import bodyParser from "body-parser";
import { GoogleGenerativeAI } from "@google/generative-ai";
import multer from "multer";
import path from "path";
import fs from "fs";
import "dotenv/config";

const app = express();
const port = 3000;

app.use(bodyParser.json());
app.use(express.static("public"));

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

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