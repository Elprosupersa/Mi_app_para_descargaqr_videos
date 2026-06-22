"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.io = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const media_routes_1 = __importDefault(require("./routes/media.routes"));
const database_1 = require("./db/database");
const logger_1 = require("./utils/logger");
dotenv_1.default.config();
const app = (0, express_1.default)();
const httpServer = (0, http_1.createServer)(app);
// Socket.io setup
exports.io = new socket_io_1.Server(httpServer, {
    cors: {
        origin: '*',
    }
});
const PORT = process.env.PORT || 3000;
// Initialize Database
(0, database_1.initDb)();
// Middlewares
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use((0, morgan_1.default)('dev'));
// Rate limiting
const limiter = (0, express_rate_limit_1.default)({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
    message: 'Too many requests, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/api', limiter);
// Routes
app.use('/api/media', media_routes_1.default);
// Serve static frontend in production
app.use(express_1.default.static(path_1.default.join(__dirname, 'public')));
app.get('*', (req, res) => {
    res.sendFile(path_1.default.join(__dirname, 'public', 'index.html'));
});
// Error Handling
app.use((err, req, res, next) => {
    logger_1.logger.error('Unhandled server error', err);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
});
httpServer.listen(PORT, () => {
    logger_1.logger.info(`🚀 Server running on port ${PORT}`);
});
