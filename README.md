# 🃏 Deckora

**La plataforma PWA moderna de juegos de cartas clásicos.**

Juega solo o online · Bots adaptativos · Ranked · Cosméticos · Reconexión inteligente

[![Status](https://img.shields.io/badge/status-concept%20%2F%20early%20dev-blue)]()
[![PWA](https://img.shields.io/badge/PWA-ready-green)]()
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)]()

---

## ✨ Concepto

**Deckora** es una Progressive Web App de juegos de cartas clásicos, multiplataforma (móvil + PC), con cuentas, progreso, competición, personalización y comunidad.

No es solo un recopilatorio de juegos: es una **plataforma completa** con motor compartido de partidas.

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

El bot se ajusta al rango aproximado del jugador (ej. Oro → bot estilo Oro) para no romper la partida.

---

## 🏗 Arquitectura

```
DECKORA
│
├── Sistema de usuarios + Auth
├── Amigos + Matchmaking + Salas
├── Ranked + Temporadas
├── Progresión + Misiones + Cosméticos
│
└── MOTOR DE PARTIDAS (compartido)
    ├── Jugadores / Cartas / Barajas / Turnos
    ├── Reglas (por módulo de juego)
    ├── Bots adaptativos
    ├── Reconexión + Sincronización
    └── Autoridad del servidor (anti-trampas)
```

Cada juego es un **módulo** que se conecta al motor. Añadir un juego nuevo no requiere rehacer la plataforma.

---

## 🛠 Stack tecnológico (planificado)

| Capa | Tecnología |
|------|------------|
| Frontend | Vite + React + TypeScript + Tailwind + PWA |
| Backend  | Node.js + TypeScript + Socket.io / Colyseus |
| Estado  | Servidor como autoridad |
| DB      | PostgreSQL + Redis (caché / matchmaking) |
| Auth    | JWT / sesiones |
| Deploy  | Vercel / Cloudflare (web) + Railway / Fly.io (server) |

---

## 📁 Estructura del repositorio

```
.
├── apps/
│   ├── web/          # Cliente PWA (React + Vite)
│   └── server/       # Servidor de partidas + API
├── packages/
│   └── shared/       # Tipos, constantes, lógica compartida
├── docs/             # Documentación adicional
└── README.md
```

---

## 🚀 Estado actual

- [x] Concepto y diseño de arquitectura
- [x] Estructura monorepo inicial
- [ ] Motor de partidas base
- [ ] Sistema de reconexión
- [ ] Primer juego (módulo)
- [ ] Auth y perfiles
- [ ] Matchmaking
- [ ] Ranked y progresión

---

## 🎯 Prioridades

1. **Motor de partidas online + reconexión** (lo más crítico)
2. Sistema de cuentas
3. Matchmaking y salas privadas
4. Primer juego sobre el motor
5. Progresión, misiones y cosméticos
6. Ranked + temporadas
7. Más juegos como módulos

---

## 📄 Licencia

MIT (por definir)

---

Hecho con ❤️ para la comunidad de juegos de cartas.
