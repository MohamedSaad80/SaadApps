
import React, { useState, useEffect, useRef } from 'react';
import { User } from '../types';
import { GoogleGenAI } from "@google/genai";

interface AIMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

interface AIChatProps {
  user: User;
}

const AIChat: React.FC<AIChatProps> = ({ user }) => {
  const [messages, setMessages] = useState<AIMessage[]>([
    {
      role: 'model',
      text: `Hi ${user.name}! I'm Gemini, your Saad Social Assistant. How can I help you today?`,
      timestamp: Date.now()
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg: AIMessage = { role: 'user', text: input, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      // Creating a new instance right before calling is recommended for best results
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      // Gemini API requires history to start with a 'user' turn. 
      // Our first message is 'model' (greeting), so we skip it in history sent to API if it is the first turn.
      const history = messages
        .filter((_, idx) => idx > 0 || messages[0].role === 'user')
        .map(m => ({
          role: m.role,
          parts: [{ text: m.text }]
        }));

      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: [...history, { role: 'user', parts: [{ text: input }] }],
        config: {
          systemInstruction: "You are the helpful AI assistant for 'Saad Social Chat', a modern real-time social networking app. Help users navigate the app, suggest conversation starters, or just chat. Be friendly, concise, and use emojis."
        }
      });

      // Use the text property directly (not a method)
      const aiText = response.text || "I'm sorry, I couldn't process that. Could you try again?";
      setMessages(prev => [...prev, { role: 'model', text: aiText, timestamp: Date.now() }]);
    } catch (error) {
      console.error("AI Chat Error:", error);
      setMessages(prev => [...prev, { role: 'model', text: "Oops! I'm having trouble connecting right now.", timestamp: Date.now() }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-slate-50/30 animate-fade-in">
      {/* Header */}
      <div className="px-6 py-4 border-b border-indigo-100 flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center space-x-4">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-100 ring-2 ring-white">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <h3 className="text-base font-black text-indigo-900 tracking-tight">Gemini AI Assistant</h3>
            <div className="flex items-center space-x-1.5">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Always Online</p>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar"
      >
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
            <div className={`max-w-[85%] px-5 py-3.5 rounded-3xl text-[13.5px] shadow-sm leading-relaxed ${
              msg.role === 'user' 
                ? 'bg-indigo-600 text-white rounded-br-none shadow-indigo-100' 
                : 'bg-white text-gray-800 border border-indigo-50 rounded-bl-none'
            }`}>
              {msg.text}
              <div className={`text-[9px] mt-2 font-bold uppercase tracking-tighter ${
                msg.role === 'user' ? 'text-indigo-200' : 'text-gray-400'
              }`}>
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start animate-pulse">
            <div className="bg-white border border-indigo-50 px-5 py-3.5 rounded-3xl rounded-bl-none shadow-sm flex items-center space-x-2">
               <div className="flex space-x-1">
                 <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"></div>
                 <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                 <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
               </div>
               <span className="text-[10px] font-black text-indigo-300 uppercase tracking-widest">Gemini is thinking</span>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-6 bg-white border-t border-indigo-50">
        <form onSubmit={handleSendMessage} className="flex space-x-3 items-end">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask me anything..."
            className="flex-1 px-6 py-4 bg-gray-50 border border-gray-100 rounded-3xl focus:outline-none focus:ring-4 focus:ring-indigo-100 transition-all text-sm shadow-inner"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="p-4 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 shadow-xl shadow-indigo-100 disabled:opacity-50 transition-all active:scale-90"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
};

export default AIChat;
