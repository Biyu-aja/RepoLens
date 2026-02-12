import React, { useState, useEffect } from 'react';
import { useRepo } from '../contexts/RepoContext';
import ChatPanel from '../components/ChatPanel';
import { Plus, MessageSquare, Trash2, Pencil, Check, X } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

interface ChatSession {
  id: string;
  title: string;
  timestamp: string;
}

const ChatPage: React.FC = () => {
  const { data, loading } = useRepo();
  const navigate = useNavigate();
  const location = useLocation();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  // Edit State
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  // State from navigation (e.g. Quoted Code)
  const [externalQuote, setExternalQuote] = useState<string | null>(null);
  
  // Pending message when creating a new session from chat input
  const [pendingMessage, setPendingMessage] = useState<string | null>(null);

  useEffect(() => {
    if (location.state?.quotedCode) {
      setExternalQuote(location.state.quotedCode);
      // Clear state so it doesn't persist on reload/navigation
      window.history.replaceState({}, document.title);
      
      // If no session, create one? Or just define current as default?
      // For now, let's auto-create a session if none exists or just use the current one.
    }
  }, [location.state]);

  useEffect(() => {
    if (!loading && !data) {
      navigate('/');
    }
  }, [loading, data, navigate]);

  // Load sessions
  useEffect(() => {
    if (!data) return;
    const key = `chat_sessions_${data.owner}_${data.name}`;
    const stored = localStorage.getItem(key);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setSessions(parsed);
        // Default to most recent session if available and none selected
        if (parsed.length > 0 && !currentSessionId) {
             setCurrentSessionId(parsed[0].id);
        }
      } catch (e) {
        console.error('Failed to parse sessions', e);
      }
    }
  }, [data, currentSessionId]);

  // Helper to check if a session is empty (only welcome message or no messages)
  const isSessionEmpty = (sessionId: string): boolean => {
    if (!data) return true;
    const sessionKey = `chat_session_${data.owner}_${data.name}_${sessionId}`;
    const stored = localStorage.getItem(sessionKey);
    if (!stored) return true;
    
    try {
      const parsed = JSON.parse(stored);
      // Empty if no messages or only welcome message
      if (!parsed.messages || parsed.messages.length === 0) return true;
      if (parsed.messages.length === 1 && parsed.messages[0].id === 'welcome') return true;
      return false;
    } catch {
      return true;
    }
  };

  const createNewSession = () => {
    if (!data) return;
    
    // If current session is empty, just stay on it (no need to create new)
    if (currentSessionId && isSessionEmpty(currentSessionId)) {
      // Optionally scroll to top or show a message
      return;
    }
    
    // Check if there's any existing empty session, use that instead
    const emptySession = sessions.find(s => isSessionEmpty(s.id));
    if (emptySession) {
      setCurrentSessionId(emptySession.id);
      return;
    }
    
    const newId = Date.now().toString();
    const newSession: ChatSession = {
      id: newId,
      title: `Chat ${new Date().toLocaleTimeString()}`, // Simple title
      timestamp: new Date().toISOString()
    };

    const newSessions = [newSession, ...sessions];
    setSessions(newSessions);
    setCurrentSessionId(newId);
    
    // Save
    const key = `chat_sessions_${data.owner}_${data.name}`;
    localStorage.setItem(key, JSON.stringify(newSessions));
  };

  // Called when user sends first message without an active session
  const handleFirstMessage = (message: string): string | undefined => {
    if (!data) return undefined;
    
    const newId = Date.now().toString();
    const newSession: ChatSession = {
      id: newId,
      title: `Chat ${new Date().toLocaleTimeString()}`,
      timestamp: new Date().toISOString()
    };

    const newSessions = [newSession, ...sessions];
    setSessions(newSessions);
    setCurrentSessionId(newId);
    setPendingMessage(message); // Store the message to be sent after re-mount
    
    // Save session list
    const key = `chat_sessions_${data.owner}_${data.name}`;
    localStorage.setItem(key, JSON.stringify(newSessions));
    
    return newId;
  };

  const deleteSession = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!data) return;
    
    const newSessions = sessions.filter(s => s.id !== id);
    setSessions(newSessions);
    
    // Update local storage for index
    const key = `chat_sessions_${data.owner}_${data.name}`;
    localStorage.setItem(key, JSON.stringify(newSessions));
    
    // Remove actual chat content
    localStorage.removeItem(`chat_session_${data.owner}_${data.name}_${id}`);

    // If deleting current, switch to another
    if (currentSessionId === id) {
        setCurrentSessionId(newSessions.length > 0 ? newSessions[0].id : null);
    }
  };

  // Edit Handlers
  const startEdit = (e: React.MouseEvent, session: ChatSession) => {
    e.stopPropagation();
    setEditingSessionId(session.id);
    setEditTitle(session.title);
  };

  const cancelEdit = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setEditingSessionId(null);
    setEditTitle('');
  };

  const saveEdit = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!data || !editingSessionId || !editTitle.trim()) return;

    const newSessions = sessions.map(s => 
      s.id === editingSessionId ? { ...s, title: editTitle.trim() } : s
    );
    setSessions(newSessions);

    // Save
    const key = `chat_sessions_${data.owner}_${data.name}`;
    localStorage.setItem(key, JSON.stringify(newSessions));

    setEditingSessionId(null);
    setEditTitle('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      saveEdit();
    } else if (e.key === 'Escape') {
      cancelEdit();
    }
  };

  if (loading || !data) return null;

  return (
    <div className="flex h-full w-full overflow-hidden relative">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/50 z-20 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sessions Sidebar */}
      <div 
        className={`fixed md:relative inset-y-0 left-0 bg-bg-card border-r border-white/10 flex flex-col shrink-0 z-30 transition-all duration-300 overflow-hidden items-center ${
            sidebarOpen ? 'w-64 translate-x-0 items-stretch' : 'w-0 -translate-x-full md:translate-x-0 md:w-0 md:border-r-0'
        }`}
      >
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
             <span className="text-sm font-medium text-gray-300 truncate">Previous Chats</span>
             <button 
                onClick={createNewSession} 
                className="p-1.5 bg-primary/20 text-primary rounded-md hover:bg-primary/30 transition-colors"
                title="New Chat"
             >
                <Plus size={16} />
             </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-1 custom-scrollbar">
            {sessions.length === 0 && (
                <div className="text-center py-8 text-gray-500 text-sm">
                    No history found.<br/>Start a new chat!
                </div>
            )}
            {sessions.map(session => (
                <div
                    key={session.id}
                    onClick={() => {
                        if (editingSessionId !== session.id) {
                            setCurrentSessionId(session.id);
                            // Close sidebar on mobile when selecting
                            if (window.innerWidth < 768) setSidebarOpen(false);
                        }
                    }}
                    className={`group flex items-center gap-3 px-3 py-3 rounded-md cursor-pointer transition-colors ${
                        currentSessionId === session.id 
                            ? 'bg-white/10 text-white' 
                            : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                >
                    <MessageSquare size={16} className={`shrink-0 ${currentSessionId === session.id ? 'text-primary' : ''}`} />
                    
                    <div className="flex-1 min-w-0">
                        {editingSessionId === session.id ? (
                            <input 
                                type="text" 
                                value={editTitle} 
                                onChange={(e) => setEditTitle(e.target.value)}
                                onKeyDown={handleKeyDown}
                                onClick={(e) => e.stopPropagation()}
                                className="w-full bg-black/40 text-xs px-2 py-1 rounded border border-primary/50 text-white outline-none focus:border-primary"
                                autoFocus
                            />
                        ) : (
                            <>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm truncate font-medium" title={session.title}>{session.title}</span>
                                    {isSessionEmpty(session.id) && (
                                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-primary/20 text-primary font-medium">
                                            New
                                        </span>
                                    )}
                                </div>
                                <div className="text-[10px] text-gray-500">{new Date(session.timestamp).toLocaleDateString()}</div>
                            </>
                        )}
                    </div>
                    
                    {/* Actions */}
                    <div className="flex items-center gap-1">
                        {editingSessionId === session.id ? (
                            <>
                                <button
                                    onClick={saveEdit}
                                    className="p-1 text-success hover:bg-success/10 rounded"
                                    title="Save"
                                >
                                    <Check size={14} />
                                </button>
                                <button
                                    onClick={cancelEdit}
                                    className="p-1 text-gray-400 hover:text-white hover:bg-white/10 rounded"
                                    title="Cancel"
                                >
                                    <X size={14} />
                                </button>
                            </>
                        ) : (
                            <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={(e) => startEdit(e, session)}
                                    className="p-1 text-gray-500 hover:text-primary transition-colors"
                                    title="Edit Title"
                                >
                                    <Pencil size={14} />
                                </button>
                                <button
                                    onClick={(e) => deleteSession(e, session.id)}
                                    className="p-1 text-gray-500 hover:text-red-400 transition-colors"
                                    title="Delete Chat"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-bg-card relative">
          {/* Key ensures ChatPanel re-mounts when session changes */}
          <ChatPanel 
            key={currentSessionId || 'default'} 
            data={data} 
            sessionId={currentSessionId || undefined} 
            externalQuote={externalQuote}
            onClearQuote={() => setExternalQuote(null)}
            onFirstMessage={handleFirstMessage}
            initialMessage={pendingMessage}
            onClearInitialMessage={() => setPendingMessage(null)}
            isSidebarOpen={sidebarOpen}
            onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
            onFileClick={(path) => {
               // Simple heuristic: if it has an extension, it's a file. Else folder.
               const hasExtension = /\.[a-zA-Z0-9]+$/.test(path);
               if (hasExtension) {
                   navigate('/files', { state: { filePath: path } });
               } else {
                   navigate('/files', { state: { folderPath: path } });
               }
            }}
          />
      </div>
    </div>
  );
};

export default ChatPage;
