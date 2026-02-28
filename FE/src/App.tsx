import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import LearnMorePage from './pages/LearnMorePage';
import DashboardPage from './pages/DashboardPage';
import ChatPage from './pages/ChatPage';
import FilesPage from './pages/FilesPage';
import SharePage from './pages/SharePage';
import MainLayout from './components/MainLayout';
import { RepoProvider } from './contexts/RepoContext';
import { Toaster } from 'react-hot-toast';
import ActivityPage from './pages/ActivityPage';

const App: React.FC = () => {
  return (
    <RepoProvider>
      <Toaster 
        position="top-right" 
        toastOptions={{
          style: {
            background: '#161b22',
            color: '#fff',
            border: '1px solid rgba(255,255,255,0.1)',
          },
        }} 
      />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/learn-more" element={<LearnMorePage />} />
          <Route path="/share/:token" element={<SharePage />} />
          <Route element={<MainLayout />}>
             <Route path="/dashboard" element={<DashboardPage />} />
             <Route path="/chat" element={<ChatPage />} />
             <Route path="/files" element={<FilesPage />} />
             <Route path="/activity" element={<ActivityPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </RepoProvider>
  );
};

export default App;

