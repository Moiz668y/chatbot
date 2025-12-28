
import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, Info, RefreshCw, Trash2, FileText, Paperclip, CheckCircle } from 'lucide-react';
import { ChatMessage } from '../types';
import { vectorStore } from '../services/vectorStore';
import { geminiService } from '../services/gemini';

interface ChatInterfaceProps {
  messages: ChatMessage[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  isBackgroundIndexing?: boolean;
  onUploadRequested: (files: FileList | null) => void;
}

const FormattedText: React.FC<{ text: string }> = ({ text }) => {
  if (!text) return null;
  const lines = text.split('\n');
  return (
    <>
      {lines.map((line, i) => {
        const isBullet = line.trim().startsWith('* ') || line.trim().startsWith('- ');
        const cleanLine = isBullet ? line.trim().substring(2) : line;
        const parts = cleanLine.split(/(\*\*.*?\*\*)/g);
        const formattedLine = parts.map((part, j) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={j} className="font-bold">{part.slice(2, -2)}</strong>;
          }
          return part;
        });
        if (isBullet) {
          return (
            <div key={i} className="flex gap-2 ml-2 mb-1">
              <span className="text-indigo-400 mt-1 flex-shrink-0">•</span>
              <span>{formattedLine}</span>
            </div>
          );
        }
        return (
          <p key={i} className={line.trim() === '' ? 'h-3' : 'mb-2'}>
            {formattedLine}
          </p>
        );
      })}
    </>
  );
};

const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
  messages, 
  setMessages,
  isBackgroundIndexing,
  onUploadRequested
}) => {
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isTyping) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    try {
      const relevantChunks = await vectorStore.search(userMessage.content, 5);
      const context = relevantChunks.map(c => `[Document: ${c.documentName}]\n${c.text}`).join('\n\n---\n\n');
      const sources = Array.from(new Set(relevantChunks.map(c => c.documentName)));

      const aiMessageId = crypto.randomUUID();
      let aiContent = "";
      
      setMessages(prev => [...prev, {
        id: aiMessageId,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        sources: sources.length > 0 ? sources : undefined
      }]);

      const generator = geminiService.generateRagResponse(userMessage.content, context);
      
      for await (const text of generator) {
        aiContent += text;
        setMessages(prev => prev.map(msg => 
          msg.id === aiMessageId ? { ...msg, content: aiContent } : msg
        ));
      }

    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: "I encountered an error while retrieving information. Please try again or check your Knowledge Base.",
        timestamp: new Date(),
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onUploadRequested(e.target.files);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="flex flex-col h-full max-w-5xl mx-auto w-full px-4 md:px-6 animate-in fade-in duration-300">
      <header className="py-4 flex items-center justify-between border-b border-slate-200 sticky top-0 bg-slate-50/80 backdrop-blur-sm z-10">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-600 rounded-lg text-white shadow-md shadow-indigo-100 transition-transform hover:scale-105">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-slate-800 tracking-tight">AI Research Assistant</h2>
            <div className="flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${isBackgroundIndexing ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                {isBackgroundIndexing ? 'Knowledge Indexing active' : `${vectorStore.getChunkCount()} Knowledge Segments`}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setMessages([])}
            className="p-2 hover:bg-slate-200 rounded-lg transition-colors text-slate-400 hover:text-slate-600"
            title="Clear Chat"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto custom-scrollbar py-8 space-y-8">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center max-w-md mx-auto py-20">
            <div className="w-20 h-20 bg-white border border-slate-100 rounded-3xl flex items-center justify-center mb-6 rotate-3 shadow-xl shadow-slate-200/50 transition-transform hover:rotate-0 duration-500">
              <Bot className="w-10 h-10 text-indigo-500 -rotate-3" />
            </div>
            <h3 className="text-2xl font-bold text-slate-800 mb-3 tracking-tight">How can I help?</h3>
            <p className="text-slate-500 mb-8 leading-relaxed text-sm">
              Upload documents or paste links in the Knowledge Base, then ask me anything. I ground my answers in your data.
            </p>
            <div className="grid grid-cols-1 gap-3 w-full">
              {[
                "Summarize the main points of my uploads.",
                "What is the timeline of events described?",
                "List the key stakeholders mentioned."
              ].map((q, i) => (
                <button
                  key={i}
                  onClick={() => { setInput(q); }}
                  className="px-5 py-4 text-sm border border-slate-200 rounded-2xl hover:border-indigo-400 hover:bg-white hover:shadow-lg hover:shadow-indigo-100/50 transition-all text-slate-600 text-left font-medium group bg-white/50"
                >
                  <span className="group-hover:text-indigo-600">"{q}"</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-4 duration-500`}>
            <div className={`flex gap-4 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center shadow-sm ${
                msg.role === 'user' ? 'bg-slate-800 text-white' : 'bg-white border border-slate-200 text-indigo-600'
              }`}>
                {msg.role === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
              </div>
              
              <div className={`space-y-3 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div className={`px-5 py-4 rounded-3xl shadow-sm text-sm leading-relaxed ${
                  msg.role === 'user' 
                    ? 'bg-indigo-600 text-white rounded-tr-none' 
                    : 'bg-white text-slate-700 rounded-tl-none border border-slate-100'
                }`}>
                  <FormattedText text={msg.content || (isTyping && msg.role === 'assistant' ? "Analyzing data..." : "")} />
                </div>
                
                {msg.sources && msg.sources.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    <div className="flex items-center gap-1 text-[10px] uppercase font-black text-slate-400 tracking-widest mr-1">
                      <Info className="w-3 h-3" /> Sources:
                    </div>
                    {msg.sources.map((src, idx) => (
                      <span key={idx} className="flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 bg-white text-indigo-600 rounded-lg border border-slate-200 shadow-sm transition-transform hover:scale-105">
                        <FileText className="w-3 h-3 text-indigo-400" />
                        {src}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        
        {isTyping && messages[messages.length - 1]?.role !== 'assistant' && (
          <div className="flex gap-4 animate-in fade-in duration-300">
             <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-indigo-600 shadow-sm">
                <Bot className="w-5 h-5" />
             </div>
             <div className="px-5 py-4 bg-white border border-slate-100 rounded-3xl rounded-tl-none shadow-sm flex items-center gap-3">
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                  <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                  <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"></span>
                </div>
             </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="py-6 mt-auto">
        <form 
          onSubmit={handleSend}
          className="relative flex items-center gap-2 bg-white border border-slate-200 rounded-[2rem] shadow-xl p-2.5 focus-within:ring-4 focus-within:ring-indigo-500/10 focus-within:border-indigo-400 transition-all duration-300"
        >
          <button
            type="button"
            className="p-3 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-all flex-shrink-0"
            title="Upload document"
            onClick={() => fileInputRef.current?.click()}
            disabled={isBackgroundIndexing || isTyping}
          >
            {isBackgroundIndexing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Paperclip className="w-5 h-5" />}
          </button>
          <input 
            type="file"
            ref={fileInputRef}
            onChange={onFileChange}
            className="hidden"
            accept=".txt,.md,.pdf,.csv"
            multiple
          />
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask your data..."
            className="flex-1 bg-transparent border-none outline-none px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 font-medium"
            disabled={isTyping}
          />
          <button
            type="submit"
            disabled={!input.trim() || isTyping}
            className={`p-3 rounded-full transition-all duration-300 flex-shrink-0 ${
              input.trim() && !isTyping
                ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-200' 
                : 'bg-slate-100 text-slate-300 cursor-not-allowed'
            }`}
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatInterface;
