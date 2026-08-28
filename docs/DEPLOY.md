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
Build Command:  npm install -g pnpm@9 && pnpm install --prod=false && pnpm build
Start Command:  pnpm start
Plan:           Free
```

4. Environment:

```
NODE_ENV=production
NODE_VERSION=22
```

5. Advanced → Health Check Path: `/health`

> **Importante:**
> - No uses `corepack enable` → falla con `EROFS`.
> - Usa `pnpm install --prod=false` → si no, Vite/TypeScript no se instalan (Render pone `NODE_ENV=production` también en el build).

## Comandos que se ejecutan

| Fase | Comando | Qué hace |
|------|---------|----------|
| Build | `pnpm build` | 1) `vite build` en `apps/web` → `apps/web/dist`<br>2) `tsc` en `apps/server` → `apps/server/dist` |
| Start | `pnpm start` | `NODE_ENV=production node apps/server/dist/index.js` |

## Problemas frecuentes

**`vite: not found`**  
Añade `--prod=false` al `pnpm install` del Build Command.

**`EROFS` con corepack**  
Usa `npm install -g pnpm@9` en lugar de `corepack enable`.

**Cold start**  
Plan free: se duerme tras ~15 min. La primera visita tarda 30-60 s.

## Probar en local el modo producción

```bash
pnpm install
pnpm build
pnpm start
# → http://localhost:3001
```
