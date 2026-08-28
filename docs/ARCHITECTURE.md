# Arquitectura de Deckora

## Visión general

Deckora se organiza como un monorepo con tres partes principales:

```
apps/web          → Cliente PWA (React + Vite + Tailwind)
apps/server       → Autoridad de partidas + API (Node + Socket.io)
packages/shared   → Tipos, constantes y utilidades compartidas
```

## Principios

1. **Servidor como autoridad**  
   Toda jugada pasa por el servidor. El cliente solo envía intenciones.

2. **Motor común + módulos de juego**  
   El `MatchManager` gestiona salas, jugadores, desconexiones y bots.  
   Cada juego (Poker, Rummy, Tute…) es un módulo que implementa reglas y validación.

3. **Reconexión con bot temporal**  
   Si un jugador se desconecta, un bot de nivel similar toma su plaza.  
   Al reconectar, recupera control (mismo `playerId` y asiento).

4. **Rangos independientes**  
   Cada juego tiene su propio MMR y ranking.

## Flujo de una partida

```
Cliente                    Servidor
   |                          |
   |--- match:join ---------->|
   |                          | crea / une a Match
   |<-- match:state ----------|
   |                          |
   |--- match:action -------->|
   |                          | valida reglas del módulo
   |                          | actualiza estado
   |<-- match:state ----------|
   |                          |
   | (desconexión)            |
   |                          | bot takeover
   |                          |
   | (reconexión)             |
   |--- (session token) ----->|
   |                          | restaura jugador
   |<-- match:state ----------|
```

## Próximos pasos técnicos

- [ ] Módulo de juego base (interfaz `GameModule`)
- [ ] Primer juego completo (ej. Blackjack o Tute)
- [ ] Auth real (JWT / sesiones)
- [ ] Persistencia (PostgreSQL)
- [ ] Matchmaking por cola + Redis
- [ ] Cosméticos y progresión
