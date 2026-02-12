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

const FileContent = React.memo(({ content, filePath, fileUrl }: { content: string | null, filePath: string, fileUrl?: string }) => {
    const getExtension = (path: string) => path.split('.').pop()?.toLowerCase() || '';

    const isImage = (path: string) => {
        const ext = getExtension(path);
        return ['png', 'jpg', 'jpeg', 'gif', 'webp', 'ico', 'svg'].includes(ext);
    };

    if (isImage(filePath)) {
        const ext = getExtension(filePath);
        // Special handling for SVG: sometimes better to render as utf-8 if it was decoded, 
        // but our backend sends base64 for binaries.
        const mimeType = ext === 'svg' ? 'image/svg+xml' : `image/${ext === 'jpg' ? 'jpeg' : ext}`;
        
        // Prefer base64 if available, otherwise fallback to URL
        const src = content 
            ? `data:${mimeType};base64,${content}`
            : fileUrl;

        if (!src) {
             return (
                <div className="flex flex-col items-center justify-center p-8 text-gray-400">
                    <span className="text-sm">Image not available</span>
                </div>
             );
        }
        
        return (
            <div className="flex items-center justify-center h-full min-h-[300px] bg-black/20 rounded-lg p-4">
                <img 
                    src={src} 
                    alt={filePath} 
                    className="max-w-full max-h-[600px] object-contain rounded shadow-lg"
                    onError={(e) => {
                        // If base64 failed and we have url, try that next
                        if (content && fileUrl && e.currentTarget.src.startsWith('data:')) {
                            console.log('Base64 image failed, trying URL fallback...');
                            e.currentTarget.src = fileUrl;
                            return;
                        }

                        e.currentTarget.style.display = 'none';
                        e.currentTarget.parentElement!.innerHTML = `
                            <div class="flex flex-col items-center gap-2">
                                <span class="text-red-400 text-xs">Failed to load image</span>
                                ${fileUrl ? `<a href="${fileUrl}" target="_blank" class="text-primary text-xs hover:underline">Open External Link</a>` : ''}
                            </div>
                        `;
                    }}
                />
            </div>
        );
    }

    const getLanguage = (path: string) => {
        if (path.endsWith('.ts') || path.endsWith('.tsx')) return 'typescript';
        if (path.endsWith('.js') || path.endsWith('.jsx')) return 'javascript';
        if (path.endsWith('.json')) return 'json';
        if (path.endsWith('.css')) return 'css';
        if (path.endsWith('.html')) return 'html';
        if (path.endsWith('.md')) return 'markdown';
        return 'plaintext';
    };

    const isMarkdown = filePath.toLowerCase().endsWith('.md');

    if (isMarkdown) {
        return (
            <div className="p-4 md:p-8 max-w-5xl mx-auto">
                <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeHighlight]}
                    components={{
                         h1: ({node, ...props}) => <h1 className="text-2xl md:text-3xl font-semibold border-b border-white/10 pb-2 mb-6 mt-2 text-white" {...props} />,
                         h2: ({node, ...props}) => <h2 className="text-xl md:text-2xl font-semibold border-b border-white/10 pb-2 mb-4 mt-8 text-white" {...props} />,
                         h3: ({node, ...props}) => <h3 className="text-lg md:text-xl font-semibold mb-3 mt-6 text-white" {...props} />,
                         h4: ({node, ...props}) => <h4 className="text-base font-semibold mb-2 mt-4 text-white" {...props} />,
                         p: ({node, ...props}) => <p className="leading-7 mb-4 text-gray-300" {...props} />,
                         ul: ({node, ...props}) => <ul className="list-disc list-outside ml-6 mb-4 text-gray-300 space-y-1" {...props} />,
                         ol: ({node, ...props}) => <ol className="list-decimal list-outside ml-6 mb-4 text-gray-300 space-y-1" {...props} />,
                         li: ({node, ...props}) => <li className="pl-1" {...props} />,
                         a: ({node, ...props}) => <a target="_blank" rel="noopener noreferrer" className="text-[#58a6ff] hover:underline cursor-pointer" {...props} />,
                         blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-white/20 pl-4 py-1 my-4 text-gray-400 bg-white/5 rounded-r" {...props} />,
                         code: ({node, className, children, ...props}: any) => {
                             // Check if it's an inline code block (no language class usually, or passed as inline prop if we weren't using rehype-highlight)
                             // However, with standard remark/rehype, block code follows 'pre > code' structure
                             const isInline = !className && !String(children).includes('\n');
                             return isInline ? (
                                <code className="bg-white/15 rounded-md px-1.5 py-0.5 text-[0.85em] font-mono text-gray-200" {...props}>{children}</code>
                             ) : (
                                <code className={`${className} font-mono text-sm`} {...props}>{children}</code>
                             )
                         },
                         pre: ({node, ...props}) => <pre className="bg-[#161b22] border border-white/10 rounded-lg p-4 overflow-x-auto mb-4" {...props} />,
                         img: ({node, ...props}) => <img className="max-w-full rounded-lg bg-white border border-white/10 my-4" {...props} />,
                         table: ({node, ...props}) => <div className="overflow-x-auto my-4"><table className="min-w-full border-collapse border border-white/10" {...props} /></div>,
                         th: ({node, ...props}) => <th className="border border-white/10 px-4 py-2 bg-white/5 font-bold text-left text-gray-200" {...props} />,
                         td: ({node, ...props}) => <td className="border border-white/10 px-4 py-2 text-gray-300" {...props} />,
                         hr: ({node, ...props}) => <hr className="border-white/10 my-8" {...props} />,
                    }}
                >
                    {content || ''}
                </ReactMarkdown>
            </div>
        );
    }

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
    const [fileData, setFileData] = useState<any>(null); // Store full file object
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectionMenu, setSelectionMenu] = useState<{ x: number; y: number; text: string } | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // ... (keep useEffect for selection) ...

    const handleQuoteClick = (e: React.MouseEvent) => {
        // ... (keep same) ...
        e.stopPropagation();
        if (selectionMenu && onQuote) {
            onQuote(selectionMenu.text);
            setSelectionMenu(null);
            window.getSelection()?.removeAllRanges();
        }
    };

    useEffect(() => {
        const fetchFile = async () => {
            setLoading(true);
            setError(null);
            setFileData(null);
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
                
                // Content might be empty string, check for property existence
                if (result.content !== undefined) {
                    setFileData(result);
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
                <div className="flex items-center gap-2 overflow-hidden">
                    <span className="text-sm font-mono text-gray-300 truncate" title={filePath}>{filePath}</span>
                    {fileData?.html_url && (
                        <a 
                            href={fileData.html_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-xs text-primary hover:underline shrink-0"
                            title="Open on GitHub"
                        >
                            Open External
                        </a>
                    )}
                </div>
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
                     <FileContent content={fileData?.content} filePath={filePath} fileUrl={fileData?.download_url || fileData?.html_url} />
                )}
            </div>
        </div>
    );
};

export default FileViewer;
