import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Send, Award, RefreshCw, User, Cpu } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const API_BASE = "http://localhost:5000/api";

function App() {
  const [role, setRole] = useState("");
  const [isStarted, setIsStarted] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [evaluation, setEvaluation] = useState(null);
  const chatEndRef = useRef(null);

  const scrollToBottom = () => chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  useEffect(() => { scrollToBottom(); }, [messages]);

  const startInterview = async () => {
    if (!role) return;
    setIsStarted(true);
    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE}/generate-question`, { role, history: [] });
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
      // 1. Get Evaluation
      const evalRes = await axios.post(`${API_BASE}/evaluate-answer`, { 
        question: currentQuestion, 
        answer: userMsg 
      });
      setEvaluation(evalRes.data);

      // 2. Get Next Question
      const nextRes = await axios.post(`${API_BASE}/generate-question`, { 
        role, 
        history: [...messages, { type: 'user', text: userMsg }] 
      });
      setMessages(prev => [...prev, { type: 'ai', text: nextRes.data.question }]);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  if (!isStarted) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-md w-full bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-2xl text-center">
          <div className="bg-blue-500/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
            <Cpu className="text-blue-400 w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">AI Interviewer</h1>
          <p className="text-slate-400 mb-8">Master your next career move with real-time AI feedback.</p>
          <input 
            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
            placeholder="What role are you interviewing for?"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          />
          <button onClick={startInterview} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 rounded-xl transition-all shadow-lg shadow-blue-900/20">
            Begin Session
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 flex flex-col items-center p-4">
      <div className="max-w-4xl w-full flex flex-col h-[90vh] bg-slate-900/50 rounded-3xl border border-slate-800 backdrop-blur-xl overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="font-medium text-slate-300">Live Interview: {role}</span>
          </div>
          <button onClick={() => window.location.reload()} className="text-slate-500 hover:text-white transition-colors">
            <RefreshCw size={18} />
          </button>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <AnimatePresence>
            {messages.map((m, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: m.type === 'ai' ? -10 : 10 }} animate={{ opacity: 1, x: 0 }} 
                className={`flex ${m.type === 'ai' ? 'justify-start' : 'justify-end'}`}>
                <div className={`max-w-[80%] p-4 rounded-2xl flex gap-3 ${m.type === 'ai' ? 'bg-slate-800 border border-slate-700 text-white' : 'bg-blue-600 text-white ml-auto'}`}>
                  {m.type === 'ai' ? <Cpu size={20} className="text-blue-400 shrink-0" /> : <User size={20} className="shrink-0" />}
                  <p className="leading-relaxed">{m.text}</p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {loading && <div className="text-blue-400 animate-pulse text-sm">AI is thinking...</div>}
          <div ref={chatEndRef} />
        </div>

        {/* Feedback Panel */}
        {evaluation && (
          <motion.div initial={{ y: 50 }} animate={{ y: 0 }} className="mx-6 mb-4 p-4 bg-slate-800/80 rounded-xl border border-blue-500/30">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-blue-400 font-bold uppercase text-xs tracking-wider">
                <Award size={14} /> Evaluation Score: {evaluation.score}/10
              </div>
            </div>
            <p className="text-sm italic text-slate-300 mb-2">" {evaluation.improvedAnswer} "</p>
            <div className="grid grid-cols-2 gap-4 text-[11px]">
              <div className="text-green-400">✅ {evaluation.strengths}</div>
              <div className="text-red-400">⚠️ {evaluation.weaknesses}</div>
            </div>
          </motion.div>
        )}

        {/* Input Area */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/80">
          <div className="relative flex items-center">
            <input 
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-4 pr-12 py-4 text-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
              placeholder="Type your response here..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            />
            <button onClick={handleSend} className="absolute right-3 p-2 bg-blue-600 rounded-xl text-white hover:bg-blue-500 transition-all shadow-lg shadow-blue-900/40">
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;