# RepoLens

*Visualize, Analyze, and Chat with Your Codebase.*

RepoLens is a powerful web application designed to help developers visualize, analyze, and interact with their codebases. It provides an intuitive interface for exploring repositories, viewing file contents, and gaining insights through an AI-powered chat system.


This repository is organized into a monorepo structure containing both the frontend and backend services.

## Project Story

### Inspiration
Developers spend a significant amount of time trying to understand existing codebases. The cognitive load required to trace dependencies, analyze code quality, and simply navigate large directories can be immense. We were inspired to build a tool that acts not just as a viewer, but as an intelligent companion—a "lens" that brings clarity to complex repositories.

### How it was Built
RepoLens is designed with a decoupled architecture to ensure scalability and a smooth developer experience. 

- **Frontend:** Built with React, Vite, and Tailwind CSS, the frontend focuses on providing a highly interactive visualization experience. We utilized libraries like Recharts for data visualization and built custom components to provide an IDE-like file navigation experience.
- **Backend:** Powered by Node.js and Express, the backend acts as the core engine. It interfaces directly with the local file system (or remote repositories via APIs) and handles the heavy lifting of code analysis and AI integrations.

### Challenges Faced
Running these calculations across deep file trees required careful optimization of our backend algorithms and efficient state management on the frontend to keep the UI snappy. Another significant hurdle was chunking and managing code context for the AI chat to ensure we provided the LLM with relevant code without exceeding token limits.

### What We Learned
Building RepoLens vastly deepened our understanding of full-stack TypeScript development and the intricacies of seamlessly integrating AI features into traditional web apps. We learned how critical it is to balance rich functionality with performance, reinforcing our commitment to building performant and user-centric tools.

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
