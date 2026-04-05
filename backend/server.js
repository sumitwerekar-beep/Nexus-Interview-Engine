require('dotenv').config();

const express = require('express');
const cors = require('cors');
const Groq = require('groq-sdk');
const multer = require('multer');
const pdf = require('pdf-parse');

const app = express();
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors());
app.use(express.json());


app.post('/api/generate-question', async (req, res) => {
    const { role, history, resumeContext } = req.body;
    console.log("Generating question, resume context length:", resumeContext ? resumeContext.length : "UNDEFINED/EMPTY");
    try {
        const completion = await groq.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: `You are a professional technical interviewer for: ${role}. 
                    RESUME CONTEXT: ${resumeContext || "No resume provided."}
                    INSTRUCTIONS:
                    1. If a resume is provided, ask a specific question about their experience/projects.
                    2. If no resume is provided, ask a standard role-based question.
                    3. Be concise and professional.`
                },
                ...history.map(m => ({ role: m.type === 'ai' ? 'assistant' : 'user', content: m.text }))
            ],
            model: "llama-3.3-70b-versatile",
        });
        res.json({ question: completion.choices[0].message.content });
    } catch (error) {
        console.error("Groq Error:", error);
        res.status(500).json({ error: "AI failed to generate question" });
    }
});

app.post('/api/evaluate-answer', async (req, res) => {
    const { question, answer } = req.body;
    try {
        const completion = await groq.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: "Evaluate the user's interview answer. Provide a score out of 10, list strengths, weaknesses, and a better version of the answer. Format as JSON: { \"score\": 8, \"strengths\": \"...\", \"weaknesses\": \"...\", \"improvedAnswer\": \"...\" }"
                },
                { role: "user", content: `Question: ${question}\nAnswer: ${answer}` }
            ],
            model: "llama-3.3-70b-versatile",
            response_format: { type: "json_object" }
        });

        try {
            res.json(JSON.parse(completion.choices[0].message.content));
        } catch (parseError) {
            console.error("JSON Parse Error:", parseError, "\nRaw Output:", completion.choices[0].message.content);
            res.status(500).json({ error: "AI response was not valid JSON", raw: completion.choices[0].message.content });
        }
    } catch (error) {
        console.error("Eval Error:", error);
        res.status(500).json({ error: "Evaluation failed" });
    }
});
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
