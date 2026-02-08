# Análisis de Arquitectura - FutbolStats

## Visión General del Sistema

FutbolStats es una aplicación full-stack para gestión de estadísticas de fútbol compuesta por:

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENTE                                   │
│  futbol-stats-web (React 19 + TypeScript + Vite)                │
│  Puerto: 5173                                                    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTP/WebSocket (proxy)
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        SERVIDOR                                  │
│  src/FutbolStats.Api (.NET 9 + Minimal APIs)                    │
│  Puerto: 5081                                                    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ Entity Framework Core
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      BASE DE DATOS                               │
│  PostgreSQL (puerto 5433)                                        │
│  Database: futbolstats                                           │
└─────────────────────────────────────────────────────────────────┘
```

---

## Backend: src/FutbolStats.Api

### Patrón Arquitectónico
**Feature-Based Layered Architecture** combinando:
- Clean Architecture (separación de capas)
- Vertical Slice Architecture (features organizadas verticalmente)
- CQRS con MediatR (comandos y queries separados)

### Estructura de Carpetas

```
FutbolStats.Api/
├── Common/                    # Cross-cutting concerns
│   ├── Behaviors/             # Pipeline behaviors (ValidationBehavior)
│   ├── Exceptions/            # NotFoundException, ValidationException
│   ├── Models/                # PagedResult<T>
│   └── Enums.cs               # MatchStatus, EventType, PlayerPosition, TiebreakerType, etc.
│
├── Features/                  # Organización por dominio
│   ├── Auth/                  # Login, RefreshToken, GetCurrentUser
│   ├── Teams/                 # CRUD equipos
│   ├── Players/               # CRUD jugadores
│   ├── Coaches/               # CRUD entrenadores + asignaciones a equipos
│   ├── Countries/             # CRUD países (36 pre-cargados)
│   ├── Championships/         # CRUD campeonatos + standings + tiebreaker config
│   ├── Matches/               # CRUD partidos + control en vivo + coaches
│   ├── MatchEvents/           # Goles, tarjetas, sustituciones, tarjetas técnico
│   └── Statistics/            # Estadísticas y rankings (jugadores, equipos, entrenadores)
│
├── Infrastructure/
│   └── Data/
│       ├── FutbolDbContext.cs
│       ├── Configurations/    # Entity type configurations
│       └── Migrations/
│
├── Middleware/
│   └── ExceptionHandlingMiddleware.cs
│
└── Program.cs                 # Configuración y registro de servicios
```

### Flujo de una Request

```
HTTP Request → Endpoint (Minimal API)
       ↓
IMediator.Send(Command/Query)
       ↓
ValidationBehavior (FluentValidation)
       ↓
Handler (IRequestHandler)
       ↓
FutbolDbContext (EF Core)
       ↓
HTTP Response (JSON)
```

### Entidades del Dominio

| Entidad | Descripción |
|---------|-------------|
| **Team** | Equipos con nombre, escudo, estadio |
| **Player** | Jugadores con posición, dorsal (nullable), equipo, país |
| **Coach** | Entrenadores con fecha nacimiento, país, foto |
| **CoachTeamAssignment** | Relación entrenador-equipo con fechas inicio/fin |
| **Country** | Países con nombre y URL de bandera (36 pre-cargados) |
| **Championship** | Campeonatos con temporada, fechas, estado, tiebreakerType |
| **ChampionshipTeam** | Tabla pivote con estadísticas (puntos, PJ, PG, etc.) |
| **Match** | Partidos con equipos, marcador, estado, minuto actual, coaches |
| **MatchLineup** | Alineaciones (titulares/suplentes) |
| **MatchEvent** | Eventos: goles, tarjetas, cambios, tarjetas técnico |
| **User** | Usuarios del sistema (Admin/Editor) |

### Enumeraciones

| Enumeración | Valores |
|-------------|---------|
| **MatchStatus** | Scheduled, Live, HalfTime, Finished, Postponed, Cancelled |
| **EventType** | Goal, OwnGoal, Assist, YellowCard, RedCard, SecondYellow, SubstitutionIn, SubstitutionOut, PenaltyScored, PenaltyMissed, CoachYellowCard, CoachRedCard |
| **PlayerPosition** | Goalkeeper, Defender, Midfielder, Forward |
| **ChampionshipStatus** | Upcoming, InProgress, Finished |
| **TiebreakerType** | HeadToHead, GoalDifference |
| **UserRole** | Admin, Editor |

### Tecnologías Backend

- **.NET 9.0** con Minimal APIs
- **Entity Framework Core 9.0** + PostgreSQL
- **MediatR 12.4** para CQRS
- **FluentValidation 11.11** para validación
- **JWT Bearer** para autenticación
- **Swagger/OpenAPI** para documentación

---

## Frontend: futbol-stats-web

### Patrón Arquitectónico
**Component-Based Architecture** con:
- Separación por features
- React Query para estado del servidor
- Context API para estado global (auth)

### Estructura de Carpetas

```
futbol-stats-web/src/
├── api/
│   ├── client.ts              # Axios config + interceptores (refresh token automático)
│   ├── endpoints/             # Funciones API por dominio
│   │   ├── auth.api.ts
│   │   ├── championships.api.ts
│   │   ├── coaches.api.ts     # CRUD + asignaciones
│   │   ├── countries.api.ts   # Listado de países
│   │   ├── matches.api.ts
│   │   ├── players.api.ts
│   │   ├── statistics.api.ts
│   │   └── teams.api.ts
│   └── types/                 # Interfaces TypeScript
│       ├── coach.types.ts
│       ├── country.types.ts
│       └── ...
│
├── contexts/
│   └── AuthContext.tsx        # Autenticación global
│
├── components/
│   └── layout/
│       └── MainLayout.tsx     # Layout con navegación
│
├── pages/                     # Páginas principales
│   ├── LoginPage.tsx
│   ├── DashboardPage.tsx
│   ├── ChampionshipsPage.tsx
│   ├── TeamsPage.tsx
│   ├── TeamDetailPage.tsx
│   ├── PlayersPage.tsx
│   ├── PlayerDetailPage.tsx
│   ├── CoachesPage.tsx        # Listado de entrenadores
│   ├── CoachDetailPage.tsx    # Detalle con estadísticas
│   ├── MatchesPage.tsx
│   ├── MatchDetailPage.tsx
│   └── StatisticsPage.tsx
│
├── lib/
│   └── queryClient.ts         # Config React Query
│
├── App.tsx                    # Componente raíz (13 rutas)
└── main.tsx                   # Entry point
```

### Gestión de Estado

```
┌────────────────────────────────────────┐
│  URL State (React Router)              │ Rutas y parámetros
├────────────────────────────────────────┤
│  Global State (AuthContext)            │ Usuario, token, isAuthenticated
├────────────────────────────────────────┤
│  Server State (React Query)            │ Datos del servidor con caché
├────────────────────────────────────────┤
│  Local State (useState)                │ Formularios, modales, UI
└────────────────────────────────────────┘
```

### Tecnologías Frontend

- **React 19.2** + TypeScript 5.9
- **Vite 7.2** como build tool
- **React Router DOM 7.11** para routing
- **@tanstack/react-query 5.90** para data fetching
- **Axios 1.13** como cliente HTTP
- **Tailwind CSS 4.1** para estilos
- **Lucide React** para iconos
- **SignalR 10.0** para WebSocket (real-time)

---

## Comunicación Frontend-Backend

### Proxy Configuration (vite.config.ts)

```
Frontend :5173 → /api/* → Backend :5081
Frontend :5173 → /hubs/* → Backend :5081 (WebSocket)
```

### Endpoints Principales

| Recurso | Endpoints |
|---------|-----------|
| Auth | POST login, POST refresh, GET me |
| Teams | GET, GET/:id, POST, PUT, DELETE |
| Players | GET, GET/:id, POST, PUT, DELETE |
| Coaches | GET, GET/:id, POST, PUT, DELETE, POST assign, POST endAssignment |
| Countries | GET (36 países pre-cargados) |
| Championships | CRUD + POST teams, DELETE teams/:id, POST recalculate |
| Matches | CRUD + POST start/halftime/end, POST lineup, POST setCoaches |
| MatchEvents | GET, POST goal/card/substitution/penaltyMissed/coachCard, DELETE |
| Statistics | GET standings, top-scorers, player/:id, team/:id, coach/:id |

### Autenticación

1. Login con email/password → JWT token
2. Token almacenado en localStorage
3. Axios interceptor añade Bearer token
4. 401 → Redirect a /login

---

## Resumen de Arquitectura

| Aspecto | Backend | Frontend |
|---------|---------|----------|
| **Framework** | .NET 9 Minimal APIs | React 19 |
| **Lenguaje** | C# | TypeScript |
| **Patrón** | Feature-Based + CQRS | Component-Based |
| **Estado** | - | React Query + Context |
| **Validación** | FluentValidation | Zod (preparado) |
| **HTTP** | ASP.NET Core | Axios |
| **ORM/Data** | EF Core + PostgreSQL | React Query cache |
| **Auth** | JWT Bearer | Context + localStorage |
| **Estilos** | - | Tailwind CSS |
| **Docs** | Swagger | - |

---

## Archivos Clave

### Backend
- `src/FutbolStats.Api/Program.cs` - Configuración principal
- `src/FutbolStats.Api/Infrastructure/Data/FutbolDbContext.cs` - DbContext
- `src/FutbolStats.Api/Features/*/` - Lógica de negocio por feature
- `src/FutbolStats.Api/appsettings.json` - Conexión DB y JWT settings

### Frontend
- `futbol-stats-web/src/App.tsx` - Componente raíz con providers
- `futbol-stats-web/src/api/client.ts` - Cliente Axios configurado
- `futbol-stats-web/src/contexts/AuthContext.tsx` - Estado de autenticación
- `futbol-stats-web/vite.config.ts` - Proxy y build config
