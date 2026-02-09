import React, { useState } from 'react';
import { 
  NotebookPen, X, Plus, ChevronLeft, Trash2, 
  FileText, FileDown
} from 'lucide-react';
import { useRepo } from '../contexts/RepoContext';
import { jsPDF } from 'jspdf';
import type { Note } from '../types';

const NotesWidget: React.FC = () => {
  const { data, setData } = useRepo();
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState<'list' | 'editor'>('list');
  const [activeNote, setActiveNote] = useState<Note | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // If no repo data, don't show widget
  if (!data) return null;

  const notes = data.notes || [];

  const handleCreateNote = () => {
    const newNote: Note = {
      id: crypto.randomUUID(),
      title: 'Untitled Note',
      content: '',
      updatedAt: new Date().toISOString()
    };
    setActiveNote(newNote);
    setTitle(newNote.title);
    setContent(newNote.content);
    setView('editor');
  };

  const handleEditNote = (note: Note) => {
    setActiveNote(note);
    setTitle(note.title);
    setContent(note.content);
    setView('editor');
  };

  const handleSave = () => {
    if (!activeNote) return;

    const updatedNote: Note = {
      ...activeNote,
      title: title || 'Untitled Note',
      content,
      updatedAt: new Date().toISOString()
    };

    // Update notes list
    const updatedNotes = notes.some(n => n.id === activeNote.id)
      ? notes.map(n => n.id === activeNote.id ? updatedNote : n)
      : [updatedNote, ...notes];

    // Update Context (syncs to localStorage)
    setData({ ...data, notes: updatedNotes });
    
    // Update local state
    setActiveNote(updatedNote);
    setIsSaving(true);
    setTimeout(() => setIsSaving(false), 1000);
  };

  const handleDelete = () => {
    if (!activeNote) return;
    const updatedNotes = notes.filter(n => n.id !== activeNote.id);
    setData({ ...data, notes: updatedNotes });
    setView('list');
    setActiveNote(null);
  };

  const handleExportTxt = () => {
    if (!activeNote) return;
    const text = `Title: ${title}\nDate: ${new Date().toLocaleString()}\n\n${content}`;
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportPdf = () => {
    if (!activeNote) return;
    const doc = new jsPDF();
    
    doc.setFontSize(20);
    doc.text(title, 20, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Created: ${new Date(activeNote.updatedAt).toLocaleString()}`, 20, 30);
    
    doc.setFontSize(12);
    doc.setTextColor(0);
    
    // Split text to fit page width
    const splitText = doc.splitTextToSize(content, 170);
    doc.text(splitText, 20, 45);
    
    doc.save(`${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`);
  };

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end">
      {/* Widget Window */}
      {isOpen && (
        <div className="mb-4 w-80 md:w-96 h-[500px] bg-[#16161a] border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-10 fade-in duration-200">
          
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-white/[0.02]">
            <div className="flex items-center gap-2 text-indigo-400 font-medium">
              <NotebookPen size={18} />
              <span>Notes</span>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="p-1.5 hover:bg-white/5 rounded-lg text-gray-400 hover:text-white transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden flex flex-col">
            {view === 'list' ? (
              // List View
              <div className="flex-1 flex flex-col">
                <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-2">
                  {notes.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-500 gap-2 p-4 text-center">
                      <NotebookPen size={32} className="opacity-20" />
                      <p className="text-sm">No notes yet. Create one to get started!</p>
                    </div>
                  ) : (
                    notes.map(note => (
                      <div 
                        key={note.id}
                        onClick={() => handleEditNote(note)}
                        className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 cursor-pointer transition-all group"
                      >
                        <h4 className="text-sm font-medium text-gray-200 mb-1 truncate">{note.title || 'Untitled'}</h4>
                        <p className="text-xs text-gray-500 line-clamp-2">{note.content || 'No content'}</p>
                        <div className="mt-2 flex items-center justify-between text-[10px] text-gray-600">
                          <span>{new Date(note.updatedAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <div className="p-3 border-t border-white/5 bg-white/[0.02]">
                  <button 
                    onClick={handleCreateNote}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-medium transition-colors"
                  >
                    <Plus size={18} />
                    New Note
                  </button>
                </div>
              </div>
            ) : (
              // Editor View
              <div className="flex-1 flex flex-col h-full bg-[#0a0a0c]">
                {/* Editor Toolbar */}
                <div className="flex items-center justify-between px-2 py-2 border-b border-white/5 bg-white/[0.02]">
                  <button 
                    onClick={() => {
                      handleSave(); // Auto save on back
                      setView('list');
                    }}
                    className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                  >
                    <ChevronLeft size={14} />
                    Back
                  </button>
                  <div className="flex items-center gap-1">
                     <button
                        onClick={handleDelete}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        title="Delete Note"
                      >
                        <Trash2 size={16} />
                      </button>
                      <div className="w-px h-4 bg-white/10 mx-1" />
                      <button
                        onClick={handleExportTxt}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                        title="Export as TXT"
                      >
                        <FileText size={16} />
                      </button>
                      <button
                        onClick={handleExportPdf}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                        title="Export as PDF"
                      >
                        <FileDown size={16} />
                      </button>
                      <button
                        onClick={handleSave}
                        className={`ml-1 flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          isSaving 
                            ? 'bg-emerald-500/20 text-emerald-400' 
                            : 'bg-indigo-500 text-white hover:bg-indigo-600'
                        }`}
                      >
                        {isSaving ? <span className="flex items-center gap-1">Saved</span> : 'Save'}
                      </button>
                  </div>
                </div>

                {/* Editor Inputs */}
                <div className="flex-1 flex flex-col p-4 gap-4">
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Note Title"
                    className="bg-transparent text-lg font-bold text-white placeholder-gray-600 focus:outline-none"
                  />
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Write your thoughts..."
                    className="flex-1 bg-transparent text-sm text-gray-300 placeholder-gray-600 focus:outline-none resize-none leading-relaxed custom-scrollbar"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`p-4 rounded-full shadow-2xl transition-all duration-300 group ${
          isOpen 
            ? 'bg-[#16161a] text-indigo-400 border border-indigo-500/30' 
            : 'bg-indigo-500 text-white hover:bg-indigo-600 hover:scale-110'
        }`}
      >
        {isOpen ? (
          <X size={24} />
        ) : (
          <NotebookPen size={24} className={notes.length > 0 ? 'animate-pulse' : ''} />
        )}
      </button>
    </div>
  );
};

export default NotesWidget;
