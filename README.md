# 🃏 Card Games Platform

**Una PWA moderna de juegos de cartas clásicos, multiplataforma, con partidas solo, online, competitivas y un sistema inteligente de reconexión.**

---

## 🃏 Concepto general

Una PWA de juegos de cartas clásicos, moderna y multiplataforma, donde puedas jugar tanto solo como online. La web se podría instalar como una app en móvil y PC.

La idea no es simplemente juntar juegos de cartas, sino crear una **plataforma completa** con cuentas, progreso, competición, personalización y comunidad.

---

## 🎮 Formas de jugar

### 🤖 Contra bots
- Jugar solo.
- Elegir dificultad.
- Los bots adaptan su nivel según tu rango o habilidad.
- Sirve para practicar y también para mantener una partida online si alguien se desconecta temporalmente.

### ⚡ Partida rápida
- Te empareja automáticamente con otros jugadores.
- Busca partidas casuales.
- Prioriza encontrar partida rápido.

### 🤝 Partida amistosa
- Con amigos o matchmaking casual.
- No afecta al rango.
- Más relajada.
- Posibilidad de reglas personalizadas, dependiendo del juego.

### 🔒 Partida privada
- Crear una sala.
- Código o enlace para invitar amigos.
- Configurar opciones de la partida.
- Sin afectar al ranking.

### 🏆 Ranked
- Partidas competitivas.
- Reglas oficiales.
- Matchmaking basado en habilidad.
- Sistema de puntos/MMR.
- Rangos separados para cada juego.
- Temporadas y clasificación.

---

## 📶 Sistema de desconexión y reconexión

Esta es una parte **clave** de la plataforma.

Si un jugador pierde la conexión:

```
Jugador se desconecta
        ↓
El servidor mantiene su plaza
        ↓
Un bot toma temporalmente el control
        ↓
El jugador puede reconectarse
        ↓
Recupera el control de su partida
```

El bot tendría un nivel aproximado al del jugador para que no perjudique demasiado la partida ni juegue muchísimo mejor o peor.

**Ejemplo:**

```
Jugador: nivel/rango equivalente a Oro

↓ se desconecta

Bot sustituto:
Nivel estratégico aproximado a Oro
```

Mientras tanto, los demás jugadores pueden seguir jugando.

Cuando el jugador vuelve:

```
🔄 Reconectando...
        ↓
Recibe el estado actual de la partida
        ↓
Recupera su mano y su posición
        ↓
Continúa jugando
```

Esto tiene que estar controlado por el **servidor** para evitar trampas.

---

## 👤 Cuentas y perfil

Cada jugador tendría una cuenta con:

- Nombre de usuario
- Avatar
- Nivel general
- Experiencia
- Estadísticas
- Historial de partidas
- Rangos competitivos
- Logros
- Colección de cosméticos

**Ejemplo de perfil:**

```
VIGARPAST_777

Nivel: 34 ⭐

Rankings:
🏆 Juego A — Oro II
🏆 Juego B — Diamante I
🏆 Juego C — Plata III

Victorias: 182
Partidas: 310
Racha máxima: 12
```

---

## 📈 Progresión

Un sistema de progreso general para que jugar tenga recompensas incluso fuera del competitivo.

```
Jugar
  ↓
Ganar XP
  ↓
Subir de nivel
  ↓
Desbloquear recompensas
```

También habría:

- 🎯 Misiones diarias
- 📅 Misiones semanales
- 🏅 Logros
- 🎁 Recompensas
- 🎫 Pase de temporada

**Importante:** el progreso general es independiente del rango competitivo.  
Puedes subir de nivel jugando amistosas, pero eso no significa que subas de rango en Ranked.

---

## 🎨 Personalización

Los jugadores podrían desbloquear o conseguir elementos cosméticos:

### 🃏 Cartas
- Diferentes diseños
- Reversos
- Temáticas especiales
- Estilos clásicos, modernos, pixel art, etc.

### 🟩 Mesa
- Fondos
- Tapetes
- Temas visuales

### 👤 Perfil
- Avatares
- Marcos
- Títulos
- Insignias

### ✨ Efectos
- Animaciones
- Reacciones
- Efectos al ganar

Todo debería ser **cosmético**, sin ventajas jugables.

---

## 🏆 Competitivo

Cada juego tendría su propio sistema competitivo.

```
BRONCE
   ↓
PLATA
   ↓
ORO
   ↓
PLATINO
   ↓
DIAMANTE
   ↓
MAESTRO
```

El rango es **independiente** por juego:

```
Juego 1 → Oro II
Juego 2 → Plata I
Juego 3 → Diamante III
```

También habría:

- Temporadas
- Rankings globales
- Estadísticas competitivas
- Recompensas de final de temporada

---

## 🧠 Bots adaptativos

Los bots no serían simplemente Fácil / Normal / Difícil.

Tendrían una **valoración interna de habilidad**:

```
Bot nivel 300
Bot nivel 800
Bot nivel 1500
Bot nivel 2200
```

Así se puede generar un bot cercano al nivel del jugador.

Sirve para:

- Practicar
- Sustituir temporalmente a desconectados
- Completar partidas cuando falte un jugador
- Ajustar la dificultad

---

## 🌐 Multiplayer (autoridad del servidor)

El sistema funciona con un servidor como autoridad:

```
CLIENTE
   ↓
"Quiero hacer esta jugada"
   ↓
SERVIDOR
   ↓
Comprueba si es válida
   ↓
Actualiza la partida
   ↓
Envía el nuevo estado a todos
```

Así se reducen trampas y problemas de sincronización.

El servidor gestiona:

- Turnos
- Temporizadores
- Desconexiones
- Reconexiones
- Bots sustitutos
- Estado de la partida
- Resultados
- Ranking

---

## 🧩 Arquitectura de la plataforma

La clave es crear primero un **motor común**:

```
PLATAFORMA
│
├── Sistema de usuarios
├── Autenticación
├── Amigos
├── Matchmaking
├── Salas privadas
├── Ranked
├── Progresión
├── Misiones
├── Cosméticos
│
└── MOTOR DE PARTIDAS
    │
    ├── Jugadores
    ├── Cartas
    ├── Barajas
    ├── Turnos
    ├── Reglas
    ├── Eventos
    ├── Bots
    ├── Reconexión
    └── Sincronización online
```

Después, cada juego sería un **módulo** que utiliza ese motor.

Esto permite añadir nuevos juegos sin rehacer toda la plataforma.

---

## 💡 La idea en una frase

> Una plataforma PWA moderna de juegos de cartas clásicos, con partidas contra bots, amistosas, privadas y competitivas; cuentas, progreso, misiones, temporadas, rangos independientes, cosméticos y un sistema inteligente de reconexión donde bots temporales mantienen la partida mientras el jugador vuelve.

---

## 🚀 Prioridades de desarrollo

1. **Motor de partidas online** + sistema de reconexión (lo más crítico)
2. Sistema de cuentas y autenticación
3. Matchmaking y salas
4. Primer juego implementado sobre el motor
5. Progresión, misiones y cosméticos
6. Ranked y temporadas
7. Más juegos como módulos

Si el motor de partidas y la reconexión funcionan bien, el resto se puede ir añadiendo encima poco a poco.

---

**Estado actual:** Concepto / Diseño  
**Repositorio:** [github.com/VIGARPAST-777-2/card-games-platform](https://github.com/VIGARPAST-777-2/card-games-platform)
