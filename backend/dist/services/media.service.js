"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.downloadMedia = exports.extractMetadata = void 0;
const child_process_1 = require("child_process");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const logger_1 = require("../utils/logger");
const USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2.1 Safari/605.1.15",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36"
];
const getRandomUserAgent = () => USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
const getBaseArgs = () => {
    const args = ['yt-dlp', '--user-agent', getRandomUserAgent()];
    if (process.env.YTDLP_COOKIES_FILE && fs_1.default.existsSync(process.env.YTDLP_COOKIES_FILE)) {
        args.push('--cookies', process.env.YTDLP_COOKIES_FILE);
    }
    return args;
};
const extractMetadata = async (url) => {
    return new Promise((resolve, reject) => {
        logger_1.logger.info(`Extracting metadata for ${url}`);
        const args = [...getBaseArgs(), '-J', url];
        const ytDlpProcess = (0, child_process_1.spawn)('npx', args);
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
                logger_1.logger.error(`yt-dlp metadata extraction failed with code ${code}: ${stderrData}`);
                return reject(new Error(`Failed to extract metadata: ${stderrData}`));
            }
            try {
                const json = JSON.parse(stdoutData);
                const metadata = {
                    title: json.title || 'Unknown Title',
                    author: json.uploader || json.channel || json.extractor || 'Unknown Author',
                    thumbnail: json.thumbnail || '',
                    duration: json.duration_string || `${json.duration || 0}s`,
                    platform: json.extractor || 'unknown',
                    downloadable: true,
                    alternativeLinks: json.formats ? json.formats.filter((f) => f.url).map((f) => f.url).slice(0, 3) : []
                };
                resolve(metadata);
            }
            catch (err) {
                logger_1.logger.error('Failed to parse yt-dlp JSON output', err);
                reject(new Error('Invalid metadata format'));
            }
        });
    });
};
exports.extractMetadata = extractMetadata;
const downloadMedia = (url, jobId, onProgress, onLog) => {
    return new Promise((resolve, reject) => {
        const downloadsDir = path_1.default.join(__dirname, '../../downloads');
        if (!fs_1.default.existsSync(downloadsDir)) {
            fs_1.default.mkdirSync(downloadsDir, { recursive: true });
        }
        const outputTemplate = path_1.default.join(downloadsDir, `${jobId}.%(ext)s`);
        logger_1.logger.info(`Starting download for ${url} -> ${jobId}`);
        const args = [
            ...getBaseArgs(),
            '-f', 'bestvideo+bestaudio/best',
            '--merge-output-format', 'mp4',
            '--no-playlist',
            '--retries', '5',
            '-o', outputTemplate,
            url
        ];
        const ytDlpProcess = (0, child_process_1.spawn)('npx', args);
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
            const fileMatch = output.match(/Destination:\s+(.+)|already been downloaded and merged in(?:to)?\s+(.+)/);
            if (fileMatch) {
                finalFilePath = fileMatch[1] || fileMatch[2] || finalFilePath;
            }
        });
        ytDlpProcess.stderr.on('data', (data) => {
            const output = data.toString();
            onLog(`[ERROR] ${output.trim()}`);
            stderrData += output;
        });
        ytDlpProcess.on('close', (code) => {
            if (code !== 0) {
                logger_1.logger.error(`yt-dlp download failed with code ${code}: ${stderrData}`);
                return reject(new Error(`Download failed: ${stderrData}`));
            }
            if (!finalFilePath) {
                const files = fs_1.default.readdirSync(downloadsDir);
                const downloadedFile = files.find(f => f.startsWith(jobId) && !f.endsWith('.part') && !f.endsWith('.ytdl'));
                if (downloadedFile) {
                    finalFilePath = path_1.default.join(downloadsDir, downloadedFile);
                }
                else {
                    return reject(new Error('Downloaded file not found'));
                }
            }
            logger_1.logger.info(`Download completed successfully: ${finalFilePath}`);
            resolve(finalFilePath);
        });
    });
};
exports.downloadMedia = downloadMedia;
