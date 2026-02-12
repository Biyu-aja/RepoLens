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
    } catch (error: any) {
        if (error.status === 404) {
            return null;
        }
        console.error(`Error in getRepoContent for ${path}:`, error);
        throw error;
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

export const getRecentCommits = async (owner: string, repo: string, since?: string, until?: string) => {
    try {
        const params: any = {
            owner,
            repo,
            per_page: 100
        };

        if (since) params.since = since;
        if (until) params.until = until;

        const { data } = await octokit.request('GET /repos/{owner}/{repo}/commits', params);

        // Group by Date (YYYY-MM-DD)
        const commitsByDate = new Map<string, number>();

        data.forEach((item: any) => {
            const date = item.commit.author?.date?.split('T')[0];
            if (date) {
                commitsByDate.set(date, (commitsByDate.get(date) || 0) + 1);
            }
        });

        // Convert to array objects
        return Array.from(commitsByDate.entries()).map(([date, count]) => ({
            date,
            count
        })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    } catch (error) {
        console.error('Error fetching recent commits:', error);
        return [];
    }
};

export const getTopHustlers = async (owner: string, repo: string) => {
    try {
        // Fetch last 100 commits with full details
        const { data } = await octokit.request('GET /repos/{owner}/{repo}/commits', {
            owner,
            repo,
            per_page: 100
        });

        // "Unusual hours" = 22:00 - 05:59 (10PM - 6AM)
        const hustlerMap = new Map<string, {
            name: string;
            avatar: string;
            lateNightCommits: number;
            totalCommits: number;
            latestLateCommit: string;
        }>();

        data.forEach((item: any) => {
            const authorLogin = item.author?.login || item.commit.author?.name || 'unknown';
            const avatar = item.author?.avatar_url || '';
            const dateStr = item.commit.author?.date;

            if (!dateStr) return;

            const hour = new Date(dateStr).getUTCHours();
            const isLateNight = hour >= 22 || hour < 6;

            if (!hustlerMap.has(authorLogin)) {
                hustlerMap.set(authorLogin, {
                    name: authorLogin,
                    avatar,
                    lateNightCommits: 0,
                    totalCommits: 0,
                    latestLateCommit: ''
                });
            }

            const entry = hustlerMap.get(authorLogin)!;
            entry.totalCommits++;

            if (isLateNight) {
                entry.lateNightCommits++;
                if (!entry.latestLateCommit || dateStr > entry.latestLateCommit) {
                    entry.latestLateCommit = dateStr;
                }
            }
        });

        // Sort by lateNightCommits descending, return top 5
        return Array.from(hustlerMap.values())
            .filter(h => h.lateNightCommits > 0)
            .sort((a, b) => b.lateNightCommits - a.lateNightCommits)
            .slice(0, 5);
    } catch (error) {
        console.error('Error fetching top hustlers:', error);
        return [];
    }
};

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
            size: item.size,
            url: item.url
        }));
    } catch (error) {
        console.error('Error fetching file structure:', error);
        return [];
    }
};

/**
 * Get top contributors with their contribution stats
 */
export const getContributors = async (owner: string, repo: string, limit: number = 10) => {
    try {
        const { data } = await octokit.request('GET /repos/{owner}/{repo}/contributors', {
            owner,
            repo,
            per_page: limit
        });

        // Calculate total contributions for percentage
        const totalContributions = data.reduce((sum: number, c: any) => sum + c.contributions, 0);

        return data.map((contributor: any) => ({
            login: contributor.login,
            avatarUrl: contributor.avatar_url,
            profileUrl: contributor.html_url,
            contributions: contributor.contributions,
            percentage: Math.round((contributor.contributions / totalContributions) * 100)
        }));
    } catch (error) {
        console.error('Error fetching contributors:', error);
        return [];
    }
};

/**
 * Get language distribution for the repository
 */
export const getLanguages = async (owner: string, repo: string) => {
    try {
        const { data } = await octokit.request('GET /repos/{owner}/{repo}/languages', {
            owner,
            repo
        });

        // Calculate total bytes and percentages
        const totalBytes = Object.values(data).reduce((sum: number, bytes: any) => sum + bytes, 0);

        // Convert to array with percentages, sorted by usage
        const languages = Object.entries(data)
            .map(([name, bytes]: [string, any]) => ({
                name,
                bytes,
                percentage: Math.round((bytes / totalBytes) * 100)
            }))
            .sort((a, b) => b.bytes - a.bytes);

        return languages;
    } catch (error) {
        console.error('Error fetching languages:', error);
        return [];
    }
};

/**
 * Get punch card data (hourly commit counts per day)
 * Returns array of [day (0-6), hour (0-23), count]
 */
export const getPunchCard = async (owner: string, repo: string) => {
    try {
        const { data } = await octokit.request('GET /repos/{owner}/{repo}/stats/punch_card', {
            owner,
            repo
        });
        return data; // Array of [day, hour, count]
    } catch (error) {
        console.error('Error fetching punch card:', error);
        return [];
    }
};

/**
 * Get commit activity for the last year
 */
export const getWeeklyCommitActivity = async (owner: string, repo: string) => {
    try {
        const { data } = await octokit.request('GET /repos/{owner}/{repo}/stats/code_frequency', {
            owner,
            repo
        });
        // Returns weekly additions and deletions
        // Format: [timestamp, additions, deletions]
        return data;
    } catch (error) {
        console.error('Error fetching code frequency:', error);
        return [];
    }
};

