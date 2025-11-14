// --- FINAL DIAGNOSTIC SERVER.JS ---
// This version removes the large menu data to test if the prompt size is the issue.

require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 8000;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// --- Middleware ---
app.use(cors({
  origin: 'https://douda-beauty-and-willness.web.app' // Correct spelling (1 'l')
}));
app.use(express.json()); 

// --- The "Chat" Route ---
app.post('/chat', async (req, res) => {
  const { userQuery } = req.body;

  if (!userQuery) {
    return res.status(400).json({ error: 'userQuery is required' });
  }

  if (!GEMINI_API_KEY) {
    return res.status(500).json({ error: 'API key is not configured on the server.' });
  }

  // SIMPLIFIED SYSTEM PROMPT (TEST ONLY)
  const systemPrompt = `
    You are Bella, the AI assistant for Douda Beauty. 
    Your goal is to be friendly and respond to general beauty questions. 
    DO NOT mention the salon menu, as you do not have it right now.
  `;

  // We'll stick with the correct model name
  const modelToTry = 'gemini-2.5-flash'; 
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelToTry}:generateContent?key=${GEMINI_API_KEY}`;

  const requestBody = {
    contents: [{ role: 'user', parts: [{ text: userQuery }] }],
    systemInstruction: { parts: [{ text: systemPrompt }] }
  };

  try {
    const response = await axios.post(url, requestBody, {
      headers: { 'Content-Type': 'application/json' }
    });

    const aiText = response.data.candidates[0].content.parts[0].text;
    res.json({ text: aiText });

  } catch (error) {
    // If the server crashes here, the problem is 100% the Google Cloud project.
    console.error('Error calling Gemini API:', error.response ? error.response.data.error : error.message);
    res.status(500).json({ error: "I'm having trouble connecting to my brain. Please try again later." });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Douda AI server (the "waiter") is listening on port ${PORT}`);
});