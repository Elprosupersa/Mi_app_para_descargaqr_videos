import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { logger } from '../utils/logger';

const dataDir = path.join(__dirname, '../../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'database.sqlite');
export const db = new Database(dbPath, { verbose: (msg: any) => logger.debug(msg) });

// Initialize database schema
export const initDb = () => {
  try {
    const initSql = `
      CREATE TABLE IF NOT EXISTS jobs (
        id TEXT PRIMARY KEY,
        session_id TEXT,
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
    db.exec(initSql);
    
    // Migration for existing databases
    try {
      db.exec('ALTER TABLE jobs ADD COLUMN session_id TEXT;');
    } catch (e) {
      // Column probably already exists
    }
    
    logger.info('Database initialized successfully');
  } catch (err) {
    logger.error('Failed to initialize database', err);
    throw err;
  }
};
