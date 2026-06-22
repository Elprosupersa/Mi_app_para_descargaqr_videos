# ===== BUILD FRONTEND =====
FROM node:20-slim AS frontend-builder

WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm install

COPY frontend/ ./
RUN npm run build


# ===== BUILD BACKEND =====
FROM node:20-slim AS backend-builder

WORKDIR /app/backend

# Instalar dependencias nativas para node-gyp (better-sqlite3)
RUN apt-get update && apt-get install -y python3 build-essential && \
    ln -s /usr/bin/python3 /usr/bin/python && \
    rm -rf /var/lib/apt/lists/*

COPY backend/package*.json ./
RUN npm install

COPY backend/ ./
RUN npx tsc


# ===== FINAL IMAGE =====
FROM node:20-slim

WORKDIR /app

# Instalar herramientas para yt-dlp y dependencias nativas para recompilar sqlite3 en prod
RUN apt-get update && \
    apt-get install -y ffmpeg python3 build-essential curl && \
    ln -s /usr/bin/python3 /usr/bin/python && \
    curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp && \
    chmod a+rx /usr/local/bin/yt-dlp && \
    rm -rf /var/lib/apt/lists/*

# backend compilado
COPY --from=backend-builder /app/backend/dist ./backend/dist
COPY --from=backend-builder /app/backend/package*.json ./backend/

# frontend build
COPY --from=frontend-builder /app/frontend/dist ./backend/public

WORKDIR /app/backend

# Se instalan dependencias de produccion (compilara better-sqlite3 nuevamente)
RUN npm install --omit=dev

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

# Ejecutar usando rutas relativas al WORKDIR (/app/backend)
CMD ["node", "dist/server.js"]
