import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, Sparkles, AlertCircle, Pencil, Trash2, X, Check, MoreHorizontal, Copy, RefreshCw, Quote } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github-dark.css';
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
  onFileClick?: (path: string) => void;
  externalQuote?: string | null;
  onClearQuote?: () => void;
  sessionId?: string;
}

const API_URL = 'http://localhost:3001/api';

const ChatPanel: React.FC<Props> = ({ data, onFileClick, externalQuote, onClearQuote, sessionId }) => {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<{ message: Message; text?: string } | null>(null);

  
  const textareaRef = useRef<HTMLTextAreaElement>(null); // Added textareaRef

  // Handle external quotes (e.g. from File Viewer)
  useEffect(() => {
    if (externalQuote) {
       setInput(prev => {
          const prefix = prev.trim() ? prev + '\n\n' : '';
          return prefix + `I have a question about this code:\n${externalQuote}\n`;
       });
       if (textareaRef.current) {
         textareaRef.current.focus();
       }
       if (onClearQuote) {
         onClearQuote();
       }
    }
  }, [externalQuote, onClearQuote]);

  const storageKey = sessionId 
    ? `chat_session_${data.owner}_${data.name}_${sessionId}` 
    : `chat_history_${data.owner}_${data.name}`;

  const [chatHistory, setChatHistory] = useState<ChatHistory[]>(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        return JSON.parse(saved).chatHistory || [];
      } catch (error) {
        console.error('Failed to parse chat history:', error);
      }
    }
    return [];
  });

  const [messages, setMessages] = useState<Message[]>(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.messages.map((m: any) => ({
          ...m,
          timestamp: new Date(m.timestamp)
        }));
      } catch (error) {
        console.error('Failed to parse messages:', error);
      }
    }
    return [
      {
        id: 'welcome',
        role: 'ai',
        content: `👋 Hi! I'm powered by **Gemini AI**. I've analyzed **${data.name}** and I'm ready to help!\n\nAsk me anything about:\n• Code structure & quality\n• How to improve your scores\n• Best practices for this repo\n• Documentation suggestions`,
        timestamp: new Date()
      }
    ];
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify({
        messages,
        chatHistory
      }));
    } catch (error) {
      console.error('Failed to save chat history:', error);
    }
  }, [messages, chatHistory, storageKey]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);



  // Close menu when clicking outside
  useEffect(() => {
     const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (target.closest('.message-menu-trigger') || target.closest('.message-menu-dropdown')) {
        return;
      }
      setActiveMenuId(null);
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const sendMessageToAI = async (userMessage: string, currentHistory: ChatHistory[], onChunk: (chunk: string) => void): Promise<string> => {
    console.log('[Chat] Sending message to AI...', { length: userMessage.length, historySize: currentHistory.length });
    
    const repoContext = {
      name: data.name,
      owner: data.owner,
      readme: data.readme,
      overallScore: data.overallScore,
      breakdown: data.breakdown,
      insights: data.insights
    };

    try {
        const response = await fetch(`${API_URL}/chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: userMessage,
            repoContext,
            history: currentHistory
          })
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error('[Chat] API response not OK:', response.status, errorData);
          throw new Error(errorData.error || `Request failed with status ${response.status}`);
        }

        if (!response.body) {
            console.error('[Chat] Response has no body');
            throw new Error('No response body');
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullResponse = '';
        console.log('[Chat] Stream started');

        while (true) {
          const { done, value } = await reader.read();
          if (done) {
              console.log('[Chat] Stream complete');
              break;
          }
          
          const chunk = decoder.decode(value, { stream: true });
          // console.log('[Chat] Chunk received:', chunk.length); 
          fullResponse += chunk;
          onChunk(chunk);
        }

        return fullResponse;
    } catch (error) {
        console.error('[Chat] Error in sendMessageToAI:', error);
        throw error;
    }
  };

  const processMessage = async (messageText: string, updatedHistory: ChatHistory[]) => {
    if (!messageText.trim() || loading) return;

    console.log('[Chat] Processing message:', messageText.substring(0, 50) + '...');
    setLoading(true);

    let aiMsgId: string | null = null;
    let accumulatedResponse = '';

    try {
      const responseText = await sendMessageToAI(messageText, updatedHistory, (chunk) => {
        accumulatedResponse += chunk;
        
        if (!aiMsgId) {
          // First chunk received
          // console.log('[Chat] First chunk received, creating message');
          setLoading(false);
          aiMsgId = (Date.now() + 1).toString();
          const aiMsg: Message = {
            id: aiMsgId,
            role: 'ai',
            content: accumulatedResponse,
            timestamp: new Date()
          };
          setMessages(prev => [...prev, aiMsg]);
        } else {
          // Update existing
          setMessages(prev => prev.map(msg => 
            msg.id === aiMsgId ? { ...msg, content: accumulatedResponse } : msg
          ));
        }
      });

      if (!aiMsgId) {
        console.error('[Chat] Finished but no aiMsgId created. Response length:', accumulatedResponse.length);
        throw new Error('Received empty response from AI service');
      }
      
      console.log('[Chat] Message processed successfully');
      
      // Update chat history
      setChatHistory([...updatedHistory, 
        { role: 'user', content: messageText },
        { role: 'assistant', content: responseText }
      ]);
      
    } catch (err: any) {
      console.error('[Chat] processMessage error:', err);
      setLoading(false);
      
      const errorContent = `⚠️ Sorry, I encountered an error: ${err.message}. Please try again.`;
      
      if (aiMsgId) {
        setMessages(prev => prev.map(msg => 
          msg.id === aiMsgId 
            ? { ...msg, content: msg.content + '\n\n' + errorContent, isError: true } 
            : msg
        ));
      } else {
        const errorMsg: Message = {
          id: (Date.now() + 1).toString(),
          role: 'ai',
          content: errorContent,
          timestamp: new Date(),
          isError: true
        };
        setMessages(prev => [...prev, errorMsg]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    let finalMessage = input.trim();
    
    // If replying, wrap the context
    if (replyingTo) {
        // Use selected text OR full message content
        const quotedText = replyingTo.text || replyingTo.message.content;
        
        const replyContext = `> **Replying to ${replyingTo.message.role === 'ai' ? 'AI' : 'User'}:**\n> "${quotedText}"\n\n`;
        finalMessage = `${replyContext}${finalMessage}`;
    }

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: finalMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setReplyingTo(null); // Clear reply state
    
    // Pass current history
    await processMessage(finalMessage, chatHistory);
  };

  const handleReply = (msg: Message) => {
    setReplyingTo({ message: msg });
    setActiveMenuId(null);
    // Focus input
    const inputEl = document.querySelector('input[type="text"]') as HTMLInputElement;
    if (inputEl) inputEl.focus();
  };

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
    setActiveMenuId(null);
  };

// ... (handleDeleteMessage, handleStartEdit, handleCancelEdit, handleSubmitEdit, handleQuickAction, handleRegenerate unchanged)

  // NOTE: I'm skipping the middle parts to focus on the replacing the rendering part where the MENU is. 
  // Wait, I can't skip parts with replace_file_content unless I use multiple chunks or target specific blocks. 
  // I will just replace the WHOLE render map block and the input block.

  // ... skip ...

  // I will target the `handleSend` first, then I'll use another call for the menu and input to avoid massive context.
  // Actually, I'll do `handleSend` + `handleReply` + `handleCopy` block first.


  // Delete Message
  const handleDeleteMessage = (id: string) => {
    setMessages(prev => prev.filter(msg => msg.id !== id));
    // Note: We don't strictly sync chatHistory on delete to avoid complex mapping, 
    // unless we strictly rebuild it. For simple delete, removing from view is often enough.
    // However, for "Edit", strict rewind is needed.
    // Ideally, we should rebuild history from remaining messages.
    // Rebuilding history from messages state is safer:
    const remainingMessages = messages.filter(msg => msg.id !== id);
    const newHistory: ChatHistory[] = remainingMessages
       .filter(m => !m.isError && m.id !== 'welcome')
       .map(m => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.content }));
    setChatHistory(newHistory);
    setActiveMenuId(null);
  };

  // Edit Message
  const handleStartEdit = (msg: Message) => {
    setEditingMessageId(msg.id);
    setEditContent(msg.content);
    setActiveMenuId(null);
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditContent('');
  };

  const handleSubmitEdit = async (id: string) => {
    if (!editContent.trim()) return;
    
    // Find index of message
    const index = messages.findIndex(m => m.id === id);
    if (index === -1) return;

    // Keep everything BEFORE this message
    const keptMessages = messages.slice(0, index);
    
    // Create new edited message
    const newMsg: Message = {
      id: Date.now().toString(), // New ID
      role: 'user',
      content: editContent,
      timestamp: new Date() // New timestamp
    };

    // Update state to rewind
    setMessages([...keptMessages, newMsg]);
    setEditingMessageId(null);
    setEditContent('');

    // Rebuild history from kept messages
    const keptHistory: ChatHistory[] = keptMessages
      .filter(m => !m.isError && m.id !== 'welcome')
      .map(m => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.content }));
    
    setChatHistory(keptHistory);

    // Process new message
    await processMessage(editContent, keptHistory);
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

  const handleRegenerate = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    
    // Debugging logs
    console.log('Regenerate clicked');
    if (loading) {
      console.log('Regenerate blocked: Loading is true');
      return;
    }

    const lastMsgIndex = messages.length - 1;
    const lastMsg = messages[lastMsgIndex];
    console.log('Last message:', lastMsg);

    if (!lastMsg || lastMsg.role !== 'ai') {
      console.log('Regenerate cancelled: Last message is not AI or missing');
      return;
    }
    
    const lastUserMsgIndex = messages.length - 2;
    const lastUserMsg = messages[lastUserMsgIndex];
    console.log('Last user message:', lastUserMsg);
    
    // Safety check: must have a preceding user message
    if (!lastUserMsg || lastUserMsg.role !== 'user') {
      console.log('Regenerate cancelled: Preceding message is not User');
      return;
    }

    // Remove the last AI message
    const newMessages = messages.slice(0, -1);
    setMessages(newMessages);

    // Revert history
    const newHistory = chatHistory.slice(0, -2); 
    setChatHistory(newHistory);
    setActiveMenuId(null);

    console.log('Processing regeneration for content:', lastUserMsg.content.substring(0, 50));
    // Process again with the same user message content
    await processMessage(lastUserMsg.content, newHistory);
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
        {messages.map((msg, index) => (
          <div key={msg.id} className={`group flex gap-3 max-w-[90%] ${msg.role === 'user' ? 'self-end flex-row-reverse' : 'self-start'}`}>
            {/* Avatar */}
            <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
              msg.role === 'ai' 
                ? msg.isError 
                  ? 'bg-red-500/20 text-red-400' 
                  : 'bg-primary/20 text-primary' 
                : 'bg-success/20 text-success'
            }`}>
              {msg.role === 'ai' ? (msg.isError ? <AlertCircle size={16} /> : <Bot size={16} />) : <User size={16} />}
            </div>

            {/* Bubble */}
            <div 
              data-message-id={msg.id}
              className={`relative py-2 px-3 rounded-lg text-sm leading-relaxed ${
              msg.role === 'ai' 
                ? msg.isError
                  ? 'bg-red-500/10 border border-red-500/20 rounded-tl-sm text-red-200'
                  : 'bg-white/5 rounded-tl-sm text-gray-200' 
                : 'bg-primary text-white rounded-tr-sm'
            } pr-8`}
            >
              
              {/* Menu Trigger (Visible on Hover or Active) */}
              {!editingMessageId && !loading && (
                <div className="absolute top-1 right-1 z-10">
                   <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveMenuId(activeMenuId === msg.id ? null : msg.id);
                    }}
                    className={`message-menu-trigger p-1 rounded-full transition-all ${
                      activeMenuId === msg.id 
                        ? 'bg-black/40 text-white opacity-100' 
                        : 'text-white/50 hover:text-white hover:bg-black/20 opacity-0 group-hover:opacity-100'
                    }`}
                  >
                    <MoreHorizontal size={14} />
                  </button>

                  {/* Dropdown Menu */}
                  {activeMenuId === msg.id && (
                    <div className="message-menu-dropdown absolute top-6 right-0 z-50 py-1 min-w-[140px] bg-[#1E1E24] border border-white/10 rounded-lg shadow-xl animate-in fade-in zoom-in-95 duration-100 overflow-hidden">
                       <button
                        onClick={() => handleReply(msg)}
                        className="w-full px-3 py-2 text-left text-xs text-gray-300 hover:text-white hover:bg-white/5 flex items-center gap-2"
                      >
                        <Quote size={12} />
                        Reply
                      </button>

                       <button
                        onClick={() => handleCopy(msg.content)}
                        className="w-full px-3 py-2 text-left text-xs text-gray-300 hover:text-white hover:bg-white/5 flex items-center gap-2"
                      >
                        <Copy size={12} />
                        Copy
                      </button>

                      {/* Regenerate Option (Only for last AI message) */}
                      {msg.role === 'ai' && index === messages.length - 1 && (
                        <button
                          onClick={handleRegenerate}
                          className="w-full px-3 py-2 text-left text-xs text-gray-300 hover:text-white hover:bg-white/5 flex items-center gap-2"
                        >
                          <RefreshCw size={12} />
                          Regenerate
                        </button>
                      )}
                      
                      {msg.role === 'user' && (
                        <button
                          onClick={() => handleStartEdit(msg)}
                          className="w-full px-3 py-2 text-left text-xs text-gray-300 hover:text-white hover:bg-white/5 flex items-center gap-2"
                        >
                          <Pencil size={12} />
                          Edit
                        </button>
                      )}
                      
                      <div className="h-[1px] bg-white/5 my-1" />
                      
                      <button
                        onClick={() => handleDeleteMessage(msg.id)}
                        className="w-full px-3 py-2 text-left text-xs text-red-400 hover:text-red-300 hover:bg-white/5 flex items-center gap-2"
                      >
                        <Trash2 size={12} />
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Message Content */}
              {editingMessageId === msg.id ? (
                <div className="flex flex-col gap-2 min-w-[200px]">
                   <textarea 
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="bg-black/20 text-white rounded p-1 whitespace-pre-wrap outline-none resize-none"
                    autoFocus
                    rows={3}
                  />
                  <div className="flex items-center gap-2 justify-end">
                    <button onClick={handleCancelEdit} className="p-1 hover:bg-white/10 rounded cursor-pointer text-white/70 hover:text-white">
                      <X size={14} />
                    </button>
                    <button onClick={() => handleSubmitEdit(msg.id)} className="p-1 bg-white/20 hover:bg-white/30 rounded cursor-pointer text-white">
                      <Check size={14} />
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="whitespace-normal break-words min-w-0">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      rehypePlugins={[rehypeHighlight]}
                      components={{
                        h1: ({node, ...props}) => <h1 className="text-xl font-bold mb-2 break-words" {...props} />,
                        h2: ({node, ...props}) => <h2 className="text-lg font-bold mb-2 break-words" {...props} />,
                        h3: ({node, ...props}) => <h3 className="text-md font-bold mb-1 break-words" {...props} />,
                        p: ({node, ...props}) => <p className="mb-2 leading-relaxed break-words" {...props} />,
                        ul: ({node, ...props}) => <ul className="list-disc ml-4 mb-2" {...props} />,
                        ol: ({node, ...props}) => <ol className="list-decimal ml-4 mb-2" {...props} />,
                        li: ({node, ...props}) => <li className="mb-1" {...props} />,
                        a: ({node, ...props}) => <a className={`hover:underline break-all ${msg.role === 'user' ? 'text-white underline decoration-white/50' : 'text-primary'}`} target="_blank" rel="noopener noreferrer" {...props} />,
                        code: ({node, className, children, ...props}: any) => {
                          const match = /language-(\w+)/.exec(className || '');
                          const isInline = !match && !className?.includes('hljs');
                          const content = String(children).replace(/\n$/, '');
                          
                          // Improved path detection:
                          // 1. Matches alphanumeric, dot, slash, underscore, hyphen
                          // 2. Must not have spaces
                          // 3. Must check if it looks like a path (contains / or .)
                          const isPathLike = isInline && 
                                           !content.includes(' ') && 
                                           /^[\w\-\./\\]+$/.test(content) &&
                                           (content.includes('/') || content.includes('\\') || content.includes('.'));

                          if (isPathLike && onFileClick) {
                              const isPotentialFile = /\.[a-zA-Z0-9]+$/.test(content);
                              
                              return (
                                <code 
                                  className={`bg-primary/20 px-1 py-0.5 rounded text-xs break-all text-primary cursor-pointer hover:underline hover:bg-primary/30 transition-colors`} 
                                  onClick={() => onFileClick(content)}
                                  title={isPotentialFile ? "Open File" : "Open Folder"}
                                  {...props}
                                >
                                  {children}
                                </code>
                              );
                          }

                          return isInline ? 
                            <code className={`bg-black/20 px-1 py-0.5 rounded text-xs break-all ${msg.role === 'user' ? 'text-white' : 'text-primary'}`} {...props}>{children}</code> :
                            <code className={`${className} block bg-black/30 p-2 rounded-md text-sm my-2 text-wrap`} {...props}>{children}</code>
                        },
                        pre: ({node, ...props}) => <pre className="my-2 p-0 bg-transparent rounded-lg overflow-x-auto max-w-full" {...props} />,
                      }}
                    >
                      {msg.content}
                    </ReactMarkdown>
                  </div>
                  <span className="block text-[10px] mt-1 opacity-60 text-right">
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </>
              )}
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

      {/* Reply Preview */}
      {replyingTo && (
        <div className="px-4 py-2 bg-[#16161acc] border-t border-white/10 flex items-center justify-between animate-in slide-in-from-bottom-2">
            <div className="flex items-center gap-2 text-xs text-gray-400 overflow-hidden w-full">
                <Quote size={12} className="shrink-0" />
                <div className="flex flex-col overflow-hidden w-full">
                  <span className="font-medium text-primary text-[10px] uppercase tracking-wider">Replying to {replyingTo.message.role === 'ai' ? 'AI' : 'User'}</span>
                  <span className="truncate italic text-gray-300">
                    {replyingTo.text ? `"${replyingTo.text}"` : replyingTo.message.content}
                  </span>
                </div>
            </div>
             <button onClick={() => setReplyingTo(null)} className="text-gray-500 hover:text-white p-1 ml-2 shrink-0">
                <X size={14} />
            </button>
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
