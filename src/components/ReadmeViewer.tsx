import React from 'react';
import ReactMarkdown from 'react-markdown';
import { BookOpen } from 'lucide-react';
import './ReadmeViewer.css';

interface Props {
  content: string;
}

const ReadmeViewer: React.FC<Props> = ({ content }) => {
  return (
    <div className="readme-container">
      <div className="readme-header">
        <BookOpen size={18} className="text-primary" />
        <span className="font-medium">README.md</span>
      </div>
      <div className="readme-content custom-scrollbar">
        <ReactMarkdown>{content}</ReactMarkdown>
      </div>
    </div>
  );
};

export default ReadmeViewer;
