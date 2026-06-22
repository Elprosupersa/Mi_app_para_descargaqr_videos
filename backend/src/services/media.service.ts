import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { logger } from '../utils/logger';

export interface MediaMetadata {
  title: string;
  author: string;
  thumbnail: string;
  duration?: string;
  platform: string;
  downloadable: boolean;
  alternativeLinks?: string[];
}

const USER_AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2.1 Safari/605.1.15",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36"
];

const getRandomUserAgent = () => USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];

const getBaseArgs = () => {
  const args = ['yt-dlp', '--user-agent', getRandomUserAgent()];
  if (process.env.YTDLP_COOKIES_FILE && fs.existsSync(process.env.YTDLP_COOKIES_FILE)) {
     args.push('--cookies', process.env.YTDLP_COOKIES_FILE);
  }
  return args;
};

export const extractMetadata = async (url: string): Promise<MediaMetadata> => {
  return new Promise((resolve, reject) => {
    logger.info(`Extracting metadata for ${url}`);
    
    const args = [...getBaseArgs(), '-J', url];
    const command = args.shift() || 'yt-dlp';
    const ytDlpProcess = spawn(command, args);
    
    let stdoutData = '';
    let stderrData = '';

    ytDlpProcess.stdout.on('data', (data) => {
      stdoutData += data.toString();
    });

    ytDlpProcess.stderr.on('data', (data) => {
      stderrData += data.toString();
    });

    ytDlpProcess.on('close', (code) => {
      if (code !== 0) {
        logger.error(`yt-dlp metadata extraction failed with code ${code}: ${stderrData}`);
        return reject(new Error(`Failed to extract metadata: ${stderrData}`));
      }

      try {
        const json = JSON.parse(stdoutData);
        const metadata: MediaMetadata = {
          title: json.title || 'Unknown Title',
          author: json.uploader || json.channel || json.extractor || 'Unknown Author',
          thumbnail: json.thumbnail || '',
          duration: json.duration_string || `${json.duration || 0}s`,
          platform: json.extractor || 'unknown',
          downloadable: true,
          alternativeLinks: json.formats ? json.formats.filter((f: any) => f.url).map((f: any) => f.url).slice(0, 3) : []
        };
        resolve(metadata);
      } catch (err) {
        logger.error('Failed to parse yt-dlp JSON output', err);
        reject(new Error('Invalid metadata format'));
      }
    });
  });
};

export const downloadMedia = (
  url: string,
  jobId: string,
  onProgress: (progress: number) => void,
  onLog: (log: string) => void
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const downloadsDir = path.join(__dirname, '../../downloads');
    if (!fs.existsSync(downloadsDir)) {
      fs.mkdirSync(downloadsDir, { recursive: true });
    }

    const outputTemplate = path.join(downloadsDir, `${jobId}.%(ext)s`);
    
    logger.info(`Starting download for ${url} -> ${jobId}`);
    
    const args = [
      ...getBaseArgs(),
      '-f', 'bestvideo+bestaudio/best',
      '--merge-output-format', 'mp4',
      '--no-playlist',
      '--retries', '5',
      '-o', outputTemplate,
      url
    ];
    
    const command = args.shift() || 'yt-dlp';
    const ytDlpProcess = spawn(command, args);

    let stderrData = '';
    let finalFilePath = '';

    ytDlpProcess.stdout.on('data', (data) => {
      const output = data.toString();
      onLog(output.trim());
      
      const match = output.match(/\[download\]\s+([\d.]+)%/);
      if (match && match[1]) {
        const progress = parseFloat(match[1]);
        if (!isNaN(progress)) {
          onProgress(progress);
        }
      }
      
      const fileMatch = output.match(/Destination:\s+(.+)|already been downloaded and merged in(?:to)?\s+(.+)|Merging formats into "([^"]+)"/);
      if (fileMatch) {
         finalFilePath = fileMatch[1] || fileMatch[2] || fileMatch[3] || finalFilePath;
      }
    });

    ytDlpProcess.stderr.on('data', (data) => {
      const output = data.toString();
      onLog(`[ERROR] ${output.trim()}`);
      stderrData += output;
    });

    ytDlpProcess.on('close', (code) => {
      if (code !== 0) {
        logger.error(`yt-dlp download failed with code ${code}: ${stderrData}`);
        return reject(new Error(`Download failed: ${stderrData}`));
      }
      
      // If finalFilePath was an intermediate file that was deleted after merge, it won't exist
      if (!finalFilePath || !fs.existsSync(finalFilePath)) {
         const files = fs.readdirSync(downloadsDir);
         // Find the final file, ignoring parts, ytdl, and format-specific intermediate files (e.g. .f251.webm)
         // Since yt-dlp cleans up on success, usually only the final merged file remains.
         const downloadedFile = files.find(f => f.startsWith(jobId) && !f.endsWith('.part') && !f.endsWith('.ytdl'));
         if (downloadedFile) {
             finalFilePath = path.join(downloadsDir, downloadedFile);
         } else {
             return reject(new Error('Downloaded file not found'));
         }
      }

      logger.info(`Download completed successfully: ${finalFilePath}`);
      resolve(finalFilePath);
    });
  });
};
