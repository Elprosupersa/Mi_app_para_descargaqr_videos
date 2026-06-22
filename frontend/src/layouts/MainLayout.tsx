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
    <div className="min-h-screen bg-background text-white flex flex-col md:flex-row relative overflow-hidden">
      {/* Dynamic Background Glow */}
      <div className="fixed top-0 left-1/4 w-[50vw] h-[50vw] bg-tiktok-magenta/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed bottom-0 right-1/4 w-[40vw] h-[40vw] bg-tiktok-cyan/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 border-r border-white/10 bg-surface/80 backdrop-blur-md flex-col z-20">
        <div className="p-6 flex items-center gap-3 border-b border-white/10">
          <div className="p-2 bg-gradient-to-br from-tiktok-cyan to-tiktok-magenta rounded-xl shadow-lg">
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
                <Icon className={clsx('w-5 h-5 transition-colors duration-200', isActive ? 'text-tiktok-cyan' : '')} />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto relative z-10 pb-24 md:pb-0">
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>

      {/* Mobile Bottom App Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full bg-surface/80 backdrop-blur-xl border-t border-white/10 z-50 px-6 py-3 pb-safe flex justify-around items-center shadow-2xl">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.name}
              to={item.path}
              className={clsx(
                'flex flex-col items-center justify-center gap-1 transition-all duration-200 p-2 rounded-xl w-16',
                isActive ? 'text-tiktok-cyan' : 'text-white/50 hover:text-white/80'
              )}
            >
              <Icon className={clsx('w-6 h-6 transition-transform duration-200', isActive ? 'scale-110' : '')} />
              <span className="text-[10px] font-medium">{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
};
