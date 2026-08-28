# Desplegar Deckora en Render (un solo servicio)

## Resumen

Frontend (Vite/React) + Backend (Express + Socket.io) se ejecutan en **el mismo proceso Node**.

```
Request → Express
            ├── /socket.io  → Socket.io
            ├── /health     → health check
            └── /*          → archivos estáticos de apps/web/dist (SPA)
```

## Pasos rápidos

### 1. Blueprint (más fácil)

1. [render.com](https://dashboard.render.com) → **New** → **Blueprint**
2. Conecta el repositorio `VIGARPAST-777-2/card-games-platform`
3. Confirma. Render usa el archivo `render.yaml`.

### 2. Manual

1. **New** → **Web Service**
2. Conecta el repo
3. Ajustes:

```
Name:           deckora
Region:         Frankfurt (o el que prefieras)
Runtime:        Node
Build Command:  npm install -g pnpm@9 && pnpm install && pnpm build
Start Command:  pnpm start
Plan:           Free
```

4. Environment:

```
NODE_ENV=production
NODE_VERSION=22
```

5. Advanced → Health Check Path: `/health`

> **Importante:** No uses `corepack enable` en Render. El sistema de archivos es de solo lectura y falla con `EROFS`.

## Comandos que se ejecutan

| Fase | Comando | Qué hace |
|------|---------|----------|
| Build | `pnpm build` | 1) `vite build` en `apps/web` → `apps/web/dist`<br>2) `tsc` en `apps/server` → `apps/server/dist` |
| Start | `pnpm start` | `NODE_ENV=production node apps/server/dist/index.js` |

El servidor busca `apps/web/dist` y lo sirve con `express.static` + fallback SPA.

## Desarrollo vs Producción

| | Desarrollo | Producción (Render) |
|--|------------|---------------------|
| Frontend | Vite en `:5173` (proxy a socket) | Servido por Express |
| Backend | `:3001` | Mismo puerto que el servicio |
| Socket URL | `http://localhost:3001` | `window.location.origin` |

## Problemas frecuentes

**`EROFS: read-only file system` con corepack**  
Usa `npm install -g pnpm@9` en lugar de `corepack enable`.

**Build falla por pnpm**  
El comando de build instala pnpm globalmente primero.

**No se ve el frontend**  
Revisa en los logs: `[static] sirviendo frontend desde ...`. Si aparece el warning de que no encuentra la carpeta, el build del web no generó `dist`.

**Cold start**  
En plan free el servicio se apaga tras 15 min. La primera visita tarda ~30-60 s. Normal.

**WebSockets**  
Render free soporta WebSockets.

## Probar en local el modo producción

```bash
pnpm install
pnpm build
pnpm start
# → http://localhost:3001
```
