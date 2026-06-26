# ChatFlow — Full Project Guide

> One document. Everything you need to understand, run, and extend this project.

---

## Table of Contents

1. [What This App Does](#1-what-this-app-does)
2. [Tech Stack](#2-tech-stack)
3. [Project Structure](#3-project-structure)
4. [How to Run](#4-how-to-run)
5. [Backend — Spring Boot](#5-backend--spring-boot)
6. [Frontend — React](#6-frontend--react)
7. [API Reference](#7-api-reference)
8. [WebSocket Reference](#8-websocket-reference)
9. [Database Schema](#9-database-schema)
10. [Data Flow — How Things Connect](#10-data-flow--how-things-connect)

---

## 1. What This App Does

ChatFlow is a real-time chat application.

- Users register and log in with email + password
- They can open **Direct Messages** with any other user
- They can create **Group Rooms** and add contacts to them
- Messages appear instantly for all members via WebSocket
- The inbox sorts conversations by most recent message (WhatsApp-style)
- There are pages for Groups, Dashboard overview, Profile, and Settings

---

## 2. Tech Stack

### Backend
| Technology | Version | Purpose |
|---|---|---|
| Java | 23 | Runtime |
| Spring Boot | 3.3.0 | Web framework |
| Spring Security | managed | JWT auth, filter chain |
| Spring Data JPA | managed | Database ORM |
| Spring WebSocket | managed | Real-time messaging (STOMP) |
| Hibernate | 6.5 | JPA implementation |
| PostgreSQL | 16 | Database |
| JJWT | 0.12.5 | JWT create/validate |
| Lombok | managed | Reduces boilerplate |
| Maven | 3.9 | Build tool |

### Frontend
| Technology | Version | Purpose |
|---|---|---|
| React | 18 | UI framework |
| Vite | 5 | Dev server + bundler |
| Tailwind CSS | 3 | Styling |
| React Router | 6 | Client-side routing |
| Axios | — | HTTP requests |
| @stomp/stompjs | — | WebSocket client (STOMP) |
| sockjs-client | — | WebSocket fallback |
| Material Symbols | Google CDN | Icons |

### Infrastructure
| Tool | Purpose |
|---|---|
| Docker + Docker Compose | Runs PostgreSQL locally |

---

## 3. Project Structure

```
chat-app/
├── backend/                          Spring Boot backend
│   ├── pom.xml                       Maven build config + dependencies
│   └── src/main/
│       ├── resources/
│       │   └── application.properties  All config (DB, JWT, port)
│       └── java/com/chatflow/
│           ├── ChatflowApplication.java   Entry point
│           ├── entity/                JPA database models
│           ├── repository/            Database query interfaces
│           ├── dto/                   Request/response objects
│           ├── security/              JWT utility + auth filter
│           ├── config/                Security + WebSocket setup
│           ├── service/               Business logic
│           ├── controller/            REST API endpoints
│           ├── websocket/             Real-time message handlers
│           └── exception/             Global error handler
│
├── frontend/                         React frontend
│   ├── vite.config.js                Vite config + API proxy
│   ├── index.html                    Entry HTML (fonts loaded here)
│   ├── tailwind.config.js            Design tokens
│   └── src/
│       ├── App.jsx                   Routes + auth guards
│       ├── main.jsx                  React root
│       ├── index.css                 Global styles
│       ├── context/
│       │   ├── AuthContext.jsx       Global auth state
│       │   └── SocketContext.jsx     STOMP WebSocket connection
│       ├── pages/
│       │   ├── Login.jsx             Sign in / Register
│       │   ├── Chat.jsx              Main chat page
│       │   ├── Groups.jsx            Group rooms list
│       │   ├── Dashboard.jsx         Overview / stats
│       │   ├── Profile.jsx           User profile + contacts
│       │   └── Settings.jsx          App settings
│       └── components/
│           ├── Sidebar.jsx           Navigation rail
│           ├── InboxPane.jsx         Room list (left panel)
│           ├── ChatCanvas.jsx        Messages + input (center)
│           ├── AddContactModal.jsx   Search + start DM
│           └── AddMemberModal.jsx    Add contact to group room
│
├── docker-compose.yml                PostgreSQL container
├── .env                              Node backend env (not used by Spring)
└── PROJECT_GUIDE.md                  This file
```

---

## 4. How to Run

### Prerequisites
- Java 21+ installed
- Maven 3.9+ installed
- Docker Desktop installed and running
- Node.js 18+ installed

### Step 1 — Start the database
```powershell
# From the project root
docker compose up -d postgres
```

### Step 2 — Start the backend
```powershell
cd backend
mvn spring-boot:run
```

On first run, Hibernate automatically creates all tables.
Server starts at **http://localhost:3000**

Verify it works:
```powershell
Invoke-RestMethod http://localhost:3000/health
# Expected: { "message": "health is good!!!" }
```

### Step 3 — Start the frontend
```powershell
# Open a second terminal
cd frontend
npm install       # first time only
npm run dev
```

Frontend runs at **http://localhost:5173**

### Common error: "Asia/Calcutta" timezone
If you're in India and the backend fails to start with a timezone error, this is already fixed in `pom.xml` via `-Duser.timezone=Asia/Kolkata`.

---

## 5. Backend — Spring Boot

### How a request flows through the backend

```
HTTP Request
    │
    ▼
JwtAuthFilter          reads Authorization header, validates JWT,
                       puts AuthenticatedUser in SecurityContext
    │
    ▼
SecurityConfig         checks if the route needs auth or is public
    │
    ▼
@RestController        receives the request, reads @AuthenticationPrincipal
    │
    ▼
@Service               runs business logic, validates, throws exceptions
    │
    ▼
@Repository            executes JPQL queries against PostgreSQL
    │
    ▼
Response               controller returns ResponseEntity<DTO>
                       GlobalExceptionHandler catches any exception
```

---

### `application.properties`

All runtime configuration lives here. No `.env` file needed for the backend.

| Key | Value | What it does |
|---|---|---|
| `server.port` | `3000` | Server listens on port 3000 |
| `spring.datasource.url` | `jdbc:postgresql://localhost:5433/chatapp?TimeZone=UTC` | DB connection |
| `spring.datasource.username` | `admin` | DB username |
| `spring.datasource.password` | `Ammar123` | DB password |
| `spring.jpa.hibernate.ddl-auto` | `update` | Hibernate auto-creates/alters tables on startup |
| `spring.jpa.properties.hibernate.jdbc.time_zone` | `UTC` | Forces UTC to avoid timezone issues |
| `app.jwt.secret` | 64-char hex string | Signs and verifies JWTs |
| `app.jwt.expiration-ms` | `18000000` | Token expires after 5 hours |

---

### Entity Layer — `entity/`

Entities are Java classes that map directly to database tables. Hibernate creates/alters the tables automatically.

#### `User.java` → table `users`
```
id          UUID    primary key, auto-generated
username    String  unique
email       String  unique
password    String  bcrypt hashed
createdAt   Instant auto-set on insert
```

#### `ChatRoom.java` → table `chat_rooms`
```
id          UUID    primary key
name        String
isDirect    boolean false = group room, true = 1-on-1 DM
createdAt   Instant auto-set on insert
```

#### `RoomMember.java` → table `room_members`
```
id          UUID    primary key
user_id     FK → users.id
room_id     FK → chat_rooms.id
UNIQUE(user_id, room_id)   — a user can only be in a room once
```

#### `Message.java` → table `messages`
```
id          UUID    primary key
content     TEXT
sender_id   FK → users.id
room_id     FK → chat_rooms.id
createdAt   Instant auto-set on insert
```

---

### Repository Layer — `repository/`

Repositories are interfaces. Spring generates all the SQL automatically. No implementation files needed.

#### `UserRepository`
| Method | What it does |
|---|---|
| `findByEmail(email)` | Find user by email (used at login) |
| `existsByEmail(email)` | Check if email is taken (used at register) |
| `existsByUsername(username)` | Check if username is taken |
| `searchUsers(query, excludeId)` | ILIKE search on username and email, excludes self, max 10 results |

#### `ChatRoomRepository`
| Method | What it does |
|---|---|
| `findRoomsByUserId(userId)` | All rooms the user is a member of |
| `findDirectRoomBetween(userIdA, userIdB)` | Find existing DM room between two users |
| `findDirectRoomsByUserId(userId)` | All DM rooms a user is in (used to derive contacts) |

#### `RoomMemberRepository`
| Method | What it does |
|---|---|
| `existsByUserIdAndRoomId(userId, roomId)` | Check if already a member |
| `findByUserIdAndRoomId(userId, roomId)` | Get the membership record |

#### `MessageRepository`
| Method | What it does |
|---|---|
| `findByRoomId(roomId, pageable)` | Messages for a room, newest first, paginated |
| `findByRoomIdBeforeCursor(roomId, cursorId, pageable)` | Messages before a cursor (for loading older messages) |
| `findLastMessageByRoomId(roomId)` | The single last message (for inbox preview) |

---

### DTO Layer — `dto/`

DTOs (Data Transfer Objects) are Java records that define exactly what goes in and out of the API. They are immutable and Jackson serializes them to JSON automatically.

| DTO | Direction | Fields |
|---|---|---|
| `RegisterRequest` | Client → Server | email, username, password (all validated) |
| `LoginRequest` | Client → Server | email, password |
| `AuthResponse` | Server → Client | token, user (UserDto) |
| `UserDto` | Server → Client | id, username, email — never includes password |
| `CreateRoomRequest` | Client → Server | name |
| `DirectRoomRequest` | Client → Server | targetUserId (UUID) |
| `AddMemberRequest` | Client → Server | userId (UUID) |
| `SendMessageRequest` | Client → Server | content |
| `MessageDto` | Server → Client | id, content, roomId, sender (UserDto), senderId, createdAt |
| `RoomDto` | Server → Client | id, name, isDirect, createdAt, members[], messages[] (last 1) |
| `RoomMemberDto` | Server → Client | id, user (UserDto) |
| `SocketMessageDto` | WebSocket payload | roomId, content |

---

### Security Layer — `security/`

#### `AuthenticatedUser` (record)
Holds the logged-in user's data inside the Spring Security context.
```java
record AuthenticatedUser(UUID id, String email, String username)
```
Controllers access this with `@AuthenticationPrincipal AuthenticatedUser currentUser`.

#### `JwtUtil`
Creates and validates JWTs using JJWT 0.12.5 with HS256 algorithm.

| Method | Purpose |
|---|---|
| `generateToken(userId, email, username)` | Create a signed JWT |
| `isValid(token)` | Returns true/false — never throws |
| `getUserId(token)` | Extract UUID from `id` claim |
| `getEmail(token)` | Extract email claim |
| `getUsername(token)` | Extract username claim |

JWT payload: `{ id, email, username, iat, exp }` — same shape as the old Node backend.

#### `JwtAuthFilter`
Runs on every HTTP request (extends `OncePerRequestFilter`).

1. Read `Authorization: Bearer <token>` header
2. If missing → skip (public routes are fine, protected ones get blocked by SecurityConfig)
3. If token is invalid → skip
4. If valid → create `AuthenticatedUser` and put it in `SecurityContextHolder`

---

### Config Layer — `config/`

#### `SecurityConfig`
Wires everything together for HTTP security.

- CSRF disabled (stateless REST API)
- Sessions disabled (JWT is stateless)
- CORS allows all origins (for development)
- Public routes: `POST /api/auth/*`, `GET /health`, `/ws/**`
- All other routes require a valid JWT
- `JwtAuthFilter` runs before the default Spring auth filter
- Registers `BCryptPasswordEncoder` bean (used by `AuthService`)

#### `WebSocketConfig`
Configures the STOMP WebSocket broker.

- Endpoint: `/ws` with SockJS fallback
- Client sends to: `/app/...` → goes to `@MessageMapping` methods
- Server broadcasts to: `/topic/...` → goes to all subscribers
- User-specific: `/user/...` → goes to one user
- Registers `WebSocketAuthInterceptor` on the inbound channel

---

### Service Layer — `service/`

#### `AuthService`
`register(request)` — creates a new user
1. Check email not already taken → throw if exists
2. Check username not taken → throw if exists
3. Hash password with BCrypt (strength 10)
4. Save `User` entity
5. Sign JWT with `{ id, email, username }`
6. Return `AuthResponse(token, UserDto)`

`login(request)` — authenticate existing user
1. Find user by email → throw "Invalid credentials" if not found
2. Compare password with `BCryptPasswordEncoder.matches()` → throw if wrong
3. Sign JWT
4. Return `AuthResponse(token, null)` — login only returns the token

#### `ChatService`
The main service. Handles all room and message logic.

| Method | What it does |
|---|---|
| `createRoom(name, creatorId)` | Creates group room, auto-adds creator as first member |
| `getRooms(userId)` | Returns all rooms user belongs to, each with last message |
| `joinRoom(userId, roomId)` | Adds user to room, idempotent (safe to call twice) |
| `sendMessage(userId, roomId, content)` | Saves message to DB, returns `MessageDto` |
| `getOrCreateDirectRoom(userIdA, userIdB)` | Finds existing DM or creates a new one |
| `getContacts(userId)` | Returns all users you've had a DM with |
| `addMemberToRoom(roomId, requesterId, targetId)` | Adds target to group room with 4 validations |
| `getMessages(roomId, cursor, limit)` | Paginated message history, newest first |

`addMemberToRoom` validation order:
1. Room must exist → 404
2. Room must not be a DM → 400
3. Requester must be in the room → 400
4. Target must not already be in the room → 400
5. Target must be a contact (share a DM with requester) → 400

#### `UserService`
Thin service that delegates to `UserRepository` and `ChatService`.

| Method | What it does |
|---|---|
| `searchUsers(query, excludeUserId)` | Search users by name/email, exclude self |
| `getContacts(userId)` | Delegates to `ChatService.getContacts()` |

---

### Controller Layer — `controller/`

All controllers use `@AuthenticationPrincipal AuthenticatedUser currentUser` to get the logged-in user. Validation errors are handled by `GlobalExceptionHandler`.

#### `AuthController`
| Method | Path | Auth | Returns |
|---|---|---|---|
| POST | `/api/auth/register` | No | 201 `{token, user}` |
| POST | `/api/auth/login` | No | 200 `{token}` |
| POST | `/api/auth/logout` | No | 200 `{message}` |
| GET | `/health` | No | 200 `{message}` |

#### `RoomController`
| Method | Path | Auth | Returns |
|---|---|---|---|
| GET | `/api/rooms` | Yes | 200 `RoomDto[]` |
| POST | `/api/rooms` | Yes | 201 `RoomDto` |
| POST | `/api/rooms/direct` | Yes | 200 `RoomDto` |
| POST | `/api/rooms/{id}/join` | Yes | 200 `RoomMemberDto` |
| POST | `/api/rooms/{id}/members` | Yes | 201 `RoomMemberDto` |

#### `MessageController`
| Method | Path | Auth | Query Params | Returns |
|---|---|---|---|---|
| GET | `/api/rooms/{id}/messages` | Yes | `cursor`, `limit=20` | 200 `MessageDto[]` |
| POST | `/api/rooms/{id}/messages` | Yes | — | 201 `MessageDto` |

#### `UserController`
| Method | Path | Auth | Query Params | Returns |
|---|---|---|---|---|
| GET | `/api/users/search` | Yes | `q=text` | 200 `UserDto[]` |
| GET | `/api/users/contacts` | Yes | — | 200 `UserDto[]` |

---

### WebSocket Layer — `websocket/`

#### `WebSocketAuthInterceptor`
Runs on every STOMP frame. On `CONNECT` frames:
1. Extracts JWT from `Authorization: Bearer <token>` header (or `token` header as fallback)
2. Validates JWT with `JwtUtil.isValid()`
3. If invalid → throws `MessagingException("Authentication error")` → connection rejected
4. If valid → creates `AuthenticatedUser` principal and attaches to the STOMP session

#### `ChatWebSocketController`
Handles real-time events from the client.

| Client sends to | Server handler | Server broadcasts to |
|---|---|---|
| `/app/chat.send` | `sendMessage()` | `/topic/room.{roomId}` |
| `/app/chat.typing` | `typing()` | `/topic/room.{roomId}.typing` |

**send message flow:**
1. Client publishes `{ roomId, content }` to `/app/chat.send`
2. Handler extracts `userId` from the STOMP principal
3. Calls `ChatService.sendMessage(userId, roomId, content)`
4. Broadcasts the saved `MessageDto` to `/topic/room.{roomId}`
5. All subscribers (everyone in the room) receive it

**typing flow:**
1. Client publishes `{ roomId }` to `/app/chat.typing`
2. Handler broadcasts `{ userId }` to `/topic/room.{roomId}.typing`
3. Other room members show "Someone is typing..."

---

### `GlobalExceptionHandler`

Catches all exceptions thrown by services and controllers. Returns a consistent `{ "message": "..." }` JSON response.

| Exception | HTTP Status | When thrown |
|---|---|---|
| `IllegalArgumentException` | 400 Bad Request | Business rule violations |
| `MethodArgumentNotValidException` | 400 Bad Request | `@Valid` on request body fails |
| `ConstraintViolationException` | 400 Bad Request | Bean Validation failures |
| `NoSuchElementException` | 404 Not Found | Entity not found in DB |
| `Exception` (catch-all) | 500 Internal Server Error | Unexpected errors |

---

## 6. Frontend — React

### How a page loads

```
Browser hits /
    │
    ▼
App.jsx                checks if token exists in localStorage
    │
    ├─ No token  →  redirected to /login
    │
    └─ Has token →  ProtectedSocket wraps the page
                        │
                        ▼
                    SocketContext  creates STOMP connection
                        │
                        ▼
                    Chat.jsx  fetches rooms, renders Sidebar + InboxPane + ChatCanvas
```

---

### `vite.config.js`

Two important things here:

1. **`global: 'globalThis'`** — `sockjs-client` is a Node.js package that uses `global`. This polyfill makes it work in the browser.

2. **Proxy** — Vite forwards API and WebSocket requests to the backend so CORS is never an issue during development:
   - `/api/*` → `http://localhost:3000`
   - `/ws/*` → `http://localhost:3000` (WebSocket)

---

### `App.jsx` — Routes

| Path | Component | Auth required? | WebSocket? |
|---|---|---|---|
| `/login` | `Login` | No | No |
| `/` | `Chat` | Yes | Yes (SocketProvider wraps it) |
| `/groups` | `Groups` | Yes | No |
| `/dashboard` | `Dashboard` | Yes | No |
| `/settings` | `Settings` | Yes | No |
| `/profile` | `Profile` | Yes | No |
| `*` | Redirect to `/` | — | — |

`SocketProvider` is only mounted on the Chat route — the WebSocket only connects when you're in the chat.

---

### Context Providers

#### `AuthContext.jsx`
Provides auth state to every component in the app.

Exposed values: `{ user, token, loading, login(), register(), logout() }`

- On app load: reads token from `localStorage`, decodes the JWT payload (base64) to get `{ id, email, username }` without an API call
- `login()` / `register()` → calls API, stores token in `localStorage`, updates state
- `logout()` → removes token from `localStorage`, clears state
- Components use `const { user, token } = useAuth()`

#### `SocketContext.jsx`
Creates and manages the STOMP WebSocket connection.

Exposed values: `{ stompClient, connected }`

- Creates a `@stomp/stompjs` `Client` that connects to `/ws` via SockJS
- Passes `Authorization: Bearer <token>` in the STOMP CONNECT frame headers
- Auto-reconnects every 5 seconds on disconnect
- `connected` is `true` only after the STOMP CONNECT acknowledgment
- Cleans up (deactivates) when the token changes or component unmounts
- Components use `const { stompClient, connected } = useSocket()`

---

### Pages

#### `Login.jsx` — `/login`
Sign In and Register in one page. Toggles between modes.
- Calls `AuthContext.login()` or `AuthContext.register()`
- Navigates to `/` on success

#### `Chat.jsx` — `/`
The main page. Most complex component in the app.

**State:**
- `rooms` — enriched room objects (with `dmPartnerName`, `lastMessageAt`, `lastMessage`)
- `activeRoomId` — which room is open
- `messages` — a map: `{ roomId: MessageDto[] }` — loaded on demand, cached
- `typingUsers` — map of who is typing per room
- `subscriptionsRef` — tracks active STOMP subscriptions by roomId

**Key patterns:**
- Uses `useRef` mirrors for `activeRoomId`, `messages`, `stompClient`, `token` so that `handleSelectRoom` is a stable `useCallback` with no deps and never reads stale values
- `sortedRooms` sorts the room list by `lastMessageAt` descending (WhatsApp-style)
- When a new message arrives via STOMP, the room's `lastMessageAt` updates → room bubbles to top

**When a room is selected (`handleSelectRoom`):**
1. Unsubscribe from previous room's STOMP topics
2. Set `activeRoomId`
3. Subscribe to `/topic/room.{roomId}` (new messages)
4. Subscribe to `/topic/room.{roomId}.typing` (typing indicators)
5. Fetch message history from REST API if not already cached

**Sending a message:**
```
stompClient.publish({
    destination: '/app/chat.send',
    body: JSON.stringify({ roomId, content })
})
```

**Sending typing indicator:**
```
stompClient.publish({
    destination: '/app/chat.typing',
    body: JSON.stringify({ roomId })
})
```

#### `Groups.jsx` — `/groups`
Lists all group rooms (non-DM) the user belongs to.
- Stats: total groups, my groups, total members
- Inline create form
- Clicking a group navigates to `/` with `state: { openRoomId }` — Chat.jsx opens it automatically

#### `Dashboard.jsx` — `/dashboard`
Workspace overview.
- 4 stat cards: Total Rooms, Groups, Direct Chats, Contacts
- Recent Activity: top 5 rooms sorted by last message
- Contacts quick-view with avatars
- Clicking anything navigates to Chat

#### `Profile.jsx` — `/profile`
User's own profile.
- Avatar, cover gradient, online badge
- Account details: username, email, truncated user ID
- Live contacts list from `GET /api/users/contacts`

#### `Settings.jsx` — `/settings`
App settings.
- Dark mode toggle (toggles `html.dark` class)
- Font size selector
- Notification toggles (UI state only)
- Privacy cards (UI only)
- **Logout button** — calls `AuthContext.logout()` and redirects to login

---

### Components

#### `Sidebar.jsx`
Navigation rail on the left edge of every page.

| Button | Icon | Route | Active when |
|---|---|---|---|
| Chats | `chat_bubble` | `/` | pathname === `/` |
| Groups | `group` | `/groups` | pathname starts with `/groups` |
| Dashboard | `view_quilt` | `/dashboard` | pathname starts with `/dashboard` |
| Settings | `settings` | `/settings` | pathname starts with `/settings` |
| Logout | `logout` | — | calls `logout()` |
| Avatar | user initial | `/profile` | pathname starts with `/profile` |

Active button gets a filled icon + background highlight. Uses `useNavigate` and `useLocation` from React Router.

#### `InboxPane.jsx`
Left panel of the Chat page. Room list.

- Rooms sorted by `lastMessageAt` (passed in as `sortedRooms` from Chat.jsx)
- Each item shows: avatar, display name, last message text, formatted timestamp
- DM rooms show a teal dot badge and a `person` icon
- `person_add` button opens `AddContactModal`
- `edit_square` button shows an inline "create room" form
- `formatTime()` helper: shows time if today, "Yesterday", or "DD Mon" for older

#### `ChatCanvas.jsx`
Center panel of the Chat page. Messages + input.

Props: `{ activeRoom, messages, onSendMessage, onTyping, typingUsers, onRoomMemberAdded }`

- Header shows room name, member count or "Direct Message"
- `group_add` button (group rooms only) opens `AddMemberModal`
- Messages: right-aligned if sent by current user, left-aligned otherwise
- Typing indicator shown when `typingUsers` has entries
- Input calls `onTyping()` on every keystroke
- `messagesEndRef` auto-scrolls to the bottom on new messages

#### `AddContactModal.jsx`
Modal to start a new DM with any user.

Flow:
1. User types → debounced (350ms) call to `GET /api/users/search?q=`
2. Results shown
3. Click a user → `POST /api/rooms/direct { targetUserId }`
4. Calls `onStartChat(room, user)` in Chat.jsx
5. Modal closes

#### `AddMemberModal.jsx`
Modal to add a contact to a group room.

Flow:
1. Opens → fetches `GET /api/users/contacts`
2. Filters out people already in the room
3. Search bar filters the contact list client-side
4. Click Add → `POST /api/rooms/{id}/members { userId }`
5. Contact disappears from the list, appears in the members pills at the bottom

---

## 7. API Reference

All endpoints under `/api/rooms` and `/api/users` require:
```
Authorization: Bearer <jwt_token>
```

All error responses have the shape: `{ "message": "description" }`

---

### Auth Endpoints

#### `POST /api/auth/register`
Create a new account.

Request:
```json
{ "email": "user@example.com", "username": "john", "password": "secret123" }
```
Response `201`:
```json
{ "token": "eyJ...", "user": { "id": "uuid", "username": "john", "email": "user@example.com" } }
```
Errors: `400` if email/username already exists

---

#### `POST /api/auth/login`
Sign in to an existing account.

Request:
```json
{ "email": "user@example.com", "password": "secret123" }
```
Response `200`:
```json
{ "token": "eyJ...", "user": null }
```
Errors: `400` "Invalid credentials"

---

#### `POST /api/auth/logout`
Stateless — no server action. Client should discard the token.
Response `200`: `{ "message": "Logged out successfully" }`

---

#### `GET /health`
Response `200`: `{ "message": "health is good!!!" }`

---

### Room Endpoints

#### `GET /api/rooms`
Returns all rooms the current user belongs to, sorted newest first. Each room includes its members and its last message.

Response `200`:
```json
[
  {
    "id": "uuid",
    "name": "General",
    "isDirect": false,
    "createdAt": "2025-01-01T10:00:00Z",
    "members": [{ "id": "uuid", "user": { "id": "uuid", "username": "john", "email": "..." } }],
    "messages": [{ "id": "uuid", "content": "Hello!", "senderId": "uuid", "createdAt": "..." }]
  }
]
```

---

#### `POST /api/rooms`
Create a new group room. The creator is automatically added as the first member.

Request: `{ "name": "Team Chat" }`
Response `201`: `RoomDto`

---

#### `POST /api/rooms/direct`
Get or create a direct message room between the current user and a target user.
If a DM room already exists between them, it's returned. Otherwise a new one is created.

Request: `{ "targetUserId": "uuid" }`
Response `200`: `RoomDto`
Errors: `400` if `targetUserId` is yourself

---

#### `POST /api/rooms/{id}/join`
Join a room. Idempotent — safe to call even if already a member.
Response `200`: `RoomMemberDto`

---

#### `POST /api/rooms/{id}/members`
Add a contact to a group room.

Request: `{ "userId": "uuid" }`
Response `201`: `RoomMemberDto`

Errors:
- `404` Room not found
- `400` Cannot add to a DM room
- `400` You are not a member of this room
- `400` User is already in this room
- `400` You can only add users from your contacts

---

#### `GET /api/rooms/{id}/messages`
Fetch message history for a room. Returns newest first (frontend reverses for display).

Query params:
- `limit` (default: 20) — how many messages to return
- `cursor` (optional UUID) — if provided, returns messages older than this message

Response `200`: `MessageDto[]`

---

#### `POST /api/rooms/{id}/messages`
Send a message via REST (fallback). Real-time sending uses WebSocket.

Request: `{ "content": "Hello world" }`
Response `201`: `MessageDto`

---

### User Endpoints

#### `GET /api/users/search?q=text`
Search for users by username or email. Excludes the current user. Max 10 results.

Response `200`: `UserDto[]`
```json
[{ "id": "uuid", "username": "alice", "email": "alice@example.com" }]
```

---

#### `GET /api/users/contacts`
Returns all users the current user has ever had a DM with.

Response `200`: `UserDto[]`

---

## 8. WebSocket Reference

### Connecting

The frontend connects using SockJS + STOMP:
```js
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';

const client = new Client({
    webSocketFactory: () => new SockJS('/ws'),
    connectHeaders: { Authorization: `Bearer ${token}` },
    reconnectDelay: 5000,
});
client.activate();
```

The JWT is validated on the STOMP `CONNECT` frame by `WebSocketAuthInterceptor`. If invalid, the connection is rejected.

---

### Client → Server (publish)

#### Send a message
```js
client.publish({
    destination: '/app/chat.send',
    body: JSON.stringify({ roomId: 'uuid', content: 'Hello!' }),
});
```

#### Send typing indicator
```js
client.publish({
    destination: '/app/chat.typing',
    body: JSON.stringify({ roomId: 'uuid' }),
});
```

---

### Server → Client (subscribe)

#### Receive messages in a room
```js
const sub = client.subscribe(`/topic/room.${roomId}`, (frame) => {
    const message = JSON.parse(frame.body);
    // message is a MessageDto: { id, content, roomId, sender, senderId, createdAt }
});

// To stop receiving (when leaving room):
sub.unsubscribe();
```

#### Receive typing indicators in a room
```js
client.subscribe(`/topic/room.${roomId}.typing`, (frame) => {
    const { userId } = JSON.parse(frame.body);
    // show "Someone is typing..."
});
```

**Note:** Subscribing to a topic in STOMP is equivalent to `socket.join(roomId)` in Socket.IO. Unsubscribing is equivalent to `socket.leave(roomId)`.

---

## 9. Database Schema

```
┌─────────────────────────────────────────────────────────┐
│                        users                            │
│  id (UUID PK) | username | email | password | createdAt │
└────────────────────────┬────────────────────────────────┘
                         │ 1
                         │
                         │ N
               ┌─────────┴──────────────┐
               │      room_members      │
               │  id | user_id | room_id│
               │  UNIQUE(user_id,room_id│
               └─────────┬──────────────┘
                         │ N
                         │
                         │ 1
┌────────────────────────┴────────────────────────────────┐
│                      chat_rooms                         │
│  id (UUID PK) | name | isDirect | createdAt             │
└────────────────────────┬────────────────────────────────┘
                         │ 1
                         │
                         │ N
┌────────────────────────┴────────────────────────────────┐
│                       messages                          │
│  id | content | sender_id | room_id | createdAt         │
└─────────────────────────────────────────────────────────┘
```

**Key design rule:** There is no separate "contacts" table.
A user's contacts = the other users in their `isDirect = true` rooms.
This is derived in `ChatService.getContacts()` by scanning DM rooms.

---

## 10. Data Flow — How Things Connect

### Registering and logging in
```
User fills form → AuthContext.register() → POST /api/auth/register
    → AuthService hashes password, saves User, signs JWT
    → Token stored in localStorage
    → AuthContext decodes JWT payload (no extra API call needed)
    → SocketContext creates STOMP connection with token
    → Redirected to /
```

### Opening a chat
```
User clicks a room in InboxPane
    → Chat.handleSelectRoom(roomId)
    → Unsubscribe from old room STOMP topics
    → Subscribe to /topic/room.{roomId}  (new messages)
    → Subscribe to /topic/room.{roomId}.typing  (typing)
    → GET /api/rooms/{roomId}/messages  (load history, cached)
    → Messages displayed in ChatCanvas
```

### Sending a message
```
User types and presses Enter
    → ChatCanvas.handleSubmit()
    → Chat.handleSendMessage(content)
    → stompClient.publish('/app/chat.send', { roomId, content })
    → Spring: ChatWebSocketController.sendMessage()
    → ChatService.sendMessage() → saves to DB
    → messaging.convertAndSend('/topic/room.{roomId}', MessageDto)
    → All subscribers receive the message
    → setMessages() adds it to the list
    → setRooms() updates lastMessageAt → room bubbles to top
```

### Adding a contact
```
User clicks person_add → AddContactModal opens
    → Types name → debounced GET /api/users/search?q=
    → Clicks a user
    → POST /api/rooms/direct { targetUserId }
    → ChatService.getOrCreateDirectRoom() — finds or creates DM room
    → Chat.handleStartDirectChat(room, user) adds room to list
    → handleSelectRoom(room.id) opens it
```

### Adding a member to a group room
```
User opens group room → clicks group_add → AddMemberModal opens
    → GET /api/users/contacts → shows contacts not already in room
    → User clicks Add
    → POST /api/rooms/{id}/members { userId }
    → ChatService.addMemberToRoom() — 4 validations then saves
    → Frontend updates room.members in state immediately
```
