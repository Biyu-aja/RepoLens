import { Octokit } from 'octokit';

// Initialize Octokit (can function without auth for public repos, but lower rate limits)
// It's better to provide a token if available
const octokit = new Octokit({
    auth: process.env.GITHUB_TOKEN,
    userAgent: 'repolens/1.0.0'
});

export const getRepoDetails = async (owner: string, repo: string) => {
    try {
        const { data } = await octokit.request('GET /repos/{owner}/{repo}', {
            owner,
            repo,
        });
        return data;
    } catch (error) {
        console.error('Error fetching repo details:', error);
        throw error;
    }
};

export const getRepoContent = async (owner: string, repo: string, path: string = '') => {
    try {
        // This returns directory listing or file content
        const { data } = await octokit.request('GET /repos/{owner}/{repo}/contents/{path}', {
            owner,
            repo,
            path,
        });
        return data;
    } catch (error) {
        // If not found, return null instead of throwing, to handle missing READMEs gracefully
        return null;
    }
};

export const getCommitActivity = async (owner: string, repo: string) => {
    try {
        const { data } = await octokit.request('GET /repos/{owner}/{repo}/stats/commit_activity', {
            owner,
            repo
        });
        return data;
    } catch (e) {
        return null;
    }
}

export const getRepoFileStructure = async (owner: string, repo: string) => {
    try {
        // 1. Get default branch
        const { data: repoData } = await octokit.request('GET /repos/{owner}/{repo}', {
            owner,
            repo
        });
        const defaultBranch = repoData.default_branch;

        // 2. Get recursive tree
        const { data: treeData } = await octokit.request('GET /repos/{owner}/{repo}/git/trees/{tree_sha}', {
            owner,
            repo,
            tree_sha: defaultBranch,
            recursive: 'true'
        });

        // 3. Simplify
        return treeData.tree.map((item: any) => ({
            path: item.path,
            type: item.type, // 'blob' or 'tree'
            url: item.url
        }));
    } catch (error) {
        console.error('Error fetching file structure:', error);
        return [];
    }
};
