import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Send, Award, RefreshCw, User, Cpu, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import './App.css';

const API_BASE = process.env.REACT_APP_API_URL || 
  (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? "http://localhost:5000/api" 
    : "/api");


function App() {
  const [role, setRole] = useState("");
  const [resumeContext] = useState("");
  const [isStarted, setIsStarted] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [evaluation, setEvaluation] = useState(null);
  const chatEndRef = useRef(null);

  const scrollToBottom = () => chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  useEffect(() => { scrollToBottom(); }, [messages, error, loading]);

  const startInterview = async () => {
    if (!role) return;
    setIsStarted(true);
    setLoading(true);
    setError(null);
    try {
      const res = await axios.post(`${API_BASE}/generate-question`, { role, history: [], resumeContext });
      if (res.data && res.data.question) {
        setMessages([{ type: 'ai', text: res.data.question }]);
      } else {
        setError(res.data?.error || "Failed to receive a response from the server.");
      }
    } catch (err) {
      console.error("Start interview error:", err);
      const detail = err.response?.data?.details || err.response?.data?.error || err.message || "Could not connect to the backend server.";
      setError(`Server Error: ${detail}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input;
    const currentQuestion = messages[messages.length - 1]?.text || "";
    
    setMessages(prev => [...prev, { type: 'user', text: userMsg }]);
    setInput("");
    setLoading(true);
    setEvaluation(null);
    setError(null);

    try {
      if (currentQuestion) {
        const evalRes = await axios.post(`${API_BASE}/evaluate-answer`, { 
          question: currentQuestion, 
          answer: userMsg 
        });
        setEvaluation(evalRes.data);
      }

      const nextRes = await axios.post(`${API_BASE}/generate-question`, { 
        role, 
        history: [...messages, { type: 'user', text: userMsg }],
        resumeContext 
      });
      if (nextRes.data && nextRes.data.question) {
        setMessages(prev => [...prev, { type: 'ai', text: nextRes.data.question }]);
      } else {
        setError(nextRes.data?.error || "Failed to generate follow-up question.");
      }
    } catch (err) {
      console.error("Send message error:", err);
      const detail = err.response?.data?.details || err.response?.data?.error || err.message || "Failed to process request.";
      setError(`Error: ${detail}`);
    } finally {
      setLoading(false);
    }
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
            
            <div>
              <input 
                className="text-input"
                placeholder="Ex: Senior Frontend Developer"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && startInterview()}
              />
            </div>
            
            <button onClick={startInterview} className="primary-button" disabled={!role.trim()}>
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
          <button onClick={() => window.location.reload()} className="icon-button" title="Restart Session">
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
          
          {error && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="error-banner">
              <div className="error-title">
                <AlertCircle size={18} />
                <span>Interview Engine Error</span>
              </div>
              <p className="error-message">{error}</p>
              <div className="error-actions">
                <button onClick={messages.length === 0 ? startInterview : handleSend} className="retry-button">
                  Retry
                </button>
                <button onClick={() => setIsStarted(false)} className="retry-button" style={{ background: '#475569' }}>
                  Back to Setup
                </button>
              </div>
            </motion.div>
          )}

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
              disabled={loading}
            />
            <button onClick={handleSend} className="send-button" disabled={loading || !input.trim()}>
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;