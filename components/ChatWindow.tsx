import React, { useState, useEffect, useRef } from 'react';
import { User, Message } from '../types';
import { db } from '../services/databaseService';
import { getSmartReply, summarizeChat } from '../services/geminiService';
import { useLanguage } from '../LanguageContext';

interface ChatWindowProps {
  currentUser: User;
  targetId: string;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ currentUser, targetId }) => {
  const { t, isRTL } = useLanguage();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [chatSummary, setChatSummary] = useState<string | null>(null);
  const [targetUser, setTargetUser] = useState<User | null>(null);
  
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    db.getUser(targetId).then(setTargetUser);
    const unsubscribe = db.subscribeToMessages(currentUser.id, targetId, (msgs) => {
      setMessages(msgs);
      db.markMessagesAsRead(currentUser.id, targetId);
    });
    db.markMessagesAsRead(currentUser.id, targetId);
    return unsubscribe;
  }, [currentUser.id, targetId]);

  useEffect(() => {
    const lastMsg = messages[messages.length - 1];
    if (lastMsg && lastMsg.senderId === targetId && lastMsg.text) {
      handleGetSuggestions(lastMsg.text);
    } else {
      setSuggestions([]);
    }
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, targetId]);

  const handleSendMessage = async (e?: React.FormEvent, textOverride?: string, imageOverride?: string, audioOverride?: string) => {
    if (e) e.preventDefault();
    const messageText = textOverride || input;
    if (!messageText.trim() && !imageOverride && !audioOverride) return;

    await db.sendMessage(currentUser.id, targetId, messageText || undefined, imageOverride, audioOverride);
    setInput('');
    setSuggestions([]);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => handleSendMessage(undefined, undefined, reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunks.current = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunks.current.push(e.data); };
      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = () => handleSendMessage(undefined, undefined, undefined, reader.result as string);
        reader.readAsDataURL(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };
      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (err) { alert("Microphone access denied."); }
  };

  const stopRecording = () => {
    if (mediaRecorder) { mediaRecorder.stop(); setIsRecording(false); setMediaRecorder(null); }
  };

  const handleGetSuggestions = async (lastText: string) => {
    setIsAiLoading(true);
    const context = messages.slice(-5).filter(m => m.text).map(m => m.text).join(". ");
    const replies = await getSmartReply(context, lastText);
    setSuggestions(replies);
    setIsAiLoading(false);
  };

  const handleSummarize = async () => {
    const textList = messages.slice(-10).filter(m => m.text).map(m => `${m.senderId === currentUser.id ? 'Me' : targetUser?.name}: ${m.text}`);
    if (textList.length === 0) return;
    setIsAiLoading(true);
    const summary = await summarizeChat(textList);
    setChatSummary(summary);
    setIsAiLoading(false);
  };

  if (!targetUser) return null;

  return (
    <div className="flex flex-col h-full w-full animate-fade-in bg-white" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Refined Glass Header */}
      <div className="px-6 py-3 border-b border-gray-50 flex items-center justify-between glass sticky top-0 z-10">
        <div className="flex items-center space-x-3">
          <img src={targetUser.avatar} className="w-10 h-10 rounded-full border border-gray-100" alt="" />
          <div>
            <h3 className="text-sm font-bold text-gray-900 tracking-tight">{targetUser.name}</h3>
            <div className="flex items-center space-x-1">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Online</p>
            </div>
          </div>
        </div>
        <button 
          onClick={handleSummarize}
          className="p-2 text-gray-400 hover:text-indigo-600 transition-colors"
          title={t('summarize')}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
        </button>
      </div>

      {chatSummary && (
        <div className="m-4 p-4 bg-gray-900 text-white rounded-2xl flex items-center justify-between shadow-lg">
          <p className="text-[11px] font-medium leading-relaxed italic">"{chatSummary}"</p>
          <button onClick={() => setChatSummary(null)} className="ml-4 p-1 hover:bg-white/10 rounded-full">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
      )}

      {/* Message List */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar bg-gray-50/30">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.senderId === currentUser.id ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-[13px] leading-relaxed ${
              msg.senderId === currentUser.id 
                ? 'bg-indigo-600 text-white rounded-br-none' 
                : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none shadow-sm'
            }`}>
              {msg.image && <img src={msg.image} className="rounded-xl mb-2 max-h-60 object-cover" alt="" />}
              {msg.audio && <audio src={msg.audio} controls className="h-8 mb-1 scale-90" />}
              {msg.text && <div className="font-medium">{msg.text}</div>}
              <div className={`text-[9px] mt-1 font-bold uppercase tracking-tighter opacity-60`}>
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Professional Input Area */}
      <div className="p-4 bg-white border-t border-gray-50">
        <div className="flex flex-wrap gap-2 mb-3">
          {suggestions.map((s, idx) => (
            <button key={idx} onClick={() => handleSendMessage(undefined, s)} className="px-3 py-1 bg-gray-50 border border-gray-100 rounded-full text-[10px] font-bold text-gray-500 hover:bg-gray-100 transition-colors">
              {s}
            </button>
          ))}
        </div>

        <form onSubmit={handleSendMessage} className="flex items-end space-x-2">
          <button type="button" onClick={() => imageInputRef.current?.click()} className="p-2.5 text-gray-400 hover:text-indigo-600 transition-colors">
             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
          </button>
          <input type="file" ref={imageInputRef} onChange={handleImageSelect} className="hidden" accept="image/*" />
          
          <div className="flex-1 relative">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t('type_message')}
              className="w-full px-5 py-3 bg-gray-50 border border-gray-100 rounded-full focus:outline-none focus:ring-4 focus:ring-gray-100 transition-all text-xs"
            />
            {isAiLoading && (
              <div className="absolute right-4 top-3 animate-spin h-3 w-3 border border-indigo-600 border-t-transparent rounded-full"></div>
            )}
          </div>

          <button
            type="button"
            onMouseDown={startRecording}
            onMouseUp={stopRecording}
            className={`p-2.5 rounded-full transition-all ${isRecording ? 'bg-red-50 text-red-600 animate-pulse' : 'text-gray-400 hover:text-indigo-600'}`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"/></svg>
          </button>

          <button
            type="submit"
            disabled={!input.trim()}
            className="p-3 bg-indigo-600 text-white rounded-full shadow-lg shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-30 disabled:shadow-none"
          >
            <svg className="w-4 h-4 transform rotate-45" fill="currentColor" viewBox="0 0 20 20"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"/></svg>
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatWindow;