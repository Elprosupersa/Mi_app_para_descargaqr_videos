import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Loader2, Terminal, Download } from 'lucide-react';
import clsx from 'clsx';
import { io, Socket } from 'socket.io-client';

interface Job {
  id: string;
  url: string;
  title?: string;
  status: 'pending' | 'downloading' | 'completed' | 'error';
  progress: number;
  thumbnail?: string;
  filePath?: string;
}

export const MediaQueue: React.FC = () => {
  const [activeJobs, setActiveJobs] = useState<Job[]>([]);
  const [logs, setLogs] = useState<{ [jobId: string]: string[] }>({});
  const [showLogsFor, setShowLogsFor] = useState<string | null>(null);

  useEffect(() => {
    const apiUrl = import.meta.env.VITE_API_URL || '';
    
    // Initial fetch
    axios.get(`${apiUrl}/api/media/history`).then(res => {
      if (res.data.success) {
        setActiveJobs(res.data.data.filter((j: Job) => j.status === 'pending' || j.status === 'downloading'));
      }
    });

    const socket: Socket = io(apiUrl || '/');

    socket.on('jobAdded', (job: Job) => {
      setActiveJobs(prev => [job, ...prev]);
    });

    socket.on('jobUpdated', (updatedJob: Job) => {
      setActiveJobs(prev => {
        if (updatedJob.status === 'completed' || updatedJob.status === 'error') {
           // Keep completed jobs in queue for 15 seconds so user can click download
           setTimeout(() => {
             setActiveJobs(current => current.filter(j => j.id !== updatedJob.id));
           }, 15000);
        }
        
        const exists = prev.find(j => j.id === updatedJob.id);
        if (exists) {
          return prev.map(j => j.id === updatedJob.id ? updatedJob : j);
        } else if (updatedJob.status === 'pending' || updatedJob.status === 'downloading') {
          return [updatedJob, ...prev];
        }
        return prev;
      });
    });

    socket.on('jobLog', ({ jobId, log }: { jobId: string, log: string }) => {
       setLogs(prev => ({
         ...prev,
         [jobId]: [...(prev[jobId] || []), log].slice(-20) // Keep last 20 logs
       }));
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  if (activeJobs.length === 0) {
    return (
      <div className="p-8 text-center bg-surface/40 backdrop-blur-md border border-white/10 rounded-2xl flex flex-col items-center justify-center min-h-[160px] animate-in fade-in">
        <p className="text-white/50 text-sm md:text-base">Your queue is empty. Paste a link to start downloading.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {activeJobs.map((job) => (
        <div key={job.id} className="p-4 md:p-5 bg-surface/60 backdrop-blur-xl border border-white/10 rounded-2xl flex flex-col gap-4 transition-all duration-300 hover:bg-white/10 hover:border-white/20 hover:scale-[1.01] shadow-lg">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center w-full">
            {job.thumbnail ? (
               <img src={job.thumbnail} alt="thumbnail" className="w-full sm:w-20 h-32 sm:h-20 object-cover rounded-xl shadow-lg border border-white/5" />
            ) : (
               <div className="w-full sm:w-20 h-32 sm:h-20 rounded-xl bg-white/5 flex items-center justify-center border border-white/5">
                 <Loader2 className="w-6 h-6 animate-spin text-white/30" />
               </div>
            )}
            
            <div className="flex-1 w-full flex flex-col justify-center min-w-0">
               <div className="flex justify-between items-start mb-3 sm:mb-2 gap-4">
                  <div className="min-w-0">
                    <h3 className="font-bold text-white truncate text-base md:text-lg" title={job.title || job.url}>
                      {job.title || 'Fetching metadata...'}
                    </h3>
                    <p className="text-xs md:text-sm text-white/50 truncate">{job.url}</p>
                  </div>
                  <button 
                    onClick={() => setShowLogsFor(showLogsFor === job.id ? null : job.id)}
                    className="flex-shrink-0 p-2 bg-white/5 hover:bg-white/10 rounded-xl text-white/60 hover:text-white transition-colors active:scale-95"
                    title="Toggle Logs"
                  >
                    <Terminal className="w-4 h-4 md:w-5 md:h-5" />
                  </button>
               </div>
               
               {/* Progress Bar or Download Button */}
               <div className="flex flex-wrap items-center gap-3">
                 {job.status === 'completed' && job.filePath ? (
                    <a
                      href={job.filePath}
                      download={job.filePath.split('/').pop() || 'video.mp4'}
                      className="w-full sm:w-auto mt-2 sm:mt-0 sm:ml-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-tiktok-cyan/10 hover:bg-tiktok-cyan/20 text-tiktok-cyan font-medium rounded-xl transition-colors text-sm"
                    >
                      <Download className="w-4 h-4" /> Download File
                    </a>
                 ) : (
                   <div className="w-full flex items-center gap-3">
                     <div className="flex items-center gap-2 w-24">
                        {job.status === 'error' && <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>}
                        {job.status === 'downloading' && <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>}
                        {job.status === 'pending' && <span className="w-2 h-2 rounded-full bg-yellow-500"></span>}
                        <span className="text-xs font-semibold uppercase text-white/70 tracking-wider">
                           {job.status}
                        </span>
                     </div>
                     
                     <div className="relative flex-1 h-2 bg-black/40 rounded-full overflow-hidden group">
                        <div 
                          className={clsx(
                            "absolute top-0 left-0 h-full rounded-full transition-all duration-300",
                            job.status === 'error' ? "bg-red-500" : "bg-gradient-to-r from-tiktok-cyan to-tiktok-magenta"
                          )}
                          style={{ width: `${Math.max(job.progress, 1)}%` }}
                        />
                     </div>
                     <span className="text-xs text-white/50 w-10 text-right font-mono">{job.progress}%</span>
                   </div>
                 )}
               </div>
            </div>
          </div>
          
          {/* Live Logs Terminal */}
          {showLogsFor === job.id && (
            <div className="w-full bg-black/80 backdrop-blur-md border border-white/10 rounded-xl p-4 font-mono text-xs text-tiktok-cyan/80 overflow-hidden h-40 flex flex-col justify-end shadow-inner animate-in slide-in-from-top-2">
              {logs[job.id] ? logs[job.id].map((log, i) => (
                <div key={i} className="truncate hover:text-white transition-colors">{log}</div>
              )) : (
                <div className="text-white/30 italic flex items-center gap-2">
                  <Loader2 className="w-3 h-3 animate-spin" /> Waiting for logs...
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
