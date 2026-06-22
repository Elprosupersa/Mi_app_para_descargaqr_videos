import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, History, Video } from 'lucide-react';
import clsx from 'clsx';

export const MainLayout: React.FC = () => {
  const location = useLocation();

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'History', path: '/history', icon: History },
  ];

  return (
    <div className="min-h-screen bg-black text-white flex">
      {/* Sidebar */}
      <aside className="w-64 border-r border-white/10 bg-surface flex flex-col">
        <div className="p-6 flex items-center gap-3 border-b border-white/10">
          <div className="p-2 bg-gradient-to-br from-tiktok-cyan to-tiktok-magenta rounded-xl">
            <Video className="w-6 h-6 text-white" />
          </div>
          <span className="font-bold text-xl tracking-tight">MediaTool</span>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <Link
                key={item.name}
                to={item.path}
                className={clsx(
                  'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200',
                  isActive 
                    ? 'bg-white/10 text-white font-medium shadow-sm' 
                    : 'text-white/60 hover:bg-white/5 hover:text-white'
                )}
              >
                <Icon className={clsx('w-5 h-5', isActive ? 'text-tiktok-cyan' : '')} />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative">
        <div className="absolute top-0 w-full h-96 bg-gradient-to-b from-tiktok-magenta/10 to-transparent pointer-events-none" />
        <div className="p-8 relative z-10">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
