"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTikTokMetadata = void 0;
const axios_1 = __importDefault(require("axios"));
const getTikTokMetadata = async (url) => {
    try {
        // Usamos el endpoint oEmbed oficial de TikTok, que siempre es público y legal.
        const oembedUrl = `https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`;
        const response = await axios_1.default.get(oembedUrl);
        if (response.data && response.data.title) {
            return {
                title: response.data.title,
                author: response.data.author_name || 'Desconocido',
                thumbnail: response.data.thumbnail_url || '',
                duration: 'N/A', // oEmbed no provee la duración
                downloadable: false, // Por políticas de TikTok, no proveen URL directa oficial
                videoUrl: undefined
            };
        }
        return null;
    }
    catch (error) {
        console.error('Error al obtener metadata de TikTok:', error.message);
        return null;
    }
};
exports.getTikTokMetadata = getTikTokMetadata;
