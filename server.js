// This is the complete, correct "waiter" (server.js)

// Load secret key and other packages
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
    **Nails**
    - Manicure + Pose: $7 (45 min)
    - Spa Manicure + Pose: $10 (60 min)
    - Pose Only (Hands): $5 (15 min)
    - Manicure Only: $6 (30 min)
    - Pedicure + Pose: $8 (45 min)
    - Spa Pedicure + Pose: $15 (60 min)
    - Pose Only (Feet): $5 (15 min)
    - Pedicure Only: $7 (30 min)
    - Add French/Ombre: $1 (10 min)
    - Manicure & Pedicure & Parafine: $30 (90 min)
    - Gel Polish with Protection: $17 (45 min)
    - Gel Polish Pedicure: $15 (45 min)
    - Full Set Gel + Gel Polish: $40 (75 min)
    - Gel-X + Gel Polish: $27 (60 min)
    - Refill Gel + Gel Polish: $22 (60 min)
    - Designs & Accessories: starting $3 (15 min)
    - French/Ombre/Mirror: starting $3 (15 min)
    - Broken Nail Fix: $1 (10 min)
    
    **Skin**
    - Basic Facial: $25 (45 min)
    - Facial + Nettoyage: $30 (60 min)
    - Facial + Nettoyage + Detox: $35 (75 min)
    - Oxygen Facial (w/ LED Mask): $40 (75 min)
    - Dermapen Meso Therapy: $40 (60 min)
    - Plasma Pen - Full Eyes: $20 (30 min)
    - Plasma Pen - Eye Crease: $10 (20 min)
    - Plasma Pen - Under Eyes: $10 (20 min)
    - Plasma Pen - Forehead: $15 (25 min)
    - Plasma Pen - Chin & Lips: $15 (25 min)
    - Plasma Pen - Cheeks: $20 (30 min)
    - Plasma Pen - Full Face: $50 (75 min)
    
    **Massage**
    - Full Body Massage: 50 min - $50
    - Full Body Duo: 50 min - $90
    - Back and Neck: 30 min - $30
    - Back and Neck Duo: 30 min - $55
    - Back and Feet: 40 min - $40
    - Back and Feet Duo: 40 min - $75
    - Candle Full Body Massage: 50 min - $60
    - Chocolate Full Body Massage: 50 min - $60
    - Cellulite Massage: 40 min - $40
    
    **Makeup**
    - Makeup without Lashes: $40 (45 min)
    - Makeup with Lashes: $45 (60 min)
    - Eye Makeup w/ Lashes: $30 (30 min)
    - Lashes: $10 (15 min)
    - Lashes with Eyeliner: $20 (20 min)
    - Semi-Permanent Lashes: $12 (25 min)
    - Bridal Offer: Ask for info (N/A)
    
    **Laser**
    - Full Legs: $18/20 (40 min)
    - Half Legs: $10/12 (20 min)
    - Full Hands: $12/14 (30 min)
    - Half Hands: $9 (15 min)
    - Under Arms: $10 (10 min)
    - Bikini Line: $15 (15 min)
    - Full Bikini: $20 (25 min)
    - Belly: $15/18 (15 min)
    - Full Back: $25 (30 min)
    - Half Back: $15 (15 min)
    - Full Face: $15 (20 min)
    - Moustache: $5 (5 min)
    - Neck: $10 (10 min)
    - Full Body: $70 (120 min)
    
    **Waxing**
    - Full Legs: $10 (30 min)
    - Half Legs: $7 (15 min)
    - Full Hands: $8 (20 min)
    - Half Hands: $5 (10 min)
    - Under Arms: $4 (10 min)
    - Bikini Line: $4 (10 min)
    - Full Bikini: $10 (20 min)
    - Full Belly: $5 (15 min)
    - Full Back: $8 (25 min)
    - Half Back: $5 (15 min)
    - Full Body: $20 (60 min)
    - Eyebrow Removal: $2 (10 min)
    - Moustache Removal: $1 (5 min)
    
    **Tattoo**
    - Eyebrows Tattoo: $100 (90 min)
    - Hair by Hair Eyebrows: $120 (120 min)
    - Lips Contour Tattoo: $100 (90 min)
    - Full Lips Tattoo: $120 (120 min)
    --- END OF MENU ---
  `;
  
  // THIS IS THE LINE THAT WAS FIXED.
  // It now points to just 'gemini-pro'.
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`;

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