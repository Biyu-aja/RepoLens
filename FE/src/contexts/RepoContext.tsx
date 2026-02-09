import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { RepoAnalysis } from '../types';

interface RepoContextType {
  data: RepoAnalysis | null;
  setData: (data: RepoAnalysis | null) => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
}

const RepoContext = createContext<RepoContextType | undefined>(undefined);

export const RepoProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [data, setData] = useState<RepoAnalysis | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = () => {
      try {
        const stored = localStorage.getItem('repo_analysis');
        if (stored) {
          setData(JSON.parse(stored));
        }
      } catch (e) {
        console.error('Failed to load repo data', e);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const updateData = (newData: RepoAnalysis | null) => {
    setData(newData);
    if (newData) {
      localStorage.setItem('repo_analysis', JSON.stringify(newData));
      
      // Also sync to history to persist changes (like notes)
      try {
        const historyRaw = localStorage.getItem('repo_analysis_history');
        if (historyRaw) {
          const history = JSON.parse(historyRaw);
          if (Array.isArray(history)) {
             const index = history.findIndex((h: RepoAnalysis) => h.id === newData.id);
             if (index !== -1) {
               history[index] = newData;
               localStorage.setItem('repo_analysis_history', JSON.stringify(history));
             }
          }
        }
      } catch (e) {
        console.error('Failed to sync changes to history', e);
      }
    } else {
      localStorage.removeItem('repo_analysis');
    }
  };

  return (
    <RepoContext.Provider value={{ data, setData: updateData, loading, setLoading }}>
      {children}
    </RepoContext.Provider>
  );
};

export const useRepo = () => {
  const context = useContext(RepoContext);
  if (context === undefined) {
    throw new Error('useRepo must be used within a RepoProvider');
  }
  return context;
};
