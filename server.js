require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ─────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ── Gemini setup ───────────────────────────────────────────────────────
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

// ── Health check ───────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({ status: 'LearnMate AI Server is running 🚀' });
});

// ── ROUTE 1: General Chat Q&A ──────────────────────────────────────────
app.post('/chat', async (req, res) => {
  try {
    const { message, history } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const systemPrompt = `You are LearnMate AI, a helpful study assistant for students. 
    You help with:
    - Explaining concepts clearly and simply
    - Answering academic questions
    - Providing study tips and guidance
    - Helping understand difficult topics
    
    Keep responses concise, friendly and student-focused.
    Use simple language and examples where helpful.`;

    // Build conversation history for context
    const chatHistory = history || [];
    const chat = model.startChat({
      history: chatHistory,
      generationConfig: {
        maxOutputTokens: 1000,
        temperature: 0.7,
      },
    });

    const fullMessage = chatHistory.length === 0
      ? `${systemPrompt}\n\nStudent question: ${message}`
      : message;

    const result = await chat.sendMessage(fullMessage);
    const response = result.response.text();

    res.json({ reply: response });

  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: 'Failed to get AI response' });
  }
});

// ── ROUTE 2: Text Summarization ────────────────────────────────────────
app.post('/summarize', async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    const prompt = `You are a study assistant. Summarize the following text clearly and concisely for a student.
    
    Use this format:
    📌 Main Topic: [one line]
    
    🔑 Key Points:
    • [point 1]
    • [point 2]
    • [point 3]
    (add more if needed)
    
    💡 Quick Summary: [2-3 sentences]
    
    Text to summarize:
    ${text}`;

    const result = await model.generateContent(prompt);
    const summary = result.response.text();

    res.json({ summary });

  } catch (error) {
    console.error('Summarize error:', error);
    res.status(500).json({ error: 'Failed to summarize text' });
  }
});

// ── ROUTE 3: Quiz Generation ───────────────────────────────────────────
app.post('/quiz', async (req, res) => {
  try {
    const { topic, numQuestions = 5 } = req.body;

    if (!topic) {
      return res.status(400).json({ error: 'Topic is required' });
    }

    const prompt = `Generate ${numQuestions} multiple choice questions about "${topic}" for a student.
    
    Return ONLY a valid JSON array in this exact format, no other text:
    [
      {
        "question": "Question text here?",
        "options": ["Option A", "Option B", "Option C", "Option D"],
        "correctIndex": 0,
        "explanation": "Brief explanation why this is correct"
      }
    ]
    
    Make questions educational, clear and appropriately challenging.`;

    const result = await model.generateContent(prompt);
    let responseText = result.response.text();

    // Clean up response to extract JSON
    responseText = responseText
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim();

    const questions = JSON.parse(responseText);
    res.json({ questions });

  } catch (error) {
    console.error('Quiz error:', error);
    res.status(500).json({ error: 'Failed to generate quiz' });
  }
});

// ── ROUTE 4: Study Plan ────────────────────────────────────────────────
app.post('/studyplan', async (req, res) => {
  try {
    const { subject, duration, goal } = req.body;

    if (!subject) {
      return res.status(400).json({ error: 'Subject is required' });
    }

    const prompt = `Create a practical study plan for a student.
    
    Subject: ${subject}
    Available time: ${duration || '1 week'}
    Goal: ${goal || 'understand the basics'}
    
    Format your response like this:
    
    📚 Study Plan: ${subject}
    
    🎯 Goal: [restate the goal clearly]
    
    📅 Daily Schedule:
    Day 1: [topic + activity]
    Day 2: [topic + activity]
    (continue for the duration)
    
    💡 Study Tips:
    • [tip 1]
    • [tip 2]
    • [tip 3]
    
    ⚡ Quick Resources:
    • [resource suggestion 1]
    • [resource suggestion 2]
    
    Keep it practical and motivating for a student.`;

    const result = await model.generateContent(prompt);
    const plan = result.response.text();

    res.json({ plan });

  } catch (error) {
    console.error('Study plan error:', error);
    res.status(500).json({ error: 'Failed to generate study plan' });
  }
});

// ── Start server ───────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`LearnMate AI Server running on port ${PORT}`);
});