// This is the complete "waiter" (server.js)
// It includes a new '/list-models' route for diagnostics.

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

// --- NEW DIAGNOSTIC ROUTE ---
// Let's ask Google what models we can *actually* use.
app.get('/list-models', async (req, res) => {
  if (!GEMINI_API_KEY) {
    return res.status(500).json({ error: 'API key is not configured on the server.' });
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${GEMINI_API_KEY}`;

  try {
    const response = await axios.get(url, {
      headers: { 'Content-Type': 'application/json' }
    });
    // Send the list of models back as a pretty JSON
    res.json(response.data); 
  } catch (error) {
    console.error('Error listing models:', error.response ? error.response.data.error : error.message);
    res.status(500).json({ error: "Could not fetch model list.", details: error.response ? error.response.data.error : error.message });
  }
});

// --- The "Chat" Route ---
app.post('/chat', async (req, res) => {
  const { userQuery } = req.body;

  if (!userQuery) {
    return res.status(400).json({ error: 'userQuery is required' });
  }
  if (!GEMINI_API_KEY) {
    return res.status(500).json({ error: 'API key is not configured on the server.' });
  }

  // I'm putting back the last model name we tried.
  // The error isn't the name, it's the project. But this is what we'll use *after* we figure this out.
  const modelToTry = 'gemini-1.5-pro'; 
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelToTry}:generateContent?key=${GEMINI_API_KEY}`;
  
  // This is the prompt we send to Google.
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
    (Full 73-item menu)
    --- END OF MENU ---
  `;

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
    console.error('Error calling Gemini API:', error.response ? error.response.data.error : error.message);
    res.status(500).json({ error: "I'm having trouble connecting to my brain. Please try again later." });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Douda AI server (the "waiter") is listening on port ${PORT}`);
});