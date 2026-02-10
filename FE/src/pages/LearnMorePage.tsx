import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Code2, 
  MessageSquare, 
  Activity, 
  ShieldCheck, 
  Zap, 
  Search
} from 'lucide-react';

const LearnMorePage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-bg-main text-white overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 backdrop-blur-md border-b border-white/10 bg-bg-main/80">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
            <div className="p-1.5 bg-primary/20 rounded-lg">
              <Code2 className="w-6 h-6 text-primary" />
            </div>
            <span className="text-xl font-bold tracking-tight">Repo<span className="text-primary">Lens</span></span>
          </div>
          <button 
            onClick={() => navigate('/')}
            className="flex items-center gap-2 bg-white/5 hover:bg-white/10 px-4 py-2 rounded-full text-sm font-medium transition-all border border-white/10"
          >
            <ArrowLeft size={16} />
            Back to Analyzer
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl pointer-events-none z-[-1]">
          <div className="absolute top-20 left-1/4 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] animate-pulse-glow" />
          <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[120px]" />
        </div>

        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-sm text-primary mb-6 animate-fade-in-up">
            <Zap size={14} />
            <span>AI-Powered Code Analysis</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight tracking-tight animate-fade-in-up delay-100">
            Understand any codebase <br />
            <span className="bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">in seconds.</span>
          </h1>
          
          <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed animate-fade-in-up delay-200">
            RepoLens combines static analysis with AI to give you instant insights into code quality, architecture, and hidden issues. Stop reading thousands of lines—start asking questions.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up delay-300">
            <button 
              onClick={() => navigate('/')}
              className="bg-primary hover:bg-primary/90 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all shadow-lg shadow-primary/25 hover:shadow-primary/40 flex items-center justify-center gap-2"
            >
              <Search className="w-5 h-5" />
              Analyze a Repository
            </button>
            <a 
              href="#features"
              className="bg-white/5 hover:bg-white/10 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all border border-white/10 flex items-center justify-center"
            >
              How it works
            </a>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 px-6 relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Everything you need to audit code</h2>
            <p className="text-gray-400 max-w-xl mx-auto">Comprehensive tools designed for developers, maintainers, and code reviewers.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="glass-card p-8 rounded-3xl hover:bg-white/[0.03] transition-colors group">
              <div className="w-12 h-12 bg-blue-500/20 rounded-2xl flex items-center justify-center mb-6 text-blue-400 group-hover:scale-110 transition-transform">
                <Activity size={24} />
              </div>
              <h3 className="text-xl font-bold mb-3">Instant Health Score</h3>
              <p className="text-gray-400 leading-relaxed">
                Get a weighted score (0-100) based on complexity, formatting, and best practices. Identify technical debt at a glance before you dive deep.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="glass-card p-8 rounded-3xl hover:bg-white/[0.03] transition-colors group">
              <div className="w-12 h-12 bg-primary/20 rounded-2xl flex items-center justify-center mb-6 text-primary group-hover:scale-110 transition-transform">
                <MessageSquare size={24} />
              </div>
              <h3 className="text-xl font-bold mb-3">Context-Aware Chat</h3>
              <p className="text-gray-400 leading-relaxed">
                Don't just read code—talk to it. Ask our AI to explain complex logic, suggest refactors, or write documentation for specific components.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="glass-card p-8 rounded-3xl hover:bg-white/[0.03] transition-colors group">
              <div className="w-12 h-12 bg-green-500/20 rounded-2xl flex items-center justify-center mb-6 text-green-400 group-hover:scale-110 transition-transform">
                <ShieldCheck size={24} />
              </div>
              <h3 className="text-xl font-bold mb-3">Privacy First</h3>
              <p className="text-gray-400 leading-relaxed">
                We analyze public repositories without storing your code permanently. Your intellectual property remains yours, always.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-24 px-6 bg-white/[0.02]">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">How RepoLens works</h2>
              <p className="text-gray-400 mb-12 text-lg">
                We've streamlined the process of code analysis to be as frictionless as possible.
              </p>

              <div className="space-y-8">
                <div className="flex gap-6">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center font-bold text-lg text-primary">1</div>
                  <div>
                    <h4 className="text-xl font-semibold mb-2">Paste a GitHub URL</h4>
                    <p className="text-gray-400">Simply copy the link to any public repository you want to investigate.</p>
                  </div>
                </div>
                <div className="flex gap-6">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center font-bold text-lg text-primary">2</div>
                  <div>
                    <h4 className="text-xl font-semibold mb-2">Deep Analysis</h4>
                    <p className="text-gray-400">Our engine clones the repo and parses files to build a comprehensive knowledge graph.</p>
                  </div>
                </div>
                <div className="flex gap-6">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center font-bold text-lg text-primary">3</div>
                  <div>
                    <h4 className="text-xl font-semibold mb-2">Explore &chat</h4>
                    <p className="text-gray-400">View the dashboard metrics or start specific conversations about any file in the codebase.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Visual Representation */}
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 blur-[100px] rounded-full" />
              <div className="relative glass-card rounded-2xl p-6 border border-white/20 transform rotate-3 hover:rotate-0 transition-transform duration-500">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-3 h-3 rounded-full bg-red-500"/>
                  <div className="w-3 h-3 rounded-full bg-yellow-500"/>
                  <div className="w-3 h-3 rounded-full bg-green-500"/>
                </div>
                <div className="space-y-3 font-mono text-sm opacity-80">
                  <div className="flex gap-4">
                    <span className="text-primary">import</span>
                    <span className="text-white">React</span>
                    <span className="text-primary">from</span>
                    <span className="text-green-400">'react'</span>
                  </div>
                  <div className="pl-4 border-l-2 border-white/10">
                    <span className="block text-gray-500 mb-2">// AI Analysis: This component handles...</span>
                    <div className="text-blue-300">const <span className="text-yellow-300">RepoLens</span> = () ={'>'} {'{'}</div>
                    <div className="pl-4 text-white">return (</div>
                    <div className="pl-8 text-purple-300">{'<Analyzer />'}</div>
                    <div className="pl-4 text-white">)</div>
                    <div className="text-blue-300">{'}'}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-white/10 text-center text-gray-500">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <Code2 className="w-5 h-5" />
              <span className="font-semibold text-white">RepoLens</span>
            </div>
            <p className="text-sm">
              &copy; {new Date().getFullYear()} RepoLens. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LearnMorePage;
