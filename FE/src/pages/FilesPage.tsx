import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import FileExplorer from '../components/FileExplorer';
import FileViewer from '../components/FileViewer';
import { useRepo } from '../contexts/RepoContext';
import { X, Menu } from 'lucide-react';

const FilesPage: React.FC = () => {
    const { data, loading } = useRepo();
    const navigate = useNavigate();
    const location = useLocation();
    
    // State
    const [selectedFile, setSelectedFile] = useState<string | null>(null);
    const [initialPath, setInitialPath] = useState<string>('');
    const [sidebarOpen, setSidebarOpen] = useState(true);

    // Handle navigation state (opening files/folders from chat)
    useEffect(() => {
        if (location.state?.filePath) {
            setSelectedFile(location.state.filePath);
            // If it's a file, we might want the explorer to be at its parent dir, 
            // but FileExplorer handles its own navigation usually.
            // setInitialPath(location.state.filePath); 
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

    if (loading || !data) return null;

    return (
        <div className="flex h-full w-full overflow-hidden relative bg-[#0a0a0c]">
            {/* Sidebar (Explorer) */}
            <div 
                className={`flex flex-col border-r border-white/10 bg-bg-card transition-all duration-300 relative z-20 ${
                    sidebarOpen ? 'w-80 translate-x-0' : 'w-0 -translate-x-full border-r-0 overflow-hidden'
                }`}
            >
                <FileExplorer 
                    data={data} 
                    onFileSelect={(file) => setSelectedFile(file.path)}
                    initialPath={initialPath}
                />
            </div>

            {/* Toggle Sidebar Button (when closed) */}
            {!sidebarOpen && (
                <button
                    onClick={() => setSidebarOpen(true)}
                    className="absolute top-4 left-4 z-30 p-2 bg-bg-card border border-white/10 rounded-md text-gray-400 hover:text-white"
                >
                    <Menu size={20} />
                </button>
            )}

             {/* Toggle Sidebar Button (when open - overlay on mobile or just header) */}
             {sidebarOpen && (
                <button 
                  onClick={() => setSidebarOpen(false)}
                  className="absolute top-3 right-3 z-30 md:hidden p-1 bg-black/50 text-white rounded"
                >
                  <X size={16} />
                </button>
             )}


            {/* Main Content (File Viewer) */}
            <div className="flex-1 flex flex-col h-full overflow-hidden relative">
                {selectedFile ? (
                    <FileViewer 
                        data={data} 
                        filePath={selectedFile} 
                        onClose={() => setSelectedFile(null)}
                        onQuote={(text) => { 
                            navigate('/chat', { state: { quotedCode: `\`\`\`${selectedFile}\n${text}\n\`\`\`` } });
                        }}
                    />
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500">
                        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                            <Menu size={32} />
                        </div>
                        <p>Select a file to view content</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FilesPage;
