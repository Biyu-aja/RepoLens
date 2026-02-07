
# RepoLens Frontend

RepoLens is a powerful web application designed to help developers visualize, analyze, and interact with their codebases. It provides an intuitive interface for exploring repositories, viewing file contents, and gaining insights through an AI-powered chat system.

## Features

- **📊 Interactive Dashboard**: Get a high-level overview of your repository's health, including score breakdowns and automated insights to meaningful metrics.
- **💬 AI Chat Interface**: Chat with your repository! Ask questions about the code, request explanations, or generate new snippets using the integrated chat context.
- **📂 File Explorer**: specific Navigate through your project's directory structure with Ease. View file codes with syntax highlighting.
- **📝 Markdown Viewer**: Built-in support for rendering markdown files, making documentation easy to read directly within the app.
- **🎨 Modern UI**: Built with a sleek, responsive design using Tailwind CSS and Radix UI primitives for a premium user experience.

## Tech Stack

- **Framework**: [React](https://react.dev/) with [TypeScript](https://www.typescriptlang.org/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Routing**: [React Router](https://reactrouter.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Visualization**: [Recharts](https://recharts.org/)
- **Markdown**: [React Markdown](https://github.com/remarkjs/react-markdown)

## Getting Started

Follow these steps to set up the project locally.

### Prerequisites

- Node.js (v18 or higher recommended)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd RepoLens/FE
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run the development server**
   ```bash
   npm run dev
   ```

4. **Open in browser**
   The application will be available at `http://localhost:5173` (or the port shown in your terminal).

## Project Structure

```
src/
├── components/   # Reusable UI components (ChatPanel, FileExplorer, etc.)
├── contexts/     # React Context for state management (RepoContext)
├── pages/        # Main application pages (Dashboard, Chat, Files, Landing)
├── services/     # API services and data fetching
├── styles/       # Global styles and tailwind configuration
└── types/        # TypeScript type definitions
```
