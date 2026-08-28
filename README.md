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
# Requiere Node 20+ y pnpm
corepack enable
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

### Opción A — Blueprint (recomendada)

1. Entra en [render.com](https://render.com) y conecta tu cuenta de GitHub.
2. **New → Blueprint**
3. Selecciona el repositorio `card-games-platform`
4. Render leerá `render.yaml` y creará el servicio automáticamente.

### Opción B — Manual

1. **New → Web Service**
2. Conecta el repo
3. Configura:

| Campo | Valor |
|-------|--------|
| **Runtime** | Node |
| **Build Command** | `corepack enable && pnpm install && pnpm build` |
| **Start Command** | `pnpm start` |
| **Instance type** | Free |

4. Variables de entorno (opcionales):
   - `NODE_ENV` = `production`
   - `NODE_VERSION` = `20`

5. Health Check Path: `/health`

### Qué hace el build

```
pnpm build
  → construye apps/web (Vite → dist)
  → construye apps/server (tsc → dist)

pnpm start
  → NODE_ENV=production node apps/server/dist/index.js
  → Express sirve los archivos de apps/web/dist
  → Socket.io en el mismo puerto
```

En producción el cliente se conecta al **mismo origen** (no hace falta `VITE_SERVER_URL`).

> ⚠️ Plan free de Render: el servicio se duerme tras ~15 min de inactividad. La primera petición puede tardar 30-60 s en despertar.

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
- [x] **Deploy unificado (frontend + backend en un solo servicio)**
- [ ] Primer juego completo (módulo)
- [ ] Auth y perfiles reales
- [ ] Matchmaking y ranked

---

## 📄 Licencia

MIT

---

Hecho con ❤️ para la comunidad de juegos de cartas.
