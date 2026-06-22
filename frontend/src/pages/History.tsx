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

      <div className="bg-surface border border-white/10 rounded-2xl overflow-hidden">
        {filteredJobs.length === 0 ? (
          <div className="p-12 text-center text-white/50">
            <FileVideo className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg">No media found.</p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-sm text-white/50 uppercase tracking-wider bg-black/20">
                <th className="p-4 font-medium">Media</th>
                <th className="p-4 font-medium">Platform</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {filteredJobs.map((job) => (
                <tr key={job.id} className="hover:bg-white/5 transition-colors group">
                  <td className="p-4">
                    <div className="flex items-center gap-4">
                      {job.thumbnail ? (
                        <img src={job.thumbnail} alt="Thumbnail" className="w-16 h-16 object-cover rounded-lg bg-black/50" />
                      ) : (
                        <div className="w-16 h-16 rounded-lg bg-white/5 flex items-center justify-center">
                          <FileVideo className="w-6 h-6 text-white/30" />
                        </div>
                      )}
                      <div>
                        <p className="font-semibold text-white line-clamp-1 max-w-sm" title={job.title || job.url}>
                          {job.title || job.url}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 capitalize text-white/80">{job.platform || 'Unknown'}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      {job.status === 'completed' && <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full">Completed</span>}
                      {job.status === 'error' && <span className="px-2 py-1 bg-red-500/20 text-red-400 text-xs rounded-full" title={job.errorMessage}>Error</span>}
                      {job.status === 'downloading' && <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full">Downloading {job.progress}%</span>}
                      {job.status === 'pending' && <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded-full">Pending</span>}
                    </div>
                  </td>
                  <td className="p-4 text-right">
                    {job.status === 'completed' && job.filePath && (
                      <a
                        href={job.filePath}
                        download={job.filePath.split('/').pop() || 'video.mp4'}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-tiktok-cyan/10 hover:bg-tiktok-cyan/20 text-tiktok-cyan rounded-lg transition-colors"
                      >
                        <Download className="w-4 h-4" /> Download
                      </a>
                    )}
                    {job.status === 'error' && (
                       <button
                         onClick={() => handleRetry(job.url)}
                         className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                       >
                         <RefreshCw className="w-4 h-4" /> Retry
                       </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
