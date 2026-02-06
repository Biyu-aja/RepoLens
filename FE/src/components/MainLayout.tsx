import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { 
  Home, 
  LayoutDashboard, 
  MessageSquare, 
  LogOut,
  Folder
} from 'lucide-react';

const MainLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [expanded, setExpanded] = useState(false);

  const menuItems = [
    { 
      id: 'dashboard', 
      icon: LayoutDashboard, 
      label: 'Dashboard', 
      path: '/dashboard'
    },
    { 
      id: 'chat', 
      icon: MessageSquare, 
      label: 'AI Chat', 
      path: '/chat'
    },
    { 
      id: 'files', 
      icon: Folder, 
      label: 'Files', 
      path: '/files'
    }
  ];

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#0a0a0c] text-white font-sans">
      {/* Activity Bar */}
      <div 
        className={`bg-[#101014] border-r border-white/10 flex flex-col pt-4 z-40 shrink-0 transition-all duration-300 ease-out 
          ${expanded ? 'w-[180px] px-3' : 'w-[50px] items-center px-0'}
        `}
        onMouseEnter={() => setExpanded(true)}
        onMouseLeave={() => setExpanded(false)}
      >
        {/* Top Actions */}
        <div className="flex flex-col gap-2 w-full">
           <button
              onClick={() => navigate('/')}
              className={`flex items-center gap-3 rounded-md text-gray-400 hover:text-white hover:bg-white/5 transition-all cursor-pointer ${
                expanded ? 'w-full px-3 py-2.5 justify-start' : 'w-10 h-10 justify-center'
              }`}
              title="Home / Landing"
            >
              <Home size={20} />
              {expanded && <span className="text-sm font-medium">Home</span>}
            </button>

            <div className="w-full h-px bg-white/10 my-1" />

            {menuItems.map((item) => {
              const isActive = location.pathname.startsWith(item.path);
              return (
                <button
                  key={item.id}
                  onClick={() => navigate(item.path)}
                  className={`flex items-center gap-3 rounded-md transition-all cursor-pointer ${
                    expanded ? 'w-full px-3 py-2.5 justify-start' : 'w-10 h-10 justify-center'
                  } ${isActive ? 'text-white bg-primary' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
                  title={item.label}
                >
                  <item.icon size={20} />
                  {expanded && <span className="text-sm font-medium">{item.label}</span>}
                </button>
              );
            })}
        </div>

        <div className="flex-1" />

        {/* Bottom Actions */}
        <div className="pb-4 w-full flex flex-col items-center">
             <button
              onClick={() => {
                localStorage.removeItem('repo_analysis');
                navigate('/');
              }}
              className={`flex items-center gap-3 rounded-md text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all cursor-pointer ${
                expanded ? 'w-full px-3 py-2.5 justify-start' : 'w-10 h-10 justify-center'
              }`}
              title="Close Repo"
            >
              <LogOut size={20} />
              {expanded && <span className="text-sm font-medium">Close Repo</span>}
            </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        <Outlet />
      </div>
    </div>
  );
};

export default MainLayout;
