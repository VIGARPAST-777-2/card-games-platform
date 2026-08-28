# 🃏 Deckora

**La plataforma PWA moderna de juegos de cartas clásicos.**

Juega solo o online · Bots adaptativos · Ranked · Cosméticos · Reconexión inteligente

[![Status](https://img.shields.io/badge/status-early%20dev-blue)]()
[![Deploy](https://img.shields.io/badge/deploy-Docker%20%2F%20Render-purple)]()

---

## ✨ Concepto

PWA de juegos de cartas clásicos con partidas contra bots, amistosas, privadas y ranked; cuentas, progreso, misiones, temporadas, rangos independientes, cosméticos y **reconexión con bots temporales**.

---

## 🏗 Arquitectura

```
Un solo proceso Node (Docker)
├── Express + Socket.io   → partidas / API
├── Static (Vite build)   → frontend PWA
└── @deckora/shared       → tipos y lógica compartida
```

---

## 🚀 Desarrollo local

```bash
npm install -g pnpm@9
pnpm install
pnpm dev:server   # :3001
pnpm dev:web      # :5173
```

---

## 🐳 Desplegar en Render (Docker)

1. Servicio → **Settings** → Environment = **Docker**
2. Dockerfile Path: `./Dockerfile`
3. Docker Context: `.`
4. Health Check Path: `/health`
5. **Manual Deploy**

No hace falta Build Command ni Start Command.

### Probar imagen en local

```bash
docker build -t deckora .
docker run --rm -p 3000:3000 -e PORT=3000 deckora
# http://localhost:3000
```

Más detalle: [docs/DEPLOY.md](docs/DEPLOY.md)

---

## 📁 Estructura

```
apps/web          Cliente React + Vite + PWA
apps/server       Express + Socket.io + MatchManager
packages/shared   Tipos, cartas, rangos (compila a dist/)
Dockerfile        Imagen lista para Render
render.yaml       Blueprint Docker
```

---

## 📄 Licencia

MIT
