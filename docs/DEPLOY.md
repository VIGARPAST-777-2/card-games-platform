# Desplegar Deckora en Render (Docker)

Frontend + backend en **una sola imagen Docker** → un solo Web Service.

## Configuración en Render

1. Abre tu servicio en el dashboard
2. **Settings** → **Build & Deploy**:
   - **Language / Environment:** `Docker`
   - **Dockerfile Path:** `./Dockerfile` (o déjalo vacío si está en la raíz)
   - **Docker Build Context Directory:** `.`
3. **Health Check Path:** `/health`
4. Guarda y **Manual Deploy**

No hace falta Build Command ni Start Command: Docker se encarga de todo.

### Variables de entorno (opcionales)

| Key | Value |
|-----|--------|
| `NODE_ENV` | `production` |

`PORT` lo asigna Render automáticamente.

## Qué hace el Dockerfile

```
1. Node 22 + pnpm 9
2. Copia el monorepo
3. pnpm install --prod=false
4. pnpm build  (web → dist + server → dist)
5. pnpm prune --prod
6. CMD: pnpm start
```

Express sirve `apps/web/dist` y Socket.io en el mismo puerto.

## Blueprint (`render.yaml`)

Si creas el servicio con **New → Blueprint**, ya viene con `runtime: docker`.

## Probar la imagen en local

```bash
docker build -t deckora .
docker run --rm -p 3000:3000 deckora
# → http://localhost:3000
# → http://localhost:3000/health
```

## Problemas frecuentes

**Cold start (plan free)**  
Se duerme tras ~15 min; la primera visita tarda 30-60 s.

**Build lento**  
Normal la primera vez (instala deps + Vite). Luego cachea capas de Docker.

**Cambiar de Node a Docker**  
En Settings cambia Environment a Docker, guarda y vuelve a desplegar. Ya no uses Build/Start Command manuales.
