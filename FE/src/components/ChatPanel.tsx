import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, Sparkles, AlertCircle, Pencil, Trash2, X, Check, MoreHorizontal, Copy, RefreshCw, Quote, PanelLeft } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github-dark.css';
import type { RepoAnalysis } from '../types';
import API_URL from '../config';

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
  onFirstMessage?: (message: string) => string | undefined; // Receives message, returns new session ID
  initialMessage?: string | null; // Message to send immediately on mount
  onClearInitialMessage?: () => void;
  isSidebarOpen?: boolean;
  onToggleSidebar?: () => void;
}



const MessageContent = React.memo(({ msg, onFileClick }: { msg: Message; onFileClick?: (path: string) => void }) => {
  return (
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
  );
});

const ChatPanel: React.FC<Props> = ({ data, onFileClick, externalQuote, onClearQuote, sessionId, onFirstMessage, initialMessage, onClearInitialMessage, isSidebarOpen, onToggleSidebar }) => {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<
    | { type: 'chat'; message: Message; text?: string } 
    | { type: 'file'; text: string } 
    | null
  >(null);
  const [selectionMenu, setSelectionMenu] = useState<{ x: number; y: number; text: string; messageId: string } | null>(null);
  
  // Ref to track if initial message has been processed (prevent double execution)
  const initialMessageProcessedRef = useRef(false);

  


  // Handle external quotes (e.g. from File Viewer)
  useEffect(() => {
    if (externalQuote) {
        setReplyingTo({ type: 'file', text: externalQuote });
        
        // Focus input
        const inputEl = document.querySelector('input[type="text"]') as HTMLInputElement;
        if (inputEl) inputEl.focus();

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

  // Handle initial message (from pending message after session creation)
  useEffect(() => {
    // Prevent double execution (e.g., from React StrictMode or race conditions)
    if (initialMessage && sessionId && !initialMessageProcessedRef.current) {
      initialMessageProcessedRef.current = true;
      
      // Create user message
      const userMsg: Message = {
        id: Date.now().toString(),
        role: 'user',
        content: initialMessage,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, userMsg]);
      
      // Clear the initial message in parent
      if (onClearInitialMessage) {
        onClearInitialMessage();
      }
      
      // Process the message
      processMessage(initialMessage, chatHistory);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialMessage, sessionId]);


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

  // Handle Text Selection
  useEffect(() => {
    const handleMouseUp = () => {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed || !selection.toString().trim()) {
        // We don't verify clearing here to allow clicking the button
        return;
      }

      const anchorNode = selection.anchorNode;
      if (!anchorNode) return;

      const element = anchorNode instanceof Element ? anchorNode : anchorNode.parentElement;
      const messageBubble = element?.closest('[data-message-id]');
      
      if (!messageBubble) {
        setSelectionMenu(null);
        return;
      }

      const messageId = messageBubble.getAttribute('data-message-id');
      if (!messageId) return;

      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();

      if (rect.width > 0) {
        setSelectionMenu({
            x: rect.left + (rect.width / 2),
            y: rect.top - 40, // Position above
            text: selection.toString(),
            messageId
        });
      }
    };

    const handleMouseDown = (e: MouseEvent) => {
        const target = e.target as Element;
        if (target.closest('.selection-menu-trigger')) return;
        setSelectionMenu(null);
    };

    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mousedown', handleMouseDown);

    return () => {
        document.removeEventListener('mouseup', handleMouseUp);
        document.removeEventListener('mousedown', handleMouseDown);
    };
  }, []);

  const handleQuoteReply = () => {
    if (!selectionMenu) return;
    const msg = messages.find(m => m.id === selectionMenu.messageId);
    if (msg) {
        setReplyingTo({ type: 'chat', message: msg, text: selectionMenu.text });
        setSelectionMenu(null);
        const inputEl = document.querySelector('input[type="text"]') as HTMLInputElement;
        if (inputEl) inputEl.focus();
    }
  };

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

    // If no session exists and we have the callback, create new session first
    if (!sessionId && onFirstMessage) {
      onFirstMessage(input.trim());
      // The parent will re-render with new sessionId, so we return here
      // The message will be passed back via initialMessage prop
      return;
    }

    let finalMessage = input.trim();
    
    // If replying, wrap the context
    if (replyingTo) {
        if (replyingTo.type === 'chat') {
            // Use selected text OR full message content
            const quotedText = replyingTo.text || replyingTo.message.content;
            const replyContext = `> **Replying to ${replyingTo.message.role === 'ai' ? 'AI' : 'User'}:**\n> "${quotedText}"\n\n`;
            finalMessage = `${replyContext}${finalMessage}`;
        } else {
             finalMessage = `I have a question about this code:\n${replyingTo.text}\n\n${finalMessage}`;
        }
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
    setReplyingTo({ type: 'chat', message: msg });
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

  const handleRegenerate = async (id: string) => {
    if (loading) return;

    const index = messages.findIndex(m => m.id === id);
    if (index === -1) return;

    // Verify it is an AI message
    const targetMsg = messages[index];
    if (targetMsg.role !== 'ai') return;
    
    // Verify preceding user message
    const promptMsg = messages[index - 1];
    if (!promptMsg || promptMsg.role !== 'user') {
      console.log('Regenerate cancelled: Preceding message is not User');
      return;
    }

    // Keep messages BEFORE this AI message
    const newMessages = messages.slice(0, index);
    setMessages(newMessages);

    // Rebuild history from remaining messages
    const newHistory: ChatHistory[] = newMessages
       .filter(m => !m.isError && m.id !== 'welcome')
       .map(m => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.content }));
    
    setChatHistory(newHistory);
    setActiveMenuId(null);

    console.log('Regenerating response for:', promptMsg.content.substring(0, 50));
    await processMessage(promptMsg.content, newHistory);
  };

  return (
    <div className="flex flex-col h-full bg-bg-card overflow-hidden">
      {/* Header */}
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/10 flex items-center gap-3 bg-gradient-to-r from-primary/10 to-transparent">
        {onToggleSidebar && (
            <button 
                onClick={onToggleSidebar}
                className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-md transition-colors"
                title={isSidebarOpen ? "Close Sidebar" : "Open Sidebar"}
            >
                <PanelLeft size={18} />
            </button>
        )}
        <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-primary" />
            <span className="text-sm font-medium text-white">AI Chat</span>
        </div>
        <span className="text-xs text-gray-400 ml-auto">Gemini 3 Flash</span>
      </div>



      {/* Messages */}
      <div 
        className="flex-1 p-4 overflow-y-auto flex flex-col gap-4 custom-scrollbar" 
        onScroll={() => setSelectionMenu(null)}
      >
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
                    <div className={`message-menu-dropdown absolute right-0 z-50 py-1 min-w-[140px] bg-[#1E1E24] border border-white/10 rounded-lg shadow-xl animate-in fade-in zoom-in-95 duration-100 overflow-hidden ${
                      index >= messages.length - 1 ? 'bottom-full mb-2 origin-bottom-right' : 'top-6 origin-top-right'
                    }`}>
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

                      {/* Regenerate Option (For ANY AI message) */}
                      {msg.role === 'ai' && (
                        <button
                          onClick={() => handleRegenerate(msg.id)}
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
                <MessageContent msg={msg} onFileClick={onFileClick} />
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
                  <span className="font-medium text-primary text-[10px] uppercase tracking-wider">
                    {replyingTo.type === 'chat' 
                        ? `Replying to ${replyingTo.message.role === 'ai' ? 'AI' : 'User'}`
                        : 'Referencing File'
                    }
                  </span>
                  <span className="truncate italic text-gray-300">
                    {replyingTo.type === 'chat'
                        ? (replyingTo.text ? `"${replyingTo.text}"` : replyingTo.message.content)
                        : replyingTo.text
                    }
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

      {/* Floating Selection Menu */}
      {selectionMenu && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleQuoteReply();
          }}
          className="selection-menu-trigger fixed z-50 transform -translate-x-1/2 px-3 py-1.5 bg-[#1E1E24] border border-white/10 text-white text-xs font-medium rounded-full shadow-xl flex items-center gap-2 hover:bg-primary hover:border-primary transition-all animate-in fade-in zoom-in-95 duration-200"
          style={{ left: selectionMenu.x, top: selectionMenu.y }}
        >
          <Quote size={12} />
          Reply
        </button>
      )}
    </div>
  );
};

export default ChatPanel;
