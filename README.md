# TikTok Video Downloader

Una aplicación web moderna y robusta para extraer información pública de videos de TikTok. 

Esta aplicación está construida con:
- **Frontend**: React, Vite, TailwindCSS (v4), TypeScript.
- **Backend**: Node.js, Express, TypeScript, Zod.
- **Infraestructura**: Docker y Docker Compose.

## Requisitos Previos (Linux)

- [Node.js](https://nodejs.org/es/) (v18 o superior)
- [Docker](https://docs.docker.com/engine/install/ubuntu/) y [Docker Compose](https://docs.docker.com/compose/install/)

## Instalación para Desarrollo Local

1. Instalar dependencias del backend:
   ```bash
   cd backend
   npm install
   ```

2. Instalar dependencias del frontend:
   ```bash
   cd ../frontend
   npm install
   ```

3. Levantar el Backend (puerto 3000):
   ```bash
   cd backend
   npm run dev
   # Nota: Deberás añadir un script "dev": "tsx watch src/server.ts" en el package.json
   ```

4. Levantar el Frontend (puerto 5173 por defecto):
   ```bash
   cd frontend
   npm run dev
   ```

## Despliegue con Docker (Recomendado para Producción)

Para levantar toda la aplicación (Frontend y Backend unificados) con un solo comando:

```bash
docker-compose up --build -d
```

La aplicación estará disponible en `http://localhost:3000`. 
El contenedor Docker primero construye el frontend y luego sirve los archivos estáticos desde el backend en Express, asegurando una configuración lista para producción y sin problemas de CORS.

## Funcionalidades

- **Diseño Moderno:** Interfaz inspirada en herramientas SaaS y AI, con "Dark Mode" por defecto, animaciones con Tailwind y diseño "Glassmorphism".
- **Extracción de Datos:** Utiliza el endpoint oficial oEmbed de TikTok para extraer de forma segura y legal la miniatura, título y autor del video.
- **Validación de URL:** El backend valida las entradas con Zod.
- **Manejo de Errores:** Mensajes claros ante URLs incorrectas o videos privados/eliminados.
- **Políticas de Descarga:** Respeta las políticas de TikTok, deshabilitando la descarga de video si no es proporcionada oficialmente.
