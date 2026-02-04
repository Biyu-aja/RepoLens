import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2 } from 'lucide-react';
import type { RepoAnalysis } from '../types';

interface Message {
  id: string;
  role: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

interface Props {
  data: RepoAnalysis;
}

const ChatPanel: React.FC<Props> = ({ data }) => {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'ai',
      content: `Hi! I've analyzed **${data.name}**. Ask me anything about the code structure, quality, or how to improve it.`,
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

  const generateResponse = async (query: string) => {
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));
    
    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes('score') || lowerQuery.includes('grade')) {
        return `The overall score is **${data.overallScore}/100**. Breakdown:
- Documentation: ${data.breakdown.documentation}
- Structure: ${data.breakdown.structure}
- Health: ${data.breakdown.commitHealth}
- Testing: ${data.breakdown.testing} (This is a key area to improve!)`;
    }
    
    if (lowerQuery.includes('test')) {
        return `Testing coverage is currently rated at ${data.breakdown.testing}/100. You should consider adding unit tests for the core services and integration tests for the API endpoints.`;
    }

    if (lowerQuery.includes('improve') || lowerQuery.includes('better')) {
        return `focus on these three things:
1. **Testing**: Increase coverage.
2. **Documentation**: Add more examples to the README.
3. **CI/CD**: Ensure you have a robust pipeline.`;
    }

    if (lowerQuery.includes('readme')) {
        return "The README seems " + (data.breakdown.documentation > 80 ? "comprehensive!" : "a bit sparse. You should add installation instructions.");
    }

    return `That's an interesting question about ${data.name}. Based on the static analysis, I'd suggest looking into the \`src\` directory structure to ensure separation of concerns.`;
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const responseText = await generateResponse(userMsg.content);
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        content: responseText,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-bg-card overflow-hidden">
      <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-4 custom-scrollbar">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-3 max-w-[90%] ${msg.role === 'user' ? 'self-end flex-row-reverse' : 'self-start'}`}>
            <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'ai' ? 'bg-primary/20 text-primary' : 'bg-success/20 text-success'}`}>
              {msg.role === 'ai' ? <Bot size={16} /> : <User size={16} />}
            </div>
            <div className={`py-2 px-3 rounded-lg text-sm leading-relaxed ${msg.role === 'ai' ? 'bg-white/5 rounded-tl-sm text-gray-200' : 'bg-primary text-white rounded-tr-sm'}`}>
              <div className="whitespace-pre-wrap">
                {msg.content.split('\n').map((line, i) => (
                    <p key={i} className={line.trim() === '' ? 'mb-2' : ''}>{line}</p>
                ))}
            </div>
              <span className="block text-[10px] mt-1 opacity-60 text-right">
                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-3 max-w-[90%] self-start">
            <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 bg-primary/20 text-primary"><Bot size={16} /></div>
            <div className="py-2 px-3 rounded-lg text-sm leading-relaxed bg-white/5 rounded-tl-sm text-gray-200 min-w-[60px] flex items-center justify-center">
              <Loader2 className="animate-spin" size={16} />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

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
          className="bg-primary text-white w-9 h-9 rounded-md flex items-center justify-center transition-all hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed" 
          disabled={loading || !input.trim()}
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
};

export default ChatPanel;
