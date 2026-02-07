import React, { useState, useEffect } from 'react';
import { useRepo } from '../contexts/RepoContext';
import ChatPanel from '../components/ChatPanel';
import { Plus, MessageSquare, Trash2, ChevronLeft, ChevronRight, Pencil, Check, X } from 'lucide-react';
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

  const createNewSession = () => {
    if (!data) return;
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
      {/* Sessions Sidebar */}
      <div 
        className={`relative flex flex-col shrink-0 z-20 bg-bg-card border-r border-white/10 transition-all duration-300 ${
            sidebarOpen ? 'w-64' : 'w-0 border-r-0'
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
                                <div className="text-sm truncate font-medium" title={session.title}>{session.title}</div>
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

       {/* Toggle Button (Absolute) */}
       <button 
          className={`absolute top-4 z-30 w-8 h-8 flex items-center justify-center bg-bg-card border border-white/10 rounded-full shadow-lg text-gray-400 hover:text-white transition-all ${
             sidebarOpen ? 'left-60' : 'left-4'
          }`}
          onClick={() => setSidebarOpen(!sidebarOpen)}
       >
          {sidebarOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
       </button>


      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-bg-card relative">
          {/* Key ensures ChatPanel re-mounts when session changes */}
          <ChatPanel 
            key={currentSessionId || 'default'} 
            data={data} 
            sessionId={currentSessionId || undefined} 
            externalQuote={externalQuote}
            onClearQuote={() => setExternalQuote(null)}
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
