import type { RepoAnalysis } from '../types';

import API_URL from '../config';

export const analyzeRepository = async (repoUrl: string): Promise<RepoAnalysis> => {
  try {
    const response = await fetch(`${API_URL}/analyze-repo`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url: repoUrl }),
    });

    if (!response.ok) {
      throw new Error(`Analysis failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};
