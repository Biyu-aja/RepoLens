import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, Sparkles, AlertCircle } from 'lucide-react';
import type { RepoAnalysis } from '../types';

interface Message {
  id: string;
  role: 'user' | 'ai';
  content: string;
  timestamp: Date;
  isError?: boolean;
}

interface ChatHistory {
  role: 'user' | 'assistant';
  content: string;
}

interface Props {
  data: RepoAnalysis;
}

const API_URL = 'http://localhost:3001/api';

const ChatPanel: React.FC<Props> = ({ data }) => {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatHistory[]>([]);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'ai',
      content: `👋 Hi! I'm powered by **Gemini AI**. I've analyzed **${data.name}** and I'm ready to help!\n\nAsk me anything about:\n• Code structure & quality\n• How to improve your scores\n• Best practices for this repo\n• Documentation suggestions`,
      timestamp: new Date()
    }
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessageToAI = async (userMessage: string): Promise<string> => {
    const repoContext = {
      name: data.name,
      owner: data.owner,
      readme: data.readme,
      overallScore: data.overallScore,
      breakdown: data.breakdown,
      insights: data.insights
    };

    const response = await fetch(`${API_URL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: userMessage,
        repoContext,
        history: chatHistory
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get AI response');
    }

    const result = await response.json();
    return result.response;
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: userMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const responseText = await sendMessageToAI(userMessage);
      
      // Update chat history for context
      setChatHistory(prev => [
        ...prev,
        { role: 'user', content: userMessage },
        { role: 'assistant', content: responseText }
      ]);

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        content: responseText,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (err: any) {
      console.error('Chat error:', err);
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        content: `⚠️ Sorry, I encountered an error: ${err.message}. Please try again.`,
        timestamp: new Date(),
        isError: true
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  // Quick action buttons
  const quickActions = [
    { label: '📊 Score Details', prompt: 'Explain my repository scores in detail' },
    { label: '🔧 Improvements', prompt: 'What should I prioritize to improve this repo?' },
    { label: '📝 Documentation', prompt: 'How can I improve my documentation?' },
  ];

  const handleQuickAction = (prompt: string) => {
    if (loading) return;
    setInput(prompt);
  };

  // Render markdown-like content (basic)
  const renderContent = (content: string) => {
    return content.split('\n').map((line, i) => {
      // Bold text
      const boldLine = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      // Inline code
      const codeLine = boldLine.replace(/`([^`]+)`/g, '<code class="bg-white/10 px-1 rounded text-primary">$1</code>');
      
      if (line.trim() === '') {
        return <p key={i} className="mb-2" />;
      }
      
      // List items
      if (line.trim().startsWith('•') || line.trim().startsWith('-')) {
        return (
          <p key={i} className="ml-2" dangerouslySetInnerHTML={{ __html: codeLine }} />
        );
      }
      
      return (
        <p key={i} dangerouslySetInnerHTML={{ __html: codeLine }} />
      );
    });
  };

  return (
    <div className="flex flex-col h-full bg-bg-card overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/10 flex items-center gap-2 bg-gradient-to-r from-primary/10 to-transparent">
        <Sparkles size={16} className="text-primary" />
        <span className="text-sm font-medium text-white">AI Chat</span>
        <span className="text-xs text-gray-400 ml-auto">Gemini 3 Flash</span>
      </div>

      {/* Messages */}
      <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-4 custom-scrollbar">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-3 max-w-[90%] ${msg.role === 'user' ? 'self-end flex-row-reverse' : 'self-start'}`}>
            <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
              msg.role === 'ai' 
                ? msg.isError 
                  ? 'bg-red-500/20 text-red-400' 
                  : 'bg-primary/20 text-primary' 
                : 'bg-success/20 text-success'
            }`}>
              {msg.role === 'ai' ? (msg.isError ? <AlertCircle size={16} /> : <Bot size={16} />) : <User size={16} />}
            </div>
            <div className={`py-2 px-3 rounded-lg text-sm leading-relaxed ${
              msg.role === 'ai' 
                ? msg.isError
                  ? 'bg-red-500/10 border border-red-500/20 rounded-tl-sm text-red-200'
                  : 'bg-white/5 rounded-tl-sm text-gray-200' 
                : 'bg-primary text-white rounded-tr-sm'
            }`}>
              <div className="whitespace-pre-wrap">
                {renderContent(msg.content)}
              </div>
              <span className="block text-[10px] mt-1 opacity-60 text-right">
                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-3 max-w-[90%] self-start">
            <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 bg-primary/20 text-primary">
              <Bot size={16} />
            </div>
            <div className="py-2 px-3 rounded-lg text-sm leading-relaxed bg-white/5 rounded-tl-sm text-gray-200 min-w-[80px] flex items-center gap-2">
              <Loader2 className="animate-spin" size={16} />
              <span className="text-xs text-gray-400">Thinking...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Actions */}
      {messages.length <= 2 && (
        <div className="px-4 pb-2 flex gap-2 flex-wrap">
          {quickActions.map((action, i) => (
            <button
              key={i}
              onClick={() => handleQuickAction(action.prompt)}
              className="text-xs px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-gray-300 hover:bg-primary/20 hover:border-primary/30 hover:text-white transition-all cursor-pointer"
              disabled={loading}
            >
              {action.label}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSend} className="p-4 bg-[#16161acc] backdrop-blur-md border-t border-white/10 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about the repo..."
          className="flex-1 bg-black/20 border border-white/10 rounded-md px-3 py-2 text-white outline-none text-sm transition-colors focus:border-primary"
          disabled={loading}
        />
        <button 
          type="submit" 
          className="bg-primary text-white w-9 h-9 rounded-md flex items-center justify-center transition-all hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer" 
          disabled={loading || !input.trim()}
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
};

export default ChatPanel;
