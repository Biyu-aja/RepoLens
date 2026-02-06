import React, { useState, useEffect } from 'react';
import { Folder, FileText, ChevronLeft, Loader2, FileCode, Image as ImageIcon } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github-dark.css';
import type { RepoAnalysis } from '../types';

interface FileItem {
    name: string;
    path: string;
    type: 'file' | 'dir';
    size: number;
    url: string;
}

interface Props {
    data: RepoAnalysis;
    onFileSelect?: (file: FileItem) => void;
    initialPath?: string;
}

const API_URL = 'http://localhost:3001/api';

const FileExplorer: React.FC<Props> = ({ data, onFileSelect, initialPath = '' }) => {
    const [currentPath, setCurrentPath] = useState(initialPath);
    const [files, setFiles] = useState<FileItem[]>([]);
    const [fileContent, setFileContent] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Fetch directory listing
    const fetchDirectory = async (path: string) => {
        setLoading(true);
        setError(null);
        setFileContent(null);
        try {
            const response = await fetch(`${API_URL}/files/content`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    owner: data.owner,
                    repo: data.name,
                    path
                })
            });

            if (!response.ok) throw new Error('Failed to fetch content');

            const result = await response.json();
            
            if (Array.isArray(result)) {
                // Sort: Directories first, then files
                const sorted = result.sort((a, b) => {
                    if (a.type === b.type) return a.name.localeCompare(b.name);
                    return a.type === 'dir' ? -1 : 1;
                });
                setFiles(sorted);
            } else {
                throw new Error('Expected directory listing');
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Fetch file content
    const fetchFile = async (path: string) => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`${API_URL}/files/content`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    owner: data.owner,
                    repo: data.name,
                    path
                })
            });

            if (!response.ok) throw new Error('Failed to fetch file');

            const result = await response.json();
            
            if (result.content !== undefined) {
                setFileContent(result.content);
            } else {
                throw new Error('File content not found');
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Initial load & path updates
    useEffect(() => {
        fetchDirectory(currentPath);
    }, [currentPath]);

    useEffect(() => {
        if (initialPath && initialPath !== currentPath) {
             setCurrentPath(initialPath);
        }
    }, [initialPath]);

    const handleNavigate = (item: FileItem) => {
        if (item.type === 'dir') {
            const newPath = item.path;
            setCurrentPath(newPath);
            fetchDirectory(newPath);
        } else {
            if (onFileSelect) {
                onFileSelect(item);
            } else {
                setCurrentPath(item.path);
                fetchFile(item.path);
            }
        }
    };

    const handleGoBack = () => {
        if (fileContent) {
             // If viewing file, go back to current directory content
             // currentPath is the file path: "src/components/App.tsx"
             // We want "src/components"
             const parentPath = currentPath.split('/').slice(0, -1).join('/');
             setCurrentPath(parentPath);
             setFileContent(null);
             fetchDirectory(parentPath);
        } else {
            // If viewing dir, go up one level
            if (!currentPath) return;
            const parentPath = currentPath.split('/').slice(0, -1).join('/');
            setCurrentPath(parentPath);
            fetchDirectory(parentPath);
        }
    };

    // Helper to determine file icon
    const getFileIcon = (name: string) => {
        if (name.endsWith('.ts') || name.endsWith('.tsx') || name.endsWith('.js') || name.endsWith('.jsx')) return <FileCode size={18} className="text-blue-400" />;
        if (name.endsWith('.json')) return <FileText size={18} className="text-yellow-400" />;
        if (name.endsWith('.md')) return <FileText size={18} className="text-purple-400" />;
        if (name.endsWith('.png') || name.endsWith('.jpg') || name.endsWith('.svg')) return <ImageIcon size={18} className="text-green-400" />;
        return <FileText size={18} className="text-gray-400" />;
    };

    // Helper to detect language for highlighting
    const getLanguage = (path: string) => {
        if (path.endsWith('.ts') || path.endsWith('.tsx')) return 'typescript';
        if (path.endsWith('.js') || path.endsWith('.jsx')) return 'javascript';
        if (path.endsWith('.json')) return 'json';
        if (path.endsWith('.css')) return 'css';
        if (path.endsWith('.html')) return 'html';
        if (path.endsWith('.md')) return 'markdown';
        return 'plaintext';
    };

    return (
        <div className="flex flex-col h-full bg-bg-card overflow-hidden">
             {/* Header */}
             <div className="px-4 py-3 border-b border-white/10 flex items-center gap-2 bg-gradient-to-r from-primary/10 to-transparent">
                <Folder size={16} className="text-primary" />
                <span className="text-sm font-medium text-white">Repository Explorer</span>
                <span className="text-xs text-gray-400 ml-auto break-all">{currentPath || '/'}</span>
            </div>

            {/* Navigation Bar */}
            {(currentPath || fileContent) && (
                <div className="px-2 py-2 border-b border-white/10 bg-white/5">
                    <button 
                        onClick={handleGoBack}
                        className="flex items-center gap-1 text-xs text-gray-300 hover:text-white px-2 py-1 rounded hover:bg-white/10 transition-colors"
                    >
                        <ChevronLeft size={14} /> Back
                    </button>
                </div>
            )}

            {/* Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-0">
                {loading ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-2">
                        <Loader2 className="animate-spin" size={24} />
                        <span className="text-xs">Loading contents...</span>
                    </div>
                ) : error ? (
                    <div className="flex flex-col items-center justify-center h-full text-red-400 p-4 text-center">
                        <span className="text-sm">{error}</span>
                        <button 
                            onClick={() => fileContent ? fetchFile(currentPath) : fetchDirectory(currentPath)}
                            className="mt-2 text-xs text-primary underline hover:text-white"
                        >
                            Retry
                        </button>
                    </div>
                ) : fileContent !== null ? (
                    <div className="p-4">
                        <div className="bg-[#0d1117] rounded-lg border border-white/10 overflow-hidden">
                            <div className="px-4 py-2 border-b border-white/10 bg-white/5 text-xs text-gray-400 font-mono">
                                {currentPath.split('/').pop()}
                            </div>
                            <div className="p-4 overflow-x-auto">
                                <ReactMarkdown
                                    remarkPlugins={[remarkGfm]}
                                    rehypePlugins={[rehypeHighlight]}
                                    components={{
                                        code({node, className, children, ...props}: any) {
                                            // Force block display for the whole file content
                                           return <code className={`${getLanguage(currentPath)} block text-sm font-mono`} {...props}>{children}</code>
                                        },
                                        pre({node, ...props}) {
                                            return <pre className="bg-transparent p-0 m-0" {...props} />
                                        }
                                    }}
                                >
                                    {`\`\`\`${getLanguage(currentPath)}\n${fileContent}\n\`\`\``}
                                </ReactMarkdown>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col">
                        {files.length === 0 && (
                            <div className="p-8 text-center text-gray-500 text-sm">
                                Empty directory
                            </div>
                        )}
                        {files.map((file) => (
                            <button
                                key={file.path}
                                onClick={() => handleNavigate(file)}
                                className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 border-b border-white/5 text-left group transition-colors"
                            >
                                <div className="shrink-0">
                                    {file.type === 'dir' ? (
                                        <Folder size={18} className="text-blue-300 fill-blue-300/20" />
                                    ) : (
                                        getFileIcon(file.name)
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm text-gray-200 group-hover:text-white truncate">
                                        {file.name}
                                    </div>
                                </div>
                                {file.type === 'file' && (
                                    <div className="text-xs text-gray-500">
                                        {(file.size / 1024).toFixed(1)} KB
                                    </div>
                                )}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default FileExplorer;
