// This is your new "waiter" (server.js)

// Load secret key and other packages
require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 8000;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// --- Middleware ---
// Allow your React app to talk to this server
// --- Middleware ---

// Allow your specific app (with one 'l') to talk to this server
app.use(cors({
  origin: 'https.douda-beauty-and-willness.web.app'
}));

// Allow the server to read JSON
app.use(express.json()); 

// --- The "Chat" Route ---

// --- The "Chat" Route ---
// Your React app will send all chat messages here
app.post('/chat', async (req, res) => {
  // Get the user's question from the React app
  const { userQuery } = req.body;

  if (!userQuery) {
    return res.status(400).json({ error: 'userQuery is required' });
  }

  if (!GEMINI_API_KEY) {
    return res.status(500).json({ error: 'API key is not configured on the server.' });
  }

  // This is the prompt we send to Google.
  // The system prompt is now hidden here, safe from the user.
  const systemPrompt = `
    You are Bella, the AI assistant for 'Douda Beauty and Wellness'.
    Your Goal: Be a helpful, friendly, and professional assistant.
    Tone: Friendly, stylish, professional, and welcoming.
    Context & Rules:
    1. You have access to the *complete* salon menu.
    2. When asked about services or prices, answer by *directly referencing* the menu I provide below.
    3. If a user asks "how much is...", find the service and state its price.
    4. If a user asks "do you offer...", check the menu.

    --- MASTER SERVICE MENU ---
    **Nails**
    - Manicure + Pose: $7 (45 min)
    - Spa Manicure + Pose: $10 (60 min)
    - ... (and so on for all 73 services) ...
    **Skin**
    - Basic Facial: $25 (45 min)
    - ...etc...
    --- END OF MENU ---
  `;
  
  // This is the URL to the Google AI API
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`;

  // This is the data we send to Google
  const requestBody = {
    contents: [{ role: 'user', parts: [{ text: userQuery }] }],
    systemInstruction: { parts: [{ text: systemPrompt }] }
  };

  try {
    // Make the call to Google
    const response = await axios.post(url, requestBody, {
      headers: { 'Content-Type': 'application/json' }
    });

    // Send the AI's answer back to the React app
    const aiText = response.data.candidates[0].content.parts[0].text;
    res.json({ text: aiText });

  } catch (error) {
    console.error('Error calling Gemini API:', error.response ? error.response.data : error.message);
    res.status(500).json({ error: "I'm having trouble connecting to my brain. Please try again later." });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Douda AI server (the "waiter") is listening on port ${PORT}`);
});