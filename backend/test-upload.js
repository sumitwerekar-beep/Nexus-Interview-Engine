const fs = require('fs');
const pdf = require('pdf-parse');
const Groq = require('groq-sdk');
require('dotenv').config();

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function test() {
    console.log("Testing process...");
    
    // Test Groq Vision
    try {
        console.log("Testing Groq Vision...");
        const base64Image = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="; // 1x1 transparent PNG
        const completion = await groq.chat.completions.create({
            messages: [
                {
                    role: "user",
                    content: [
                        { type: "text", text: "What is this image?" },
                        { type: "image_url", image_url: { url: `data:image/png;base64,${base64Image}` } }
                    ]
                }
            ],
            model: "llama-3.2-11b-vision-preview"
        });
        console.log("✅ Groq Vision Response:", completion.choices[0].message.content);
    } catch (e) {
        console.error("❌ Groq Vision Error:", e.response ? JSON.stringify(e.response, null, 2) : e.message);
    }
}
test();
