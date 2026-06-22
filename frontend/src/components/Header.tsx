import React from 'react';
import { Video } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <header className="w-full flex items-center justify-between py-6 px-4 md:px-8 bg-surface border-b border-white/5 sticky top-0 z-10 backdrop-blur-md bg-opacity-80">
      <div className="flex items-center gap-3">
        <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-tiktok-cyan to-tiktok-magenta shadow-lg">
          <Video className="w-5 h-5 text-white" />
        </div>
        <h1 className="text-xl font-bold tracking-tight text-white">
          TikTok <span className="opacity-70 font-medium">Downloader</span>
        </h1>
      </div>
    </header>
  );
};
