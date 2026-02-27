# RepoLens

RepoLens is a powerful web application designed to help developers visualize, analyze, and interact with their codebases. It provides an intuitive interface for exploring repositories, viewing file contents, and gaining insights through an AI-powered chat system.

This repository is organized into a monorepo structure containing both the frontend and backend services.

## Project Structure

- **[`/FE`](./FE)**: The Frontend web application, built with React, Vite, Tailwind CSS, and TypeScript.
- **[`/BE`](./BE)**: The Backend server, built with Node.js, Express, and TypeScript, providing API functionality including file operations, code analysis, and AI chat integration.

## Key Features

- **📊 Interactive Dashboard**: High-level overview of repository health, score breakdowns, and automated insights.
- **💬 AI Chat Interface**: Chat with your repository to ask questions about code, ask for explanations, or generate snippets.
- **📂 File Explorer**: Navigate through project structures and view code with syntax highlighting.
- **📝 Markdown Viewer**: Built-in support for rendering markdown files.

## Getting Started

To get the application running locally, you need to set up both the backend and frontend.

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- npm or yarn

### 1. Backend Setup

Navigate to the `BE` directory:

```bash
cd BE
```

Install dependencies:

```bash
npm install
```

Configure your environment variables by setting up a `.env` file (refer to the backend `README.md` for details).

Run the development server:

```bash
npm run dev
```

The backend server will typically start on port `3000`.

### 2. Frontend Setup

Open a new terminal and navigate to the `FE` directory:

```bash
cd FE
```

Install dependencies:

```bash
npm install
```

Start the frontend development server:

```bash
npm run dev
```

The frontend application will be available at `http://localhost:5173`.

## Documentation

For more detailed information on each part of the project, please refer to their respective README files:

- [Frontend Documentation](./FE/README.md)
- [Backend Documentation](./BE/README.md)
