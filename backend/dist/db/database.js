"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initDb = exports.db = void 0;
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const logger_1 = require("../utils/logger");
const dataDir = path_1.default.join(__dirname, '../../data');
if (!fs_1.default.existsSync(dataDir)) {
    fs_1.default.mkdirSync(dataDir, { recursive: true });
}
const dbPath = path_1.default.join(dataDir, 'database.sqlite');
exports.db = new better_sqlite3_1.default(dbPath, { verbose: (msg) => logger_1.logger.debug(msg) });
// Initialize database schema
const initDb = () => {
    try {
        const initSql = `
      CREATE TABLE IF NOT EXISTS jobs (
        id TEXT PRIMARY KEY,
        url TEXT NOT NULL,
        platform TEXT,
        title TEXT,
        status TEXT NOT NULL, -- pending, downloading, completed, error
        progress INTEGER DEFAULT 0,
        file_path TEXT,
        thumbnail TEXT,
        author TEXT,
        duration TEXT,
        error_message TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `;
        exports.db.exec(initSql);
        logger_1.logger.info('Database initialized successfully');
    }
    catch (err) {
        logger_1.logger.error('Failed to initialize database', err);
        throw err;
    }
};
exports.initDb = initDb;
