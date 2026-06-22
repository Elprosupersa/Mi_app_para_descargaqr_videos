import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Loader2, Download, FileVideo, RefreshCw, Filter } from 'lucide-react';

interface Job {
  id: string;
  url: string;
  platform?: string;
  title?: string;
  status: 'pending' | 'downloading' | 'completed' | 'error';
  progress: number;
  thumbnail?: string;
  errorMessage?: string;
  filePath?: string;
  created_at: string;
}

export const HistoryPage: React.FC = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterPlatform, setFilterPlatform] = useState<string>('all');

  const fetchHistory = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const response = await axios.get(`${apiUrl}/api/media/history`);
      if (response.data.success) {
        setJobs(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch history', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleRetry = async (url: string) => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || '';
      await axios.post(`${apiUrl}/api/media/process`, { url });
      fetchHistory(); // Refresh to show new pending job
    } catch (err) {
      console.error('Failed to retry', err);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-tiktok-cyan" />
      </div>
    );
  }

  const platforms = ['all', ...Array.from(new Set(jobs.map(j => j.platform).filter(Boolean)))];
  const filteredJobs = filterPlatform === 'all' ? jobs : jobs.filter(j => j.platform === filterPlatform);

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Download History</h1>
        <div className="flex items-center gap-2 bg-surface border border-white/10 px-4 py-2 rounded-xl">
          <Filter className="w-4 h-4 text-white/50" />
          <select 
            value={filterPlatform}
            onChange={(e) => setFilterPlatform(e.target.value)}
            className="bg-transparent text-white outline-none text-sm capitalize"
          >
            {platforms.map(p => (
              <option key={p} value={p} className="bg-black text-white">{p}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-surface/40 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
        {filteredJobs.length === 0 ? (
          <div className="p-12 text-center text-white/50 animate-in fade-in">
            <FileVideo className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg">No media found.</p>
          </div>
        ) : (
          <div className="w-full">
            {/* Desktop Header */}
            <div className="hidden md:grid grid-cols-12 gap-4 p-4 text-xs font-semibold text-white/40 uppercase tracking-wider bg-black/40 border-b border-white/10">
              <div className="col-span-6">Media</div>
              <div className="col-span-2">Platform</div>
              <div className="col-span-2">Status</div>
              <div className="col-span-2 text-right">Actions</div>
            </div>
            
            {/* Unified Rows/Cards List */}
            <div className="divide-y divide-white/10">
              {filteredJobs.map((job) => (
                <div key={job.id} className="flex flex-col md:grid md:grid-cols-12 gap-4 p-4 md:items-center hover:bg-white/5 transition-all duration-300 group">
                  
                  {/* Media Info (Thumbnail + Title) */}
                  <div className="col-span-6 flex items-start md:items-center gap-4">
                    {job.thumbnail ? (
                      <img src={job.thumbnail} alt="Thumbnail" className="w-24 h-24 md:w-16 md:h-16 object-cover rounded-xl shadow-lg border border-white/5" />
                    ) : (
                      <div className="w-24 h-24 md:w-16 md:h-16 rounded-xl bg-white/5 flex items-center justify-center border border-white/5">
                        <FileVideo className="w-6 h-6 md:w-5 md:h-5 text-white/30" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-white text-base md:text-sm line-clamp-2 md:line-clamp-1 break-words" title={job.title || job.url}>
                        {job.title || job.url}
                      </p>
                      {/* Show Platform inline on mobile */}
                      <p className="md:hidden text-xs text-white/50 mt-1 capitalize flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-tiktok-cyan inline-block"></span>
                        {job.platform || 'Unknown'}
                      </p>
                    </div>
                  </div>

                  {/* Platform (Desktop only) */}
                  <div className="hidden md:block col-span-2 capitalize text-white/80 text-sm">
                    {job.platform || 'Unknown'}
                  </div>

                  {/* Status */}
                  <div className="col-span-2 flex items-center">
                    {job.status === 'completed' && <span className="px-3 py-1 bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-medium rounded-full">Completed</span>}
                    {job.status === 'error' && <span className="px-3 py-1 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium rounded-full" title={job.errorMessage}>Error</span>}
                    {job.status === 'downloading' && <span className="px-3 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium rounded-full">Downloading {job.progress}%</span>}
                    {job.status === 'pending' && <span className="px-3 py-1 bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-xs font-medium rounded-full">Pending</span>}
                  </div>

                  {/* Actions */}
                  <div className="col-span-2 md:text-right mt-2 md:mt-0 w-full md:w-auto">
                    {job.status === 'completed' && job.filePath && (
                      <a
                        href={job.filePath}
                        download={job.filePath.split('/').pop() || 'video.mp4'}
                        className="w-full md:w-auto inline-flex justify-center items-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-tiktok-cyan/20 border border-white/5 hover:border-tiktok-cyan/30 text-white hover:text-tiktok-cyan rounded-xl transition-all duration-200 text-sm font-medium active:scale-95"
                      >
                        <Download className="w-4 h-4" /> Download
                      </a>
                    )}
                    {job.status === 'error' && (
                       <button
                         onClick={() => handleRetry(job.url)}
                         className="w-full md:w-auto inline-flex justify-center items-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-all duration-200 md:opacity-0 md:group-hover:opacity-100 text-sm font-medium active:scale-95"
                       >
                         <RefreshCw className="w-4 h-4" /> Retry
                       </button>
                    )}
                  </div>

                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
