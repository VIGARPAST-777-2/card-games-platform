# 🃏 Deckora

**La plataforma PWA moderna de juegos de cartas clásicos.**

Juega solo o online · Bots adaptativos · Ranked · Cosméticos · Reconexión inteligente

[![Status](https://img.shields.io/badge/status-concept%20%2F%20early%20dev-blue)]()
[![PWA](https://img.shields.io/badge/PWA-ready-green)]()
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)]()
[![Deploy](https://img.shields.io/badge/deploy-Render%20(single%20service)-purple)]()

---

## ✨ Concepto

**Deckora** es una Progressive Web App de juegos de cartas clásicos, multiplataforma (móvil + PC), con cuentas, progreso, competición, personalización y comunidad.

> *Una plataforma PWA moderna de juegos de cartas clásicos, con partidas contra bots, amistosas, privadas y competitivas; cuentas, progreso, misiones, temporadas, rangos independientes, cosméticos y un sistema inteligente de reconexión donde bots temporales mantienen la partida mientras el jugador vuelve.*

---

## 🎮 Modos de juego

| Modo | Descripción |
|------|-------------|
| 🤖 **Contra bots** | Practica con dificultad adaptativa. Los bots también sustituyen a jugadores desconectados. |
| ⚡ **Partida rápida** | Matchmaking casual, prioridad en encontrar partida rápido. |
| 🤝 **Amistosa** | Con amigos o casual. No afecta rango. Reglas personalizables. |
| 🔒 **Privada** | Sala con código/enlace. Configura opciones. |
| 🏆 **Ranked** | Competitivo oficial. MMR, rangos por juego, temporadas. |

---

## 📶 Reconexión inteligente

```
Jugador se desconecta
        ↓
Servidor mantiene la plaza
        ↓
Bot de nivel similar toma el control
        ↓
Jugador se reconecta → recupera mano y posición
```

---

## 🏗 Arquitectura

```
DECKORA (un solo proceso en producción)
│
├── Express + Socket.io          ← autoridad de partidas
├── Frontend estático (Vite)     ← servido por el mismo Express
└── packages/shared              ← tipos y lógica compartida
```

Frontend y backend viven en **un único Web Service** (ideal para Render free).

---

## 🛠 Stack

| Capa | Tecnología |
|------|------------|
| Frontend | Vite + React + TypeScript + Tailwind + PWA |
| Backend  | Node.js + Express + Socket.io |
| Shared   | TypeScript |
| Deploy   | **Render** (un solo servicio) |

---

## 📁 Estructura

```
.
├── apps/
│   ├── web/          # Cliente PWA (React + Vite)
│   └── server/       # Express + Socket.io (sirve también el frontend)
├── packages/
│   └── shared/       # Tipos, cartas, rangos, constantes
├── render.yaml       # Blueprint de Render
└── README.md
```

---

## 🚀 Desarrollo local

```bash
npm install -g pnpm@9
pnpm install

# Terminal 1 — backend
pnpm dev:server

# Terminal 2 — frontend (con proxy a :3001)
pnpm dev:web
```

- Frontend: http://localhost:5173  
- Backend / health: http://localhost:3001/health

---

## 🌐 Desplegar en Render (todo en uno)

### Opción A — Blueprint

1. [render.com](https://render.com) → **New → Blueprint**
2. Selecciona el repo `card-games-platform`
3. Render usa `render.yaml`

### Opción B — Manual

| Campo | Valor |
|-------|--------|
| **Runtime** | Node |
| **Build Command** | `npm install -g pnpm@9 && pnpm install --include=dev && pnpm build` |
| **Start Command** | `pnpm start` |
| **Instance type** | Free |

Variables de entorno:
- `NODE_VERSION` = `22`

> No pongas `NODE_ENV=production` en las env vars del servicio (rompe el install de vite en el build). El server ya lo activa al arrancar.

Health Check Path: `/health`

> ⚠️ Plan free: se duerme tras ~15 min. Primera petición ~30-60 s.

---

## 🧪 Probar build de producción en local

```bash
pnpm build
pnpm start
# Abre http://localhost:3001
```

---

## 🎯 Estado actual

- [x] Concepto y arquitectura
- [x] Monorepo + tipos compartidos
- [x] Servidor con MatchManager + bots de reconexión
- [x] Frontend PWA base
- [x] Deploy unificado (un solo servicio Render)
- [ ] Primer juego completo
- [ ] Auth y perfiles
- [ ] Matchmaking y ranked

---

## 📄 Licencia

MIT
