
# RepoLens Backend

This is the backend service for RepoLens, built with Node.js, Express, and TypeScript. It powers the repository analysis, file exploration, and AI chat features of the application.

## Features

- **📂 File Operations**: API endpoints to navigate directories and retrieve file contents from local or remote repositories.
- **📊 Code Analysis**: Analyzes codebase structure and metrics to provide insights for the frontend dashboard.
- **💬 AI Chat Support**: Handles context retrieval and communication with AI models to enable the "Chat with Repo" functionality.
- **🔗 GitHub Integration**: Uses Octokit to interact with GitHub repositories (if configured).

## Tech Stack

- **Runtime**: [Node.js](https://nodejs.org/)
- **Framework**: [Express.js](https://expressjs.com/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **API Integration**: [Octokit](https://github.com/octokit/octokit.js) (GitHub API)
- **Utilities**: dotenv, cors

## Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- npm or yarn

### Environment Variables

Create a `.env` file in the root of the `BE` directory. You can copy the structure from a provided example or add the following keys (adjust as needed for your setup):

```env
PORT=3000
# Add other necessary env vars here, e.g., GEMINI_API_KEY, GITHUB_TOKEN
```

### Installation

1. **Navigate to the backend directory:**
   ```bash
   cd RepoLens/BE
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Run the development server:**
   ```bash
   npm run dev
   ```
   The server will start (defaulting to port 3000 or the one specified in your `.env`).

4. **Build for production:**
   ```bash
   npm run build
   ```

5. **Run production build:**
   ```bash
   npm start
   ```

## Project Structure

```
src/
├── routes/       # API route definitions (analyze, chat, files)
├── services/     # Business logic and external service integrations
├── index.ts      # Entry point and server configuration
└── ...
```
