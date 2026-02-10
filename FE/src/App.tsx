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

const App: React.FC = () => {
  return (
    <RepoProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/learn-more" element={<LearnMorePage />} />
          <Route path="/share/:token" element={<SharePage />} />
          <Route element={<MainLayout />}>
             <Route path="/dashboard" element={<DashboardPage />} />
             <Route path="/chat" element={<ChatPage />} />
             <Route path="/files" element={<FilesPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </RepoProvider>
  );
};

export default App;

