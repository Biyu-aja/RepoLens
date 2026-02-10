import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import FileExplorer from '../components/FileExplorer';
import FileViewer from '../components/FileViewer';
import ChatPanel from '../components/ChatPanel';
import { useRepo } from '../contexts/RepoContext';
import { X, Menu, MessageSquare, Plus, Trash2, ChevronRight, ArrowLeft, Sparkles, Pencil, Check, FolderOpen } from 'lucide-react';

interface ChatSession {
  id: string;
  title: string;
  timestamp: string;
}

const FilesPage: React.FC = () => {
    const { data, loading } = useRepo();
    const location = useLocation();
    
    // Layout State
    const [leftSidebarOpen, setLeftSidebarOpen] = useState(true);
    const [rightSidebarOpen, setRightSidebarOpen] = useState(true);
    const [chatWidth, setChatWidth] = useState(400); // Default width
    const [isResizing, setIsResizing] = useState(false);

    // Resize Handler
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isResizing) return;
            const newWidth = window.innerWidth - e.clientX;
            // Min width 300, max width 800
            if (newWidth >= 300 && newWidth <= 800) {
                setChatWidth(newWidth);
            }
        };

        const handleMouseUp = () => {
            setIsResizing(false);
            document.body.style.cursor = 'default';
        };

        if (isResizing) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = 'col-resize';
        }

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = 'default';
        };
    }, [isResizing]);

    // File State
    const [selectedFile, setSelectedFile] = useState<string | null>(null);
    const [initialPath, setInitialPath] = useState<string>('');

    // Chat State
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
    const [externalQuote, setExternalQuote] = useState<string | null>(null);
    
    // Edit State
    const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
    const [editTitle, setEditTitle] = useState('');

    // Handle navigation state (opening files/folders from chat/other pages)
    useEffect(() => {
        if (location.state?.filePath) {
            setSelectedFile(location.state.filePath);
            // Open explorer at parent folder
            const parts = location.state.filePath.split('/');
            parts.pop(); // Remove filename
            if (parts.length > 0) {
                 setInitialPath(parts.join('/'));
            } else {
                 setInitialPath('');
            }
        }
        if (location.state?.folderPath) {
            setInitialPath(location.state.folderPath);
            setSelectedFile(null);
        }
        
        // Clear state
        if (location.state?.filePath || location.state?.folderPath) {
             window.history.replaceState({}, document.title);
        }
    }, [location.state]);

    // Load Chat Sessions
    useEffect(() => {
        if (!data) return;
        const key = `chat_sessions_${data.owner}_${data.name}`;
        const stored = localStorage.getItem(key);
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                setSessions(parsed);
                // We default to NO session selected to show the list first, unless we want to auto-open last
                // Let's stick to list view by default for Files Page
            } catch (e) {
                console.error('Failed to parse sessions', e);
            }
        }
    }, [data]);

    const createNewSession = () => {
        if (!data) return;
        const newId = Date.now().toString();
        const newSession: ChatSession = {
            id: newId,
            title: `Chat ${new Date().toLocaleTimeString()}`,
            timestamp: new Date().toISOString()
        };

        const newSessions = [newSession, ...sessions];
        setSessions(newSessions);
        setCurrentSessionId(newId);
        
        const key = `chat_sessions_${data.owner}_${data.name}`;
        localStorage.setItem(key, JSON.stringify(newSessions));
    };

    const deleteSession = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (!data) return;
        
        const newSessions = sessions.filter(s => s.id !== id);
        setSessions(newSessions);
        
        const key = `chat_sessions_${data.owner}_${data.name}`;
        localStorage.setItem(key, JSON.stringify(newSessions));
        
        localStorage.removeItem(`chat_session_${data.owner}_${data.name}_${id}`);

        if (currentSessionId === id) {
            setCurrentSessionId(null);
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
        setSessions(newSessions); // Optimistic update

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

    const handleQuote = (text: string) => {
        if (!selectedFile) return;
        
        const code = `\`\`\`${selectedFile}\n${text}\n\`\`\``;
        setExternalQuote(code);
        setRightSidebarOpen(true);
        
        // If no session active, create one or pick most recent?
        // If we have sessions, maybe just pick the first one?
        // But users might want to continue a specific one.
        // For smoother UX, let's create a NEW one if none is selected, or use the current one.
        if (!currentSessionId) {
            if (sessions.length > 0) {
                 setCurrentSessionId(sessions[0].id);
            } else {
                 createNewSession();
            }
        }
    };

    if (loading || !data) return null;

    return (
        <div className="flex h-full w-full overflow-hidden relative bg-[#0a0a0c]">
            {/* LEFT SIDEBAR (Explorer) */}
            <div 
                className={`flex flex-col border-r border-white/10 bg-bg-card transition-all duration-300 relative z-20 ${
                    leftSidebarOpen ? 'w-80 translate-x-0' : 'w-0 -translate-x-full border-r-0 overflow-hidden'
                }`}
            >
                <div className="flex-1 overflow-hidden">
                    <FileExplorer 
                        data={data} 
                        onFileSelect={(file) => setSelectedFile(file.path)}
                        initialPath={initialPath}
                        selectedPath={selectedFile}
                    />
                </div>
            </div>

            {/* Toggle Left Sidebar Button (when closed) */}
            {!leftSidebarOpen && (
                <button
                    onClick={() => setLeftSidebarOpen(true)}
                    className="absolute top-4 left-4 z-30 p-2 bg-bg-card border border-white/10 rounded-md text-gray-400 hover:text-white"
                >
                    <Menu size={20} />
                </button>
            )}

             {/* Toggle Left Sidebar Button (when open - overlay on mobile or just header) */}
             {leftSidebarOpen && (
                <button 
                  onClick={() => setLeftSidebarOpen(false)}
                  className="absolute top-3 right-3 z-30 md:hidden p-1 bg-black/50 text-white rounded"
                >
                  <X size={16} />
                </button>
             )}


            {/* MAIN CONTENT (File Viewer) */}
            <div className="flex-1 flex flex-col h-full overflow-hidden relative min-w-0">
                 {/* Top Bar for View Controls? Maybe not needed */}
                {selectedFile && /\.[a-zA-Z0-9]+$/.test(selectedFile) ? (
                    <FileViewer 
                        data={data} 
                        filePath={selectedFile} 
                        onClose={() => setSelectedFile(null)}
                        onQuote={handleQuote}
                    />
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500">
                        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                            {selectedFile ? <FolderOpen size={32} /> : <Menu size={32} />}
                        </div>
                        {selectedFile ? (
                           <div className="text-center">
                                <p className="text-lg font-medium text-gray-300">{selectedFile}</p>
                                <p className="text-sm opacity-60 mt-1">Folder selected. Expand in explorer to view files.</p>
                           </div>
                        ) : (
                           <p>Select a file to view content</p>
                        )}
                    </div>
                )}
            </div>

            {/* RIGHT SIDEBAR (Chat) */}
             <div 
                className={`flex flex-col border-l border-white/10 bg-bg-card absolute right-0 top-0 bottom-0 z-40 shadow-2xl ${
                    isResizing ? '' : 'transition-transform duration-300 ease-in-out'
                } ${
                    rightSidebarOpen ? 'translate-x-0' : 'translate-x-full'
                }`}
                style={{ width: chatWidth }}
            >
                {/* Resize Handle */}
                {rightSidebarOpen && (
                    <div 
                        className="absolute top-0 bottom-0 -left-1 w-2 z-50 cursor-col-resize hover:bg-primary/50 transition-colors"
                        onMouseDown={() => setIsResizing(true)}
                    />
                )}
                {/* Toggle Right Sidebar Button (Absolute on the left of the sidebar) */}
                <button 
                    className={`absolute top-1/2 z-[60] flex items-center justify-center transition-all shadow-xl ${
                        rightSidebarOpen 
                            ? '-left-4 w-4 h-12 rounded-l-md bg-bg-card border border-white/10 border-r-0 text-gray-400 hover:text-white hover:bg-white/5' 
                            : '-left-12 w-12 h-12 rounded-l-xl bg-primary text-white hover:brightness-110 shadow-[0_0_20px_rgba(99,102,241,0.3)]'
                    }`}
                    onClick={() => setRightSidebarOpen(!rightSidebarOpen)}
                    style={{ transform: 'translateY(-50%)' }}
                    title={rightSidebarOpen ? "Close Chat" : "Ask AI"}
                >
                    {rightSidebarOpen ? (
                        <ChevronRight size={14} />
                    ) : (
                        <Sparkles size={24} />
                    )}
                </button>

                {/* Right Sidebar Content */}
                {rightSidebarOpen && (
                    <div className="flex flex-col h-full w-full overflow-hidden">
                        
                        {/* VIEW 1: Session List (Select Feature) */}
                        {!currentSessionId && (
                            <div className="flex flex-col h-full">
                                <div className="p-4 border-b border-white/10 flex items-center justify-between">
                                    <span className="font-medium text-gray-200">Chat Sessions</span>
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
                                            No recent chats.<br/>
                                            Select a file and quote code<br/>or start a new chat.
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
                                            className="group flex items-center gap-3 px-3 py-3 rounded-md cursor-pointer transition-colors text-gray-400 hover:text-white hover:bg-white/5"
                                        >
                                            <MessageSquare size={16} className="shrink-0" />
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
                                                        <div className="text-[10px] text-gray-500 text-left">{new Date(session.timestamp).toLocaleDateString()}</div>
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
                        )}

                        {/* VIEW 2: Active Chat Panel */}
                        {currentSessionId && (
                            <div className="flex flex-col h-full">
                                <div className="p-2 border-b border-white/10 flex items-center gap-2">
                                    <button 
                                        onClick={() => {
                                            setCurrentSessionId(null);
                                            setExternalQuote(null);
                                        }}
                                        className="p-1.5 text-gray-400 hover:text-white hover:bg-white/5 rounded-md transition-colors"
                                        title="Back to Sessions"
                                    >
                                        <ArrowLeft size={16} />
                                    </button>
                                    <span className="text-sm font-medium text-gray-300 truncate">
                                        {sessions.find(s => s.id === currentSessionId)?.title || 'Chat'}
                                    </span>
                                </div>
                                <div className="flex-1 overflow-hidden">
                                     <ChatPanel 
                                        key={currentSessionId} // Remount on session change
                                        data={data} 
                                        sessionId={currentSessionId}
                                        externalQuote={externalQuote}
                                        onClearQuote={() => setExternalQuote(null)}
                                        onFileClick={(path) => {
                                            // Handle file clicks from chat
                                            // Ensure we are viewing that file
                                            setSelectedFile(path);
                                        }}
                                     />
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
            


        </div>
    );
};

export default FilesPage;
