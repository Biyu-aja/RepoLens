import React, { useState, useEffect, useMemo } from 'react';
import { 
    Folder, FileText, ChevronRight, ChevronDown, 
    Loader2, FileCode, Image as ImageIcon, Box, Layout 
} from 'lucide-react';
import type { RepoAnalysis } from '../types';

interface FileItem {
    name: string;
    path: string;
    type: 'file' | 'dir';
    size: number;
    url: string;
}

interface TreeNode {
    name: string;
    path: string;
    type: 'file' | 'dir';
    size?: number;
    children: Record<string, TreeNode>;
}

interface Props {
    data: RepoAnalysis;
    onFileSelect?: (file: FileItem) => void;
    initialPath?: string;
    selectedPath?: string | null;
}

import API_URL from '../config';

const getFileIcon = (name: string) => {
    if (name.endsWith('.ts') || name.endsWith('.tsx')) return <FileCode size={16} className="text-blue-400" />;
    if (name.endsWith('.js') || name.endsWith('.jsx')) return <FileCode size={16} className="text-yellow-400" />;
    if (name.endsWith('.css') || name.endsWith('.scss')) return <Layout size={16} className="text-pink-400" />;
    if (name.endsWith('.json')) return <Box size={16} className="text-orange-400" />;
    if (name.endsWith('.md')) return <FileText size={16} className="text-purple-400" />;
    if (name.endsWith('.png') || name.endsWith('.jpg') || name.endsWith('.svg')) return <ImageIcon size={16} className="text-green-400" />;
    return <FileText size={16} className="text-gray-400" />;
};

const FileTreeNode: React.FC<{
    node: TreeNode;
    depth: number;
    expandedFolders: Set<string>;
    toggleFolder: (path: string) => void;
    onSelect: (node: TreeNode) => void;
    selectedPath?: string | null;
}> = ({ node, depth, expandedFolders, toggleFolder, onSelect, selectedPath }) => {
    const isExpanded = expandedFolders.has(node.path);
    const isSelected = selectedPath === node.path;
    const hasChildren = Object.keys(node.children).length > 0;
    
    // Sort children: folders first, then files
    const sortedChildren = useMemo(() => {
        return Object.values(node.children).sort((a, b) => {
            if (a.type === b.type) return a.name.localeCompare(b.name);
            return a.type === 'dir' ? -1 : 1;
        });
    }, [node.children]);

    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (node.type === 'dir') {
            toggleFolder(node.path);
        } else {
            onSelect(node);
        }
    };

    return (
        <div>
            <div 
                className={`
                    flex items-center gap-1.5 py-1 px-2 cursor-pointer select-none transition-colors border-l-[2px]
                    ${isSelected 
                        ? 'bg-blue-500/20 border-blue-500 text-white' 
                        : 'border-transparent text-gray-400 hover:text-gray-200 hover:bg-white/5'
                    }
                `}
                style={{ paddingLeft: `${depth * 12 + 8}px` }}
                onClick={handleClick}
                id={`file-node-${node.path}`}
            >
                <span className="shrink-0 opacity-70">
                    {node.type === 'dir' && (
                        hasChildren ? (
                            isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />
                        ) : <div className="w-[14px]" />
                    )}
                </span>
                
                <span className="shrink-0">
                    {node.type === 'dir' ? (
                        <Folder size={16} className={`${isExpanded ? 'text-blue-300' : 'text-blue-300/70'} fill-blue-300/10`} />
                    ) : (
                        getFileIcon(node.name)
                    )}
                </span>
                
                <span className={`text-sm truncate ${isSelected ? 'font-medium' : ''}`}>
                    {node.name}
                </span>
            </div>

            {node.type === 'dir' && isExpanded && (
                <div>
                    {sortedChildren.map(child => (
                        <FileTreeNode 
                            key={child.path}
                            node={child}
                            depth={depth + 1}
                            expandedFolders={expandedFolders}
                            toggleFolder={toggleFolder}
                            onSelect={onSelect}
                            selectedPath={selectedPath}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

const FileExplorer: React.FC<Props> = ({ data, onFileSelect, initialPath = '', selectedPath }) => {
    const [structure, setStructure] = useState<TreeNode | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

    // Fetch Full Structure
    useEffect(() => {
        const fetchStructure = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await fetch(`${API_URL}/files/structure`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        owner: data.owner,
                        repo: data.name
                    })
                });

                if (!response.ok) throw new Error('Failed to fetch file structure');

                const flatList = await response.json();
                
                // Build Tree
                const root: TreeNode = { name: 'root', path: '', type: 'dir', children: {} };
                
                flatList.forEach((item: any) => {
                    const parts = item.path.split('/');
                    let current = root;
                    let currentPath = '';

                    parts.forEach((part: string, index: number) => {
                        currentPath = currentPath ? `${currentPath}/${part}` : part;
                        
                        // Last part determines type
                        const isLast = index === parts.length - 1;
                        const type = isLast && item.type === 'blob' ? 'file' : 'dir';

                        if (!current.children[part]) {
                            current.children[part] = {
                                name: part,
                                path: currentPath,
                                type: type,
                                size: item.size,
                                children: {}
                            };
                        }
                        current = current.children[part];
                    });
                });

                setStructure(root);
                
                // Initial Expansion
                if (initialPath) {
                    expandToPath(initialPath);
                }

            } catch (err: any) {
                console.error("FileExplorer Error:", err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchStructure();
    }, [data.owner, data.name]);

    // Helper to expand path
    const expandToPath = (path: string) => {
        if (!path) return;
        const parts = path.split('/');
        let currentPath = '';
        const newExpanded = new Set(expandedFolders);
        
        // Add root children (top level folders)
        // Actually, we need to add every partial path.
        parts.forEach((part, index) => {
            // For file paths, we don't expand the file itself, only parents
            // But if it's a folder path, we expand it.
            // Safe bet: expand everything in the path segment
             if (index < parts.length) { // expand all parents
                currentPath = currentPath ? `${currentPath}/${part}` : part;
                newExpanded.add(currentPath);
             }
        });

        // Functional update to ensure we don't lose previous expansions if called multiple times rapidly
        setExpandedFolders(prev => {
            const next = new Set(prev);
            newExpanded.forEach(p => next.add(p));
            return next;
        });
    };

    // Auto-Expand and Scroll when selectedPath changes
    useEffect(() => {
        if (selectedPath) {
            // 1. Expand folders to this file
            const parts = selectedPath.split('/');
            const parentPath = parts.slice(0, -1).join('/');
            expandToPath(parentPath);

            // 2. Scroll into view (needs a small delay for render)
            setTimeout(() => {
                const el = document.getElementById(`file-node-${selectedPath}`);
                if (el) {
                    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }, 100);
        }
    }, [selectedPath]);

    // Initial Path handling (mostly for folders)
    useEffect(() => {
        if (initialPath) {
            expandToPath(initialPath);
        }
    }, [initialPath]);


    const toggleFolder = (path: string) => {
        const newExpanded = new Set(expandedFolders);
        if (newExpanded.has(path)) {
            newExpanded.delete(path);
        } else {
            newExpanded.add(path);
        }
        setExpandedFolders(newExpanded);
    };

    const handleNodeSelect = (node: TreeNode) => {
        if (onFileSelect) {
            onFileSelect({
                name: node.name,
                path: node.path,
                type: 'file',
                size: node.size || 0,
                url: '' // Not used in this context
            });
        }
    };

    return (
        <div className="flex flex-col h-full bg-bg-card text-gray-300">
             {/* Header */}
             <div className="px-4 py-3 border-b border-white/10 flex items-center gap-2 bg-[#0c0c0e]">
                <span className="text-sm font-medium text-gray-100">Explorer</span>
                <span className="text-xs text-gray-500 ml-auto font-mono">
                    {data.name}
                </span>
            </div>

            {/* Tree Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-0 py-2">
                {loading && !structure ? (
                    <div className="flex flex-col items-center justify-center h-40 gap-2 text-gray-500">
                        <Loader2 className="animate-spin" size={20} />
                        <span className="text-xs">Loading tree...</span>
                    </div>
                ) : error ? (
                    <div className="p-4 text-center text-red-400 text-sm">
                        {error}
                    </div>
                ) : structure ? (
                    <div>
                         {/* Render Top Level Items */}
                        {Object.values(structure.children)
                            .sort((a, b) => { // Sort: Dirs then Files
                                if (a.type === b.type) return a.name.localeCompare(b.name);
                                return a.type === 'dir' ? -1 : 1;
                            })
                            .map(child => (
                                <FileTreeNode 
                                    key={child.path}
                                    node={child}
                                    depth={0}
                                    expandedFolders={expandedFolders}
                                    toggleFolder={toggleFolder}
                                    onSelect={handleNodeSelect}
                                    selectedPath={selectedPath}
                                />
                        ))}
                        {Object.keys(structure.children).length === 0 && (
                            <div className="p-4 text-center text-gray-500 text-xs">
                                Empty repository
                            </div>
                        )}
                    </div>
                ) : null}
            </div>
        </div>
    );
};

export default FileExplorer;
