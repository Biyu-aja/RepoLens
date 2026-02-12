import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { 
  Home, 
  LayoutDashboard, 
  MessageSquare, 
  LogOut,
  Folder,
  Activity
} from 'lucide-react';

const MainLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

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
    },
    { 
      id: 'activity', 
      icon: Activity, 
      label: 'Pulse', 
      path: '/activity'
    }
  ];

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#0a0a0c] text-white font-sans">
      {/* Activity Bar */}
      {/* Desktop Sidebar - Hidden on mobile, fixed width on desktop */}
      <div 
        className="hidden md:flex bg-[#101014] border-r border-white/10 flex-col pt-4 z-40 shrink-0 w-[180px] px-3"
      >
        {/* Top Actions */}
        <div className="flex flex-col gap-2 w-full">
           <button
              onClick={() => navigate('/')}
              className="flex items-center gap-3 rounded-md text-gray-400 hover:text-white hover:bg-white/5 transition-all cursor-pointer w-full px-3 py-2.5 justify-start"
              title="Home / Landing"
            >
              <Home size={20} />
              <span className="text-sm font-medium">Home</span>
            </button>

            <div className="w-full h-px bg-white/10 my-1" />

            {menuItems.map((item) => {
              const isActive = location.pathname.startsWith(item.path);
              return (
                <button
                  key={item.id}
                  onClick={() => navigate(item.path)}
                  className={`flex items-center gap-3 rounded-md transition-all cursor-pointer w-full px-3 py-2.5 justify-start ${isActive ? 'text-white bg-primary' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
                  title={item.label}
                >
                  <item.icon size={20} />
                  <span className="text-sm font-medium">{item.label}</span>
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
              className="flex items-center gap-3 rounded-md text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all cursor-pointer w-full px-3 py-2.5 justify-start"
              title="Close Repo"
            >
              <LogOut size={20} />
              <span className="text-sm font-medium">Close Repo</span>
            </button>
        </div>
      </div>

       {/* Mobile Bottom Navigation */}
       <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[#101014] border-t border-white/10 flex justify-around items-center h-16 z-50 px-2 pb-safe">
        <button
            onClick={() => navigate('/')}
            className="flex flex-col items-center gap-1 p-2 text-gray-400 hover:text-white"
        >
            <Home size={20} />
            <span className="text-[10px]">Home</span>
        </button>

        {menuItems.map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            return (
            <button
                key={item.id}
                onClick={() => navigate(item.path)}
                className={`flex flex-col items-center gap-1 p-2 ${isActive ? 'text-white' : 'text-gray-500 hover:text-white'}`}
            >
                <item.icon size={20} />
                <span className="text-[10px]">{item.label}</span>
            </button>
            );
        })}

        <button
             onClick={() => {
                localStorage.removeItem('repo_analysis');
                navigate('/');
              }}
             className="flex flex-col items-center gap-1 p-2 text-red-400 hover:text-red-300"
        >
            <LogOut size={20} />
             <span className="text-[10px]">Close</span>
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden relative pb-16 md:pb-0">
        <Outlet />
      </div>
    </div>
  );
};

export default MainLayout;
