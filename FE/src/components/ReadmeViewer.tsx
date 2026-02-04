import React from 'react';
import ReactMarkdown from 'react-markdown';
import { BookOpen } from 'lucide-react';


// Tailwind typography plugin is ideal for this, but I didn't install it. 
// I will write manual utility classes or custom CSS in style or global.
// Actually, standard markdown is hard to style with just utilities without the typography plugin.
// I'll try to use standard tailwind classes on elements via components or just global css.
// Since I can't install typography plugin easily without potentially breaking things if npx install failed earlier (though npm install worked).
// I will keep a small css snippet for markdown in index.css or use a style block.

// Let's rely on standard tailwind classes where possible, and for the markdown content, I'll use a wrapper class 'prose-invert' and define it briefly in index.css if needed, 
// OR just style the children in CSS.
// Since the prompt asks to migrate to tailwind, using a CSS file for complex markdown selection is actually still Cleaner than writing deeply nested selectors in Tailwind config. 
// But "pure tailwind" usually implies using @apply in CSS or typography plugin.
// I will move the styles to `index.css` under a specific class to keep components clean.

interface Props {
  content: string;
}

const ReadmeViewer: React.FC<Props> = ({ content }) => {
  return (
    <div className="h-full flex flex-col bg-bg-card border-r border-white/10 overflow-hidden">
      <div className="p-4 border-b border-white/10 flex items-center gap-2 bg-[#16161af2] backdrop-blur-md sticky top-0 z-10">
        <BookOpen size={18} className="text-primary" />
        <span className="font-medium">README.md</span>
      </div>
      <div className="flex-1 p-6 overflow-y-auto text-sm text-gray-200 leading-relaxed custom-scrollbar bg-bg-card">
        <div className="markdown-body">
             <ReactMarkdown>{content}</ReactMarkdown>
        </div>
      </div>
    </div>
  );
};

export default ReadmeViewer;
