import React from 'react';
import { Download, AlertCircle } from 'lucide-react';

interface VideoPreviewProps {
  metadata: {
    title: string;
    author: string;
    thumbnail: string;
    duration?: string;
    downloadable: boolean;
    videoUrl?: string;
  };
}

export const VideoPreview: React.FC<VideoPreviewProps> = ({ metadata }) => {
  return (
    <div className="mt-8 w-full max-w-2xl bg-surface/50 border border-white/10 rounded-2xl p-6 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row gap-6">
        <div className="w-full md:w-1/3 aspect-[9/16] rounded-xl overflow-hidden shadow-2xl relative bg-black/50">
          {metadata.thumbnail ? (
            <img 
              src={metadata.thumbnail} 
              alt={metadata.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white/30">
              No Thumbnail
            </div>
          )}
        </div>
        
        <div className="w-full md:w-2/3 flex flex-col">
          <div className="mb-4">
            <h2 className="text-xl font-bold text-white mb-2 line-clamp-3 leading-snug">
              {metadata.title}
            </h2>
            <p className="text-tiktok-cyan font-medium">@{metadata.author}</p>
          </div>
          
          <div className="flex-grow"></div>
          
          {metadata.downloadable && metadata.videoUrl ? (
            <a 
              href={metadata.videoUrl} 
              download
              target="_blank"
              rel="noreferrer"
              className="mt-6 flex items-center justify-center gap-2 w-full py-3.5 px-4 bg-white text-black font-semibold rounded-xl hover:bg-gray-100 transition-all active:scale-[0.98]"
            >
              <Download className="w-5 h-5" />
              Descargar Video
            </a>
          ) : (
            <div className="mt-6 flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-200 text-sm">
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-400" />
              <p>La descarga directa no está disponible en este momento debido a las políticas de la plataforma, pero puedes visualizar la información pública del video.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
