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
      <div className="p-8 text-center bg-surface border border-white/10 rounded-2xl">
        <p className="text-white/50">Your queue is empty. Paste a link to start downloading.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {activeJobs.map((job) => (
        <div key={job.id} className="p-4 bg-surface border border-white/10 rounded-2xl flex flex-col gap-4 transition-all hover:bg-white/5">
          <div className="flex flex-col md:flex-row gap-4 items-center w-full">
            {job.thumbnail ? (
               <img src={job.thumbnail} alt="thumbnail" className="w-16 h-16 object-cover rounded-md shadow-lg" />
            ) : (
               <div className="w-16 h-16 rounded-md bg-white/5 flex items-center justify-center">
                 <Loader2 className="w-5 h-5 animate-spin text-white/30" />
               </div>
            )}
            
            <div className="flex-1 w-full flex flex-col justify-center">
               <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-bold text-white line-clamp-1 text-lg" title={job.title || job.url}>
                      {job.title || 'Processing...'}
                    </h3>
                    <p className="text-sm text-white/50">{job.url}</p>
                  </div>
                  <button 
                    onClick={() => setShowLogsFor(showLogsFor === job.id ? null : job.id)}
                    className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-white/60 hover:text-white transition-colors"
                    title="Toggle Logs"
                  >
                    <Terminal className="w-4 h-4" />
                  </button>
               </div>
               
               {/* Progress Bar or Download Button */}
               <div className="flex items-center gap-3">
                 {job.status === 'completed' && job.filePath ? (
                    <a
                      href={job.filePath}
                      download={job.filePath.split('/').pop() || 'video.mp4'}
                      className="ml-auto inline-flex items-center gap-2 px-4 py-2 bg-tiktok-cyan/10 hover:bg-tiktok-cyan/20 text-tiktok-cyan rounded-lg transition-colors text-sm"
                    >
                      <Download className="w-4 h-4" /> Download
                    </a>
                 ) : (
                   <>
                     <span className="text-xs text-white/50 w-8 text-right">{job.progress}%</span>
                     <div className="relative flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden group">
                        <div 
                          className={clsx(
                            "absolute top-0 left-0 h-full rounded-full transition-all duration-300",
                            job.status === 'error' ? "bg-red-500" : "bg-white group-hover:bg-tiktok-cyan"
                          )}
                          style={{ width: `${Math.max(job.progress, 1)}%` }}
                        />
                     </div>
                     <span className="text-xs font-medium uppercase w-20 text-white/50">
                        {job.status}
                     </span>
                   </>
                 )}
               </div>
            </div>
          </div>
          
          {/* Live Logs Terminal */}
          {showLogsFor === job.id && (
            <div className="w-full bg-black/50 border border-white/5 rounded-xl p-4 font-mono text-xs text-white/70 overflow-hidden h-32 flex flex-col justify-end">
              {logs[job.id] ? logs[job.id].map((log, i) => (
                <div key={i} className="truncate">{log}</div>
              )) : (
                <div className="text-white/30 italic">Waiting for logs...</div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
