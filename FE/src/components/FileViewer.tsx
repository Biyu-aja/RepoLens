import React, { useState, useEffect, useRef } from 'react';
import { Loader2, X, Quote } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github-dark.css';
import type { RepoAnalysis } from '../types';

interface Props {
    data: RepoAnalysis;
    filePath: string;
    onClose: () => void;
    onQuote?: (text: string) => void;
}

const API_URL = 'http://localhost:3001/api';

const FileContent = React.memo(({ content, filePath }: { content: string | null, filePath: string }) => {
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
        <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeHighlight]}
            components={{
                code({node, className, children, ...props}: any) {
                    return <code className={`${getLanguage(filePath)} block text-sm font-mono`} {...props}>{children}</code>
                },
                pre({node, ...props}) {
                    return <pre className="bg-transparent p-0 m-0" {...props} />
                }
            }}
        >
            {`\`\`\`${getLanguage(filePath)}\n${content || ''}\n\`\`\``}
        </ReactMarkdown>
    );
});

const FileViewer: React.FC<Props> = ({ data, filePath, onClose, onQuote }) => {
    const [content, setContent] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectionMenu, setSelectionMenu] = useState<{ x: number; y: number; text: string } | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Removed getLanguage from here as it moved to FileContent

    useEffect(() => {
        const handleSelection = () => {
             const selection = window.getSelection();
             if (!selection || selection.isCollapsed || !selection.toString().trim()) {
                 setSelectionMenu(null);
                 return;
             }
 
             // Check if selection is inside this component
             if (containerRef.current && !containerRef.current.contains(selection.anchorNode)) {
                 return;
             }
 
             const range = selection.getRangeAt(0);
             const rect = range.getBoundingClientRect();
 
             setSelectionMenu({
                 x: rect.left + rect.width / 2,
                 y: rect.top - 10,
                 text: selection.toString()
             });
        };
 
        document.addEventListener('mouseup', handleSelection);
        return () => document.removeEventListener('mouseup', handleSelection);
     }, []);

    const handleQuoteClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (selectionMenu && onQuote) {
            onQuote(selectionMenu.text);
            setSelectionMenu(null);
            window.getSelection()?.removeAllRanges();
        }
    };

    // ... (fetchFile useEffect) ...
    useEffect(() => {
        const fetchFile = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await fetch(`${API_URL}/files/content`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        owner: data.owner,
                        repo: data.name,
                        path: filePath
                    })
                });
    
                if (!response.ok) throw new Error('Failed to fetch file');
    
                const result = await response.json();
                
                if (result.content !== undefined) {
                    setContent(result.content);
                } else {
                    throw new Error('File content not found');
                }
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        if (filePath) {
            fetchFile();
        }
    }, [filePath, data.owner, data.name]);

    return (
        <div ref={containerRef} className="flex flex-col h-full bg-[#16161a] rounded-xl border border-white/5 overflow-hidden relative">
            {/* Header */}
            <div className="px-4 py-3 border-b border-white/10 bg-[#1e1e24] flex items-center justify-between">
                <span className="text-sm font-mono text-gray-300">{filePath}</span>
                <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                    <X size={18} />
                </button>
            </div>
            
            {/* Selection Popup */}
            {selectionMenu && (
                <button
                    onClick={handleQuoteClick}
                    className="fixed z-[100] transform -translate-x-1/2 px-3 py-1.5 bg-[#1E1E24] border border-white/10 text-white text-xs font-medium rounded-full shadow-xl flex items-center gap-2 hover:bg-primary hover:border-primary transition-all animate-in fade-in zoom-in-95 duration-200"
                    style={{ left: selectionMenu.x, top: selectionMenu.y }}
                    onMouseDown={(e) => e.preventDefault()}
                >
                    <Quote size={12} />
                    <span className="font-bold">Quote</span>
                </button>
            )}

            {/* Content */}
            <div className="flex-1 overflow-auto custom-scrollbar p-4">
                {loading ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-2">
                        <Loader2 className="animate-spin" size={24} />
                        <span className="text-sm">Loading file...</span>
                    </div>
                ) : error ? (
                    <div className="flex flex-col items-center justify-center h-full text-red-400 text-center">
                        <span className="mb-2">⚠️ {error}</span>
                        <button onClick={() => window.location.reload()} className="text-xs text-primary hover:underline">Retry</button>
                    </div>
                ) : (
                     <FileContent content={content} filePath={filePath} />
                )}
            </div>
        </div>
    );
};

export default FileViewer;
