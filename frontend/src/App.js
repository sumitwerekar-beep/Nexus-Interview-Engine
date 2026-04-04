import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Send, Award, RefreshCw, User, Cpu } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import './App.css';

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

function App() {
  const [role, setRole] = useState("");
  const [resumeContext, setResumeContext] = useState("");
  const [isStarted, setIsStarted] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [evaluation, setEvaluation] = useState(null);
  const chatEndRef = useRef(null);
  const [uploading, setUploading] = useState(false);

   const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('resume', file);

    try {
      const response = await fetch(`${API_BASE}/upload-resume`, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const err = await response.json().catch(() => null);
        console.error("Server error:", err);
        alert(err?.error || "Upload failed: " + response.status);
        return;
      }
      
      const data = await response.json();
      if (data.resumeContext) setResumeContext(data.resumeContext);
      alert(data.message || "Resume processed!");
    } catch (error) {
      console.error("Upload failed:", error);
      alert("Failed to upload resume.");
    } finally {
      setUploading(false);
    }
  };

  const scrollToBottom = () => chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  useEffect(() => { scrollToBottom(); }, [messages]);

  const startInterview = async () => {
    if (!role) return;
    setIsStarted(true);
    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE}/generate-question`, { role, history: [], resumeContext });
      setMessages([{ type: 'ai', text: res.data.question }]);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input;
    const currentQuestion = messages[messages.length - 1].text;
    
    setMessages(prev => [...prev, { type: 'user', text: userMsg }]);
    setInput("");
    setLoading(true);
    setEvaluation(null);

    try {
      const evalRes = await axios.post(`${API_BASE}/evaluate-answer`, { 
        question: currentQuestion, 
        answer: userMsg 
      });
      setEvaluation(evalRes.data);

      const nextRes = await axios.post(`${API_BASE}/generate-question`, { 
        role, 
        history: [...messages, { type: 'user', text: userMsg }],
        resumeContext 
      });
      setMessages(prev => [...prev, { type: 'ai', text: nextRes.data.question }]);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  if (!isStarted) {
    return (
      <div className="app-container">
        {/* Decorative Background Orbs */}
        <div className="bg-orb orb-1"></div>
        <div className="bg-orb orb-2"></div>

        <div className="hero-section">
          {/* Left Side: Marketing / Hero Copy */}
          <motion.div 
            initial="hidden" 
            animate="visible" 
            variants={{
              hidden: { opacity: 0 },
              visible: { opacity: 1, transition: { staggerChildren: 0.15 } }
            }} 
            className="hero-content"
          >
             <motion.h1 variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 }}} className="hero-title">
               Ace Your Next <br/><span className="text-gradient">Technical Interview</span>
             </motion.h1>
             <motion.p variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 }}} className="hero-description">
               Simulate high-pressure interview scenarios with our state-of-the-art AI. 
               Receive real-time, actionable feedback on your answers and learn exactly how to perfect your delivery.
             </motion.p>
             <motion.ul variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 }}} className="hero-features">
               <motion.li variants={{ hidden: { opacity: 0, x: -20 }, visible: { opacity: 1, x: 0 }}}><Award size={24} className="feature-icon"/> <span>Instant, granular feedback on your responses</span></motion.li>
               <motion.li variants={{ hidden: { opacity: 0, x: -20 }, visible: { opacity: 1, x: 0 }}}><Cpu size={24} className="feature-icon"/> <span>Tailored questions based strictly on your resume</span></motion.li>
               <motion.li variants={{ hidden: { opacity: 0, x: -20 }, visible: { opacity: 1, x: 0 }}}><User size={24} className="feature-icon"/> <span>Endless, unique practice for any role or seniority</span></motion.li>
             </motion.ul>
          </motion.div>

          {/* Right Side: Setup Card */}
          <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} className="setup-card">
            <div className="setup-icon-wrapper">
              <Cpu size={32} color="var(--accent-color)" />
            </div>
            <div>
              <h2 className="setup-title">Begin Session</h2>
              <p className="setup-subtitle">Personalize your AI examiner.</p>
            </div>
            
            <div className="upload-section">
              <span className="step-label">Step 1: Upload Resume (PDF or Image)</span>
              <input 
                type="file" 
                accept=".pdf,image/png,image/jpeg,image/webp" 
                onChange={handleFileUpload} 
                className="file-input"
              />
              {uploading && <p className="pulse-text">AI is reading your background...</p>}
            </div>
            
            <div>
              <input 
                className="text-input"
                placeholder="Ex: Senior Frontend Developer"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              />
            </div>
            
            <button onClick={startInterview} className="primary-button">
              Start Interview
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="interview-layout">
      <div className="chat-container">
        {/* Header */}
        <div className="chat-header">
          <div className="header-status">
            <div className="status-dot" />
            <span>Live Interview: {role}</span>
          </div>
          <button onClick={() => window.location.reload()} className="icon-button">
            <RefreshCw size={18} />
          </button>
        </div>

        {/* Chat Area */}
        <div className="chat-messages">
          <AnimatePresence>
            {messages.map((m, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: m.type === 'ai' ? -10 : 10 }} animate={{ opacity: 1, x: 0 }} 
                className={`message-wrapper ${m.type === 'ai' ? 'message-ai' : 'message-user'}`}>
                <div className={`message-bubble ${m.type === 'ai' ? 'bubble-ai' : 'bubble-user'}`}>
                  {m.type === 'ai' ? <Cpu size={20} className="message-icon ai-icon" /> : <User size={20} className="message-icon" />}
                  <p>{m.text}</p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {loading && <div className="typing-indicator">AI is thinking...</div>}
          <div ref={chatEndRef} />
        </div>

        {/* Feedback Panel */}
        {evaluation && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="evaluation-panel">
            <div className="eval-header">
              <Award size={14} /> Evaluation Score: {evaluation.score}/10
            </div>
            <p className="eval-quote">"{evaluation.improvedAnswer}"</p>
            <div className="eval-grid">
              <div className="eval-strengths">✅ {evaluation.strengths}</div>
              <div className="eval-weaknesses">⚠️ {evaluation.weaknesses}</div>
            </div>
          </motion.div>
        )}

        {/* Input Area */}
        <div className="chat-input-area">
          <div className="input-wrapper">
            <input 
              className="chat-input"
              placeholder="Type your response here..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            />
            <button onClick={handleSend} className="send-button">
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;