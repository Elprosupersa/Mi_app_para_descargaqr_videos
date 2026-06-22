import React, { useState } from 'react';
import axios from 'axios';
import { Search, Loader2, AlertCircle } from 'lucide-react';
import { MediaQueue } from '../components/MediaQueue';

export const Dashboard: React.FC = () => {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleProcess = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const response = await axios.post(`${apiUrl}/api/media/process`, { url });
      
      if (response.data.success) {
        setUrl(''); // Clear input
      } else {
        setError(response.data.message || 'Error queuing the media.');
      }
    } catch (err: any) {
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError('Unexpected error connecting to server.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 md:space-y-12">
      <header className="text-center space-y-4 pt-4 md:pt-8">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight">
          Media <span className="text-transparent bg-clip-text bg-gradient-to-r from-tiktok-cyan to-tiktok-magenta">Analyzer</span> & Downloader
        </h1>
        <p className="text-base md:text-lg text-white/60 px-4">
          Paste a link from YouTube, TikTok, or Instagram to extract and download media.
        </p>
      </header>

      <form onSubmit={handleProcess} className="relative group w-full max-w-2xl mx-auto px-4 md:px-0">
        <div className="absolute -inset-1 bg-gradient-to-r from-tiktok-cyan to-tiktok-magenta rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-500"></div>
        <div className="relative flex flex-col sm:flex-row items-center bg-surface/90 backdrop-blur-md border border-white/10 rounded-2xl p-2 shadow-2xl gap-2">
          <input
            type="url"
            required
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://www.youtube.com/watch?v=..."
            className="w-full flex-grow bg-transparent border-none outline-none text-white px-4 py-3 placeholder:text-white/30 disabled:opacity-50"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !url.trim()}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-white text-black font-semibold rounded-xl hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <Search className="w-5 h-5" />
                <span>Process</span>
              </>
            )}
          </button>
        </div>
      </form>

      {error && (
        <div className="max-w-2xl mx-auto flex items-center gap-3 p-4 mx-4 md:mx-auto rounded-xl bg-red-500/10 border border-red-500/20 text-red-200 animate-in fade-in slide-in-from-bottom-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm md:text-base">{error}</p>
        </div>
      )}

      {/* Active Queue Component */}
      <section className="px-4 md:px-0">
        <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6 flex items-center gap-2">
          Active Processing Queue
        </h2>
        <MediaQueue />
      </section>
    </div>
  );
};
