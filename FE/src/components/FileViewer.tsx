import React, { useState, useEffect } from 'react';
import { Loader2, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github-dark.css';
import type { RepoAnalysis } from '../types';

interface Props {
    data: RepoAnalysis;
    filePath: string;
    onClose: () => void;
}

const API_URL = 'http://localhost:3001/api';

const FileViewer: React.FC<Props> = ({ data, filePath, onClose }) => {
    const [content, setContent] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const getLanguage = (path: string) => {
        if (path.endsWith('.ts') || path.endsWith('.tsx')) return 'typescript';
        if (path.endsWith('.js') || path.endsWith('.jsx')) return 'javascript';
        if (path.endsWith('.json')) return 'json';
        if (path.endsWith('.css')) return 'css';
        if (path.endsWith('.html')) return 'html';
        if (path.endsWith('.md')) return 'markdown';
        return 'plaintext';
    };

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
        <div className="flex flex-col h-full bg-[#16161a] rounded-xl border border-white/5 overflow-hidden">
            {/* Header */}
            <div className="px-4 py-3 border-b border-white/10 bg-[#1e1e24] flex items-center justify-between">
                <span className="text-sm font-mono text-gray-300">{filePath}</span>
                <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                    <X size={18} />
                </button>
            </div>

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
                )}
            </div>
        </div>
    );
};

export default FileViewer;
