
import { getRepoFileStructure, getRepoContent } from './github';

interface DependencyNode {
    id: string; // File path
    imports: string[];
}

interface GraphLink {
    source: string;
    target: string;
}

interface GraphData {
    nodes: { id: string; name: string; type: string }[];
    links: GraphLink[];
}

export const analyzeDependencies = async (owner: string, repo: string): Promise<GraphData> => {
    // 1. Get file structure
    const structure = await getRepoFileStructure(owner, repo);

    // 2. Filter for source files (limit to prevent timeout/rate limit)
    // Prioritize src/ folder if exists
    const sourceFiles = structure.filter((f: any) =>
        (f.path.endsWith('.ts') || f.path.endsWith('.tsx') ||
            f.path.endsWith('.js') || f.path.endsWith('.jsx')) &&
        f.type === 'blob' &&
        !f.path.includes('node_modules') &&
        !f.path.includes('test') &&
        !f.path.includes('dist') &&
        !f.path.includes('build') // exclude built artifacts
    );

    // Limit to top 30 files for now to avoid hitting rate limits hard
    // We can prioritize by hierarchy (shorter paths first = root files)
    const filesToAnalyze = sourceFiles
        .sort((a: any, b: any) => a.path.length - b.path.length) // Breadth-first sort roughly
        .slice(0, 30);

    const nodes: { id: string; name: string; type: string }[] = [];
    const links: GraphLink[] = [];
    const fileContents: Map<string, string> = new Map();

    // 3. Fetch content in batches
    const BATCH_SIZE = 5;
    for (let i = 0; i < filesToAnalyze.length; i += BATCH_SIZE) {
        const batch = filesToAnalyze.slice(i, i + BATCH_SIZE);
        await Promise.all(batch.map(async (file: any) => {
            try {
                // We use getRepoContent but we need to handle the content format
                const data: any = await getRepoContent(owner, repo, file.path);

                if (data && 'content' in data && data.encoding === 'base64') {
                    const content = Buffer.from(data.content, 'base64').toString('utf-8');
                    fileContents.set(file.path, content);
                    nodes.push({
                        id: file.path,
                        name: file.path.split('/').pop() || file.path,
                        type: 'file'
                    });
                }
            } catch (err) {
                console.error(`Failed to fetch ${file.path}`, err);
            }
        }));
    }

    // 4. Parse imports
    fileContents.forEach((content, filePath) => {
        const imports = extractImports(content, filePath);
        imports.forEach(imp => {
            // Resolve import path to file path
            const targetPath = resolvePath(filePath, imp, structure);
            if (targetPath) {
                links.push({ source: filePath, target: targetPath });
            }
        });
    });

    return { nodes, links };
};

const extractImports = (content: string, filePath: string): string[] => {
    const imports: string[] = [];
    // Basic regex for ES6 imports: import ... from '...'
    const importRegex = /import\s+(?:[\w\s{},*]+)\s+from\s+['"]([^'"]+)['"]/g;
    let match;
    while ((match = importRegex.exec(content)) !== null) {
        imports.push(match[1]);
    }

    // Basic regex for require: require('...') - looking for the string content
    const requireRegex = /product_require\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
    // Actually standard 'require'
    const standardRequireRegex = /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g;

    while ((match = standardRequireRegex.exec(content)) !== null) {
        imports.push(match[1]);
    }

    return imports;
}

const resolvePath = (currentPath: string, importPath: string, structure: any[]): string | null => {
    // 1. Handle aliasing (e.g. '@/' -> 'src/') if commonly used in frontend
    let effectiveImportPath = importPath;
    if (importPath.startsWith('@/')) {
        effectiveImportPath = 'src/' + importPath.substring(2);
        // Treat as absolute from root
    }

    if (effectiveImportPath.startsWith('.')) {
        // Relative path resolution
        // currentPath is like 'src/components/Button.tsx'
        const currentDirParts = currentPath.split('/');
        currentDirParts.pop(); // remove filename

        const importParts = effectiveImportPath.split('/');

        const resolvedParts = [...currentDirParts];

        for (const part of importParts) {
            if (part === '.') continue;
            if (part === '..') {
                if (resolvedParts.length > 0) resolvedParts.pop();
            } else {
                resolvedParts.push(part);
            }
        }

        const candidateBase = resolvedParts.join('/');

        // Try exact match first (if extension is provided)
        let exactMatch = structure.find((f: any) => f.path === candidateBase);
        if (exactMatch) return exactMatch.path;

        // Try extensions
        const extensions = ['.ts', '.tsx', '.js', '.jsx', '/index.ts', '/index.js', '/index.tsx', '/index.jsx'];
        for (const ext of extensions) {
            const pathToCheck = candidateBase + ext;
            const found = structure.find((f: any) => f.path === pathToCheck);
            if (found) return found.path;
        }
    } else {
        // Absolute or Alias or Package
        // Check if it matches a file directly (e.g. 'src/utils')
        let directMatch = structure.find((f: any) => f.path === effectiveImportPath || f.path === effectiveImportPath + '.ts'); // simple check
        if (directMatch) return directMatch.path;

        // Try searching in src/ if it looks like a project import
        // e.g. 'components/Button' -> 'src/components/Button'
        const rootGuesses = [
            `src/${effectiveImportPath}`,
            `src/${effectiveImportPath}.ts`,
            `src/${effectiveImportPath}.tsx`,
            `src/${effectiveImportPath}/index.ts`
        ];

        for (const guess of rootGuesses) {
            const found = structure.find((f: any) => f.path === guess);
            if (found) return found.path;
        }
    }

    return null;
}
