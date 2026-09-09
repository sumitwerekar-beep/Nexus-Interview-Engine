const express = require('express');
const cors = require('cors');
const Groq = require('groq-sdk');
const multer = require('multer');

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors());
app.use(express.json());

function getGroqClient() {
    if (!process.env.GROQ_API_KEY) {
        throw new Error("GROQ_API_KEY environment variable is missing in backend server configuration.");
    }
    return new Groq({ apiKey: process.env.GROQ_API_KEY });
}

const handleGenerateQuestion = async (req, res) => {
    const { role, history = [], resumeContext } = req.body;
    console.log("Generating question, role:", role, "resume context length:", resumeContext ? resumeContext.length : "UNDEFINED/EMPTY");
    try {
        const groq = getGroqClient();
        const messages = [
            {
                role: "system",
                content: `You are a professional technical interviewer for: ${role}. 
                RESUME CONTEXT: ${resumeContext || "No resume provided."}
                INSTRUCTIONS:
                1. If a resume is provided, ask a specific question about their experience/projects.
                2. If no resume is provided, ask a standard role-based question.
                3. Be concise and professional.
                4. Never mention or reference whether a resume was or wasn't provided. Do not say things like "since no resume has been provided" — just ask the question directly, as if starting a normal interview.`
            },
            ...history.map(m => ({ role: m.type === 'ai' ? 'assistant' : 'user', content: m.text }))
        ];

        if (history.length === 0) {
            messages.push({ 
                role: "user", 
                content: `Please begin the interview for the ${role} position by asking your first question.` 
            });
        }

        const completion = await groq.chat.completions.create({
            messages,
            model: "groq/compound-mini",
        });
        res.json({ question: completion.choices[0].message.content });
    } catch (error) {
        console.error("Groq Question Generation Error:", error.message || error);
        res.status(500).json({ 
            error: "AI failed to generate question", 
            details: error.message || "Unknown error occurred" 
        });
    }
};

const handleEvaluateAnswer = async (req, res) => {
    const { question, answer } = req.body;
    try {
        const groq = getGroqClient();
        const completion = await groq.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: "Evaluate the user's interview answer. Provide a score out of 10, list strengths, weaknesses, and a better version of the answer. Format as JSON: { \"score\": 8, \"strengths\": \"...\", \"weaknesses\": \"...\", \"improvedAnswer\": \"...\" }"
                },
                { role: "user", content: `Question: ${question}\nAnswer: ${answer}` }
            ],
            model: "groq/compound-mini",
            response_format: { type: "json_object" }
        });

        try {
            res.json(JSON.parse(completion.choices[0].message.content));
        } catch (parseError) {
            console.error("JSON Parse Error:", parseError, "\nRaw Output:", completion.choices[0].message.content);
            res.status(500).json({ error: "AI response was not valid JSON", raw: completion.choices[0].message.content });
        }
    } catch (error) {
        console.error("Eval Error:", error.message || error);
        res.status(500).json({ 
            error: "Evaluation failed", 
            details: error.message || "Unknown error occurred" 
        });
    }
};

app.post('/api/generate-question', handleGenerateQuestion);
app.post('/generate-question', handleGenerateQuestion);

app.post('/api/evaluate-answer', handleEvaluateAnswer);
app.post('/evaluate-answer', handleEvaluateAnswer);


const PORT = process.env.PORT || 5000;

if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`🚀 Server running on http://localhost:${PORT}`);
        if (!process.env.GROQ_API_KEY) {
            console.warn("⚠️ WARNING: GROQ_API_KEY is not defined in backend environment variables!");
        }
    });
}

module.exports = app;


