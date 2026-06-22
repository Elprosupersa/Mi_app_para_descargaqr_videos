"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyzeUrl = void 0;
const zod_1 = require("zod");
const tiktok_service_1 = require("../services/tiktok.service");
const analyzeSchema = zod_1.z.object({
    url: zod_1.z.string().url('La URL proporcionada no es válida.').regex(/tiktok\.com/, 'Debe ser una URL de TikTok.'),
});
const analyzeUrl = async (req, res) => {
    try {
        const parseResult = analyzeSchema.safeParse(req.body);
        if (!parseResult.success) {
            res.status(400).json({
                success: false,
                message: parseResult.error.issues[0].message,
            });
            return;
        }
        const { url } = parseResult.data;
        const metadata = await (0, tiktok_service_1.getTikTokMetadata)(url);
        if (!metadata) {
            res.status(404).json({
                success: false,
                message: 'No se pudo obtener información de este video. Es posible que sea privado o haya sido eliminado.',
            });
            return;
        }
        res.json({
            success: true,
            data: metadata,
        });
    }
    catch (error) {
        console.error('Error en analyzeUrl:', error.message);
        res.status(500).json({
            success: false,
            message: 'Error al procesar la solicitud.',
        });
    }
};
exports.analyzeUrl = analyzeUrl;
