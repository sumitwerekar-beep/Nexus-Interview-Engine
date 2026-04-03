const express = require('express');
const cors = require('cors');
const Groq = require('groq-sdk');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Route to get a question
app.post('/api/generate-question', async (req, res) => {
  const { role, history } = req.body;
  try {
    const completion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: `You are an interviewer for ${role}. Ask one short question. Return ONLY the question text.` },
        ...history.map(m => ({ role: m.type === 'ai' ? 'assistant' : 'user', content: m.text })),
        { role: "user", content: "Ask the next question." }
      ],
      model: "llama-3.3-70b-versatile",
    });
    res.json({ question: completion.choices[0].message.content });
  } catch (error) {
    res.status(500).json({ error: "Groq Error" });
  }
});

// Route to evaluate the answer
app.post('/api/evaluate-answer', async (req, res) => {
  const { question, answer } = req.body;
  try {
    const completion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: "Return ONLY JSON: {score: 1-10, strengths: '', weaknesses: '', improvedAnswer: ''}" },
        { role: "user", content: `Question: ${question}\nAnswer: ${answer}` }
      ],
      model: "llama-3.3-70b-versatile",
      response_format: { type: "json_object" }
    });
    res.json(JSON.parse(completion.choices[0].message.content));
  } catch (error) {
    res.status(500).json({ error: "Evaluation failed" });
  }
});

app.listen(5000, () => console.log('🚀 Backend is live on http://localhost:5000'));
