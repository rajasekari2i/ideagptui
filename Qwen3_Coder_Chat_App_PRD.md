# Product Requirements Document
# Qwen3-Coder Chat Application

> **Version:** 1.0  
> **Date:** May 2026  
> **Status:** Draft  
> **Stack:** React 18 + Tailwind CSS · Node.js (Express) · PostgreSQL · Ollama (Qwen3-Coder:30b)

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Product Overview](#2-product-overview)
3. [System Architecture](#3-system-architecture)
4. [Functional Requirements](#4-functional-requirements)
5. [Non-Functional Requirements](#5-non-functional-requirements)
6. [User Interface Requirements](#6-user-interface-requirements)
7. [API Specification](#7-api-specification)
8. [Database Schema](#8-database-schema)
9. [User Stories](#9-user-stories)
10. [Development Milestones](#10-development-milestones)
11. [Technology Stack](#11-technology-stack)
12. [Project Structure](#12-project-structure)
13. [Risks & Mitigations](#13-risks--mitigations)
14. [Acceptance Criteria](#14-acceptance-criteria)
15. [Appendix](#15-appendix)

---

## 1. Introduction

### 1.1 Purpose

This PRD defines the complete requirements for a self-hosted, ChatGPT-style chat web application backed by **Qwen3-Coder:30b** running locally via Ollama on Ubuntu 24.04. It is intended to be used directly with **Claude Code** to generate the application.

### 1.2 Scope

The application includes:

- React 18 + Tailwind CSS frontend (single-page app)
- Node.js + Express REST API backend with SSE streaming
- PostgreSQL database for persistent chat history
- Ollama integration serving Qwen3-Coder:30b locally
- Multi-session chat management with sidebar navigation

### 1.3 Definitions

| Term | Definition |
|---|---|
| Session / Chat | A named conversation thread with a sequence of user and AI messages |
| SSE | Server-Sent Events — used to stream tokens from the model to the browser |
| Ollama | Local LLM runtime serving Qwen3-Coder:30b on Ubuntu 24.04 |
| Qwen3-Coder:30b | Alibaba's 30B open-source code-focused LLM running on local GPU |

---

## 2. Product Overview

### 2.1 Vision

A fast, privacy-first, developer-friendly chat interface that harnesses Qwen3-Coder:30b entirely on-premise. No data leaves the local server. Users get a ChatGPT-like experience including multi-session management, streaming responses, and code-syntax highlighting.

### 2.2 Target Users

- Software developers wanting a local AI coding assistant
- Data scientists working on private codebases
- Organizations with compliance requirements for on-premise AI

### 2.3 Key Value Propositions

- 100% local — zero external data transmission
- Full chat history: create, rename, delete sessions
- Real-time streaming with syntax-highlighted code blocks
- Recent chats sidebar for fast navigation
- Responsive design for desktop and mobile

---

## 3. System Architecture

### 3.1 Layer Overview

```
┌─────────────────────────────────────────────┐
│         Browser (React 18 + Tailwind)        │
│  Sidebar │ Chat Thread │ Composer │ Settings  │
└─────────────────────┬───────────────────────┘
                      │ HTTP REST + SSE
┌─────────────────────▼───────────────────────┐
│         Node.js + Express API Server         │
│   /api/sessions  /api/messages  /api/health  │
└──────────┬──────────────────┬───────────────┘
           │ SQL (pg)          │ HTTP POST
┌──────────▼──────┐  ┌────────▼────────────────┐
│   PostgreSQL    │  │  Ollama (localhost:11434) │
│   (port 5432)   │  │  qwen3-coder:30b          │
└─────────────────┘  └──────────────────────────┘
```

### 3.2 Request Flow

```
User types message
  → POST /api/sessions/:id/messages
    → Express controller validates input
      → Fetch previous messages from PostgreSQL
        → POST http://localhost:11434/api/chat (stream: true)
          → SSE tokens forwarded to browser
            → Frontend appends tokens to UI in real-time
              → On stream end, full message saved to PostgreSQL
```

### 3.3 Deployment

| Service | Port | Notes |
|---|---|---|
| React frontend (Vite dev) | 3000 | Proxied to API in dev |
| Node.js API | 8000 | Production: served behind Nginx |
| PostgreSQL | 5432 | Local or Docker container |
| Ollama | 11434 | Must be running before API starts |

---

## 4. Functional Requirements

### 4.1 Chat Session Management

#### FR-001 — Create New Chat

- User clicks a **"+ New Chat"** button in the sidebar
- A new session row is inserted into PostgreSQL with a default title `"New Chat"` and a UUID
- The new session becomes the active session immediately
- The chat area clears and shows a welcome/empty state

#### FR-002 — List All Chats (Sidebar)

- Sidebar displays all sessions from PostgreSQL ordered by `updated_at DESC`
- Each item shows: **title**, **last message snippet** (max 60 chars), **relative time** (e.g. "2 hours ago")
- Sessions grouped into sections: **Today**, **Yesterday**, **Previous 7 Days**, **Older**
- Sidebar is scrollable for large numbers of sessions
- Active session is highlighted with a left border accent and bold title

#### FR-003 — Recent Chats

- Top section of sidebar labeled **"Recent"** shows the **5 most recently active** sessions
- Sorted by `updated_at DESC`
- Clicking any recent chat loads that session's full message history
- Recent section is pinned above the full list with a visual separator

#### FR-004 — Rename Chat Session

- Double-clicking a session title in the sidebar opens an inline `<input>` for editing
- Same behavior via three-dot context menu → **Rename**
- Pressing `Enter` or clicking away saves; `Escape` cancels
- `PATCH /api/sessions/:id` updates `title` in PostgreSQL

#### FR-005 — Delete Chat Session

- Three-dot context menu → **Delete** shows a confirmation dialog
- On confirm: `DELETE /api/sessions/:id` cascades to delete all messages
- If the deleted session was active, switch to the most recent remaining session or blank state

#### FR-006 — Search Sessions

- Search bar at the top of the sidebar with a magnifier icon
- Filters session list in real-time by matching `title` or message content (`ILIKE` query)
- Empty state shown if no sessions match

---

### 4.2 Messaging & AI Interaction

#### FR-007 — Send Message

- Multi-line `<textarea>` at bottom of chat area (auto-grows with content)
- Submit: `Enter` key (or `Shift+Enter` for newline) or Send button
- User message immediately appended to the conversation view
- `POST /api/sessions/:id/messages` triggers AI response

#### FR-008 — Streaming AI Response (SSE)

- Backend opens an SSE connection to Ollama and forwards tokens to the browser
- Tokens render incrementally in the UI (typewriter effect)
- A blinking cursor `▋` shows while stream is active
- A **Stop** button aborts the fetch controller and the SSE connection
- Partial response is saved to PostgreSQL on stop

#### FR-009 — Code Block Rendering

- Fenced code blocks in AI Markdown (` ``` `) rendered with **syntax highlighting**
- Language label shown in top-left of block (e.g. `python`, `javascript`)
- **Copy** button (top-right) copies raw code to clipboard
- Supported languages: Python, JavaScript, TypeScript, Bash, SQL, JSON, Go, Rust, Java, C++

#### FR-010 — Markdown Rendering

- AI responses rendered as full Markdown: headings, bold, italic, lists, blockquotes, inline code, tables, horizontal rules
- User messages rendered as plain text (no Markdown interpretation)

#### FR-011 — Message Actions

- **Copy** icon appears on message hover → copies full message text to clipboard
- **Regenerate** button under the last AI message → deletes last assistant message, re-sends last user message
- **Edit** on user messages → replaces message content and triggers new AI response (subsequent messages in the thread are discarded)

#### FR-012 — System Prompt

- Settings drawer (right panel) contains a **System Prompt** textarea per session
- System prompt prepended to every API call for that session as `{ role: "system", content: "..." }`
- Saved to `sessions.system_prompt` column in PostgreSQL

---

### 4.3 Model Configuration

#### FR-013 — Model Parameters

- Settings drawer exposes per-session controls:

| Parameter | Type | Default | Range |
|---|---|---|---|
| Temperature | slider + number | 0.7 | 0.0 – 2.0 |
| Max Tokens | number input | 2048 | 128 – 8192 |
| Top-P | slider + number | 0.9 | 0.0 – 1.0 |
| Top-K | number input | 40 | 1 – 100 |

- Settings saved to `sessions.settings` (JSONB) in PostgreSQL

#### FR-014 — Model Health Check

- On API server start, ping `GET http://localhost:11434/api/tags`
- If unavailable, API returns `503` on all `/api/sessions` routes
- Frontend shows a dismissible **"⚠️ Model offline — please start Ollama"** banner
- Banner auto-dismisses when health check passes (polled every 10 s)

---

## 5. Non-Functional Requirements

| ID | Category | Requirement |
|---|---|---|
| NFR-001 | Performance | First token must arrive within 3 s on a machine with ≥ 24 GB VRAM GPU |
| NFR-002 | Performance | All UI interactions (session switch, sidebar navigation) respond within 200 ms |
| NFR-003 | Scalability | Support 1 000+ sessions and 50 000+ messages without pagination degradation |
| NFR-004 | Reliability | Graceful error handling on Ollama timeout with user-visible message |
| NFR-005 | Security | CORS restricted to `localhost` origins by default; configurable via `CORS_ORIGINS` env var |
| NFR-006 | Privacy | Zero telemetry; no network calls outside the local machine |
| NFR-007 | Usability | Fully operable without reading docs for a developer-level user |
| NFR-008 | Accessibility | Keyboard-navigable (Tab, Enter, Esc); WCAG 2.1 AA color contrast minimum |
| NFR-009 | Portability | Full app runs via `docker compose up` (frontend + backend + PostgreSQL) |
| NFR-010 | Maintainability | Backend API routes covered by integration tests ≥ 70 % |

---

## 6. User Interface Requirements

### 6.1 Layout

```
┌──────────────────────────────────────────────────────────────┐
│  ┌─────────────┐  ┌───────────────────────────────────────┐  │
│  │   SIDEBAR   │  │           MAIN CHAT AREA              │  │
│  │  260px      │  │                                       │  │
│  │  ─────────  │  │  ┌───────────────────────────────┐   │  │
│  │  + New Chat │  │  │  Session Title          ⚙ ✕   │   │  │
│  │  🔍 Search  │  │  └───────────────────────────────┘   │  │
│  │  ─────────  │  │                                       │  │
│  │  RECENT     │  │  [message thread — scrollable]        │  │
│  │  • Chat 1   │  │                                       │  │
│  │  • Chat 2   │  │                                       │  │
│  │  ─────────  │  │  ┌───────────────────────────────┐   │  │
│  │  TODAY      │  │  │ Type a message...   [Send ▶]   │   │  │
│  │  • Chat 3   │  │  └───────────────────────────────┘   │  │
│  │  YESTERDAY  │  └───────────────────────────────────────┘  │
│  │  • Chat 4   │                                             │
│  └─────────────┘                                             │
└──────────────────────────────────────────────────────────────┘
```

### 6.2 Visual Design

- **Default theme:** Dark mode; light mode toggle in header
- **Font:** Inter (Google Fonts) or system-ui fallback, 14px base
- **Sidebar background:** `#111827` (Tailwind `gray-900`)
- **Chat background:** `#1f2937` (Tailwind `gray-800`)
- **Accent color:** `#3b82f6` (Tailwind `blue-500`)
- **Spacing grid:** 8px base unit (Tailwind default)
- **Transitions:** 200ms ease for sidebar collapse, message fade-in

### 6.3 Chat Bubbles

| Role | Alignment | Background | Text Color |
|---|---|---|---|
| User | Right | `blue-600` | white |
| Assistant | Left | `gray-700` | `gray-100` |

- Max message width: **720px**
- Timestamps shown on hover (`gray-400`, 12px)
- Avatar: robot icon for assistant, user initials for user

### 6.4 Sidebar — Session Items

- Title: max 28 chars, truncated with ellipsis
- Subtitle: last message snippet, max 60 chars, `gray-400`
- Time badge: right-aligned, `gray-500`, 12px
- Hover state: `gray-800` background + three-dot icon (⋯) reveals context menu (Rename, Delete)
- Active state: `blue-500` left border (4px) + `gray-700` background + bold title

### 6.5 Code Blocks

```
┌──────────────────────────────────────────────┐
│ python                              [Copy 📋] │
├──────────────────────────────────────────────┤
│  def hello():                                 │
│      print("Hello, World!")                   │
└──────────────────────────────────────────────┘
```

- Background: `gray-900`
- Syntax theme: **One Dark** or **GitHub Dark**
- Font: `JetBrains Mono` or `Fira Code`, 13px

---

## 7. API Specification

> Base URL: `http://localhost:8000/api`  
> All responses: `Content-Type: application/json`  
> Error format: `{ "error": "message", "code": "ERROR_CODE" }`

### 7.1 Session Endpoints

#### `GET /sessions`

Returns all sessions ordered by `updated_at DESC`.

**Response 200:**
```json
[
  {
    "id": "uuid",
    "title": "My Chat",
    "createdAt": "2026-05-01T10:00:00Z",
    "updatedAt": "2026-05-01T12:30:00Z",
    "messageCount": 14,
    "lastMessage": "How do I implement a binary search tree?",
    "settings": { "temperature": 0.7, "maxTokens": 2048, "topP": 0.9, "topK": 40 }
  }
]
```

#### `POST /sessions`

Creates a new session.

**Request body:**
```json
{ "title": "New Chat" }
```

**Response 201:**
```json
{
  "id": "uuid",
  "title": "New Chat",
  "createdAt": "2026-05-31T08:00:00Z",
  "updatedAt": "2026-05-31T08:00:00Z",
  "messageCount": 0,
  "systemPrompt": null,
  "settings": { "temperature": 0.7, "maxTokens": 2048, "topP": 0.9, "topK": 40 }
}
```

#### `GET /sessions/:id`

Returns a session with its full message history.

**Response 200:**
```json
{
  "id": "uuid",
  "title": "My Chat",
  "systemPrompt": "You are a helpful coding assistant.",
  "settings": { "temperature": 0.7, "maxTokens": 2048, "topP": 0.9, "topK": 40 },
  "messages": [
    { "id": "uuid", "role": "user", "content": "Hello", "createdAt": "..." },
    { "id": "uuid", "role": "assistant", "content": "Hi! How can I help?", "createdAt": "..." }
  ]
}
```

#### `PATCH /sessions/:id`

Updates session title, system prompt, or settings.

**Request body (all fields optional):**
```json
{
  "title": "Renamed Chat",
  "systemPrompt": "You are a Python expert.",
  "settings": { "temperature": 0.5 }
}
```

**Response 200:** Updated session object

#### `DELETE /sessions/:id`

Deletes session and all its messages (cascade).

**Response 204:** No content

---

### 7.2 Message Endpoints

#### `POST /sessions/:id/messages` — **SSE Streaming**

Sends a user message and streams the AI response.

**Request body:**
```json
{ "content": "Write a quicksort in Python" }
```

**Response:** `Content-Type: text/event-stream`

```
data: {"type":"token","content":"Here"}

data: {"type":"token","content":" is"}

data: {"type":"token","content":" a..."}

data: {"type":"done","messageId":"uuid","tokensUsed":312}

data: [DONE]
```

On error:
```
data: {"type":"error","message":"Ollama connection refused"}
```

#### `GET /sessions/:id/messages`

Returns all messages for a session ordered by `created_at ASC`.

**Response 200:**
```json
[
  { "id": "uuid", "role": "user", "content": "...", "createdAt": "..." },
  { "id": "uuid", "role": "assistant", "content": "...", "tokensUsed": 312, "createdAt": "..." }
]
```

#### `DELETE /sessions/:id/messages`

Clears all messages in a session (keeps session).

**Response 204:** No content

#### `POST /sessions/:id/stop`

Signals the backend to abort the current SSE stream for this session.

**Response 200:** `{ "status": "stopped" }`

#### `DELETE /sessions/:id/messages/:messageId`

Deletes a specific message and all messages after it (used for edit + regenerate).

**Response 204:** No content

---

### 7.3 System Endpoints

#### `GET /health`

```json
{
  "status": "ok",
  "ollama": "connected",
  "model": "qwen3-coder:30b",
  "database": "connected",
  "uptime": 3600
}
```

#### `GET /models`

Returns available Ollama models.

```json
{ "models": ["qwen3-coder:30b", "llama3:8b"] }
```

---

## 8. Database Schema

### PostgreSQL Tables

#### `sessions`

```sql
CREATE TABLE sessions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title        VARCHAR(255) NOT NULL DEFAULT 'New Chat',
  system_prompt TEXT,
  settings     JSONB NOT NULL DEFAULT '{"temperature":0.7,"maxTokens":2048,"topP":0.9,"topK":40}',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sessions_updated_at ON sessions(updated_at DESC);
```

#### `messages`

```sql
CREATE TABLE messages (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id   UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  role         VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content      TEXT NOT NULL,
  tokens_used  INTEGER,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_messages_session_id ON messages(session_id);
CREATE INDEX idx_messages_created_at ON messages(created_at ASC);
```

#### Auto-update `updated_at` trigger

```sql
CREATE OR REPLACE FUNCTION update_session_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE sessions SET updated_at = NOW() WHERE id = NEW.session_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_session_timestamp
AFTER INSERT ON messages
FOR EACH ROW EXECUTE FUNCTION update_session_timestamp();
```

### Data Types

| Field | Type | Notes |
|---|---|---|
| `sessions.id` | UUID | Generated by `gen_random_uuid()` |
| `sessions.settings` | JSONB | Merged with defaults on read |
| `messages.role` | VARCHAR CHECK | `user` · `assistant` · `system` |
| `messages.tokens_used` | INTEGER nullable | Only set for assistant messages |

---

## 9. User Stories

| ID | As a | I want to | So that | Priority |
|---|---|---|---|---|
| US-01 | Developer | Create a new chat session | I can start a fresh conversation | P0 |
| US-02 | Developer | See my 5 most recent chats in the sidebar | I can resume previous work quickly | P0 |
| US-03 | Developer | Send a message and receive a streamed AI reply | I see the answer as it generates | P0 |
| US-04 | Developer | Browse all past sessions grouped by date | I can find older chats easily | P0 |
| US-05 | Developer | See syntax-highlighted code in responses | I can read and copy code easily | P0 |
| US-06 | Developer | Rename a chat to a meaningful title | I can organize my sessions | P1 |
| US-07 | Developer | Delete sessions I no longer need | I keep my sidebar clean | P1 |
| US-08 | Developer | Stop a response mid-stream | I don't wait for an unwanted long reply | P1 |
| US-09 | Developer | Regenerate the last AI response | I can get a better answer without retyping | P1 |
| US-10 | Developer | Search across all session titles | I can find a specific chat fast | P2 |
| US-11 | Developer | Configure temperature and max tokens per chat | I can tune the model for each use case | P2 |
| US-12 | Developer | Set a custom system prompt per session | I can focus the model on a specific task | P2 |
| US-13 | Developer | Toggle dark/light mode | I can use the app comfortably day or night | P2 |

---

## 10. Development Milestones

### Phase 1 — Foundation (Week 1–2)

- [ ] Initialize monorepo: `apps/frontend` (Vite + React) and `apps/backend` (Express)
- [ ] PostgreSQL schema migrations (sessions + messages tables)
- [ ] Ollama client utility (`/services/ollama.js`)
- [ ] Basic REST endpoints: `POST /sessions`, `GET /sessions`, `DELETE /sessions/:id`
- [ ] Environment variable configuration (`.env.example`)

### Phase 2 — Core Streaming (Week 3–4)

- [ ] `POST /sessions/:id/messages` with SSE streaming to Ollama
- [ ] Frontend SSE consumer — appends tokens in real-time
- [ ] Chat thread component (user + assistant bubbles)
- [ ] Message composer (`<textarea>` + Send button)
- [ ] PostgreSQL: save completed assistant message after stream ends

### Phase 3 — Session Sidebar (Week 5–6)

- [ ] Sidebar: session list grouped by Today / Yesterday / Previous 7 Days / Older
- [ ] Recent Chats section (top 5 by `updated_at`)
- [ ] New Chat button
- [ ] Rename inline edit + PATCH endpoint
- [ ] Delete with confirmation dialog + DELETE endpoint
- [ ] Session switching (load full message history)

### Phase 4 — Rich Chat UI (Week 7–8)

- [ ] Markdown rendering (`react-markdown`)
- [ ] Syntax-highlighted code blocks (`react-syntax-highlighter`)
- [ ] Copy button on code blocks and messages
- [ ] Stop Generation button
- [ ] Regenerate last response
- [ ] Edit user message
- [ ] System prompt + model settings drawer

### Phase 5 — Polish & Testing (Week 9–10)

- [ ] Search bar in sidebar
- [ ] Dark/light mode toggle
- [ ] Model health check banner
- [ ] Loading skeletons + error states
- [ ] Docker Compose setup (`frontend` + `backend` + `postgres`)
- [ ] Integration tests for all API routes
- [ ] README with setup instructions

---

## 11. Technology Stack

### Frontend

| Concern | Library / Tool | Version |
|---|---|---|
| Framework | React | 18.x |
| Build tool | Vite | 5.x |
| Styling | Tailwind CSS | 3.x |
| State management | Zustand | 4.x |
| Routing | React Router | 6.x |
| Markdown render | react-markdown | 9.x |
| Code highlighting | react-syntax-highlighter | 15.x |
| SSE client | Native `EventSource` / `fetch` with `ReadableStream` | — |
| Icons | lucide-react | latest |
| HTTP client | Axios | 1.x |

### Backend

| Concern | Library / Tool | Version |
|---|---|---|
| Runtime | Node.js | 20 LTS |
| Framework | Express | 4.x |
| PostgreSQL client | `pg` (node-postgres) | 8.x |
| Query builder | `pg` raw SQL or Knex.js | — |
| Migrations | db-migrate or Knex migrations | — |
| Env config | dotenv | 16.x |
| CORS | cors | 2.x |
| Logging | morgan + winston | — |
| Testing | Jest + Supertest | — |

### Infrastructure

| Concern | Tool |
|---|---|
| LLM runtime | Ollama 0.3.x |
| Database | PostgreSQL 16 |
| Containerization | Docker + Docker Compose |
| Reverse proxy | Nginx (production) |
| OS | Ubuntu 24.04 LTS |

---

## 12. Project Structure

```
qwen-chat/
├── apps/
│   ├── frontend/                  # React + Tailwind (Vite)
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   ├── Sidebar/
│   │   │   │   │   ├── Sidebar.jsx
│   │   │   │   │   ├── SessionList.jsx
│   │   │   │   │   ├── SessionItem.jsx
│   │   │   │   │   ├── RecentChats.jsx
│   │   │   │   │   └── SearchBar.jsx
│   │   │   │   ├── Chat/
│   │   │   │   │   ├── ChatArea.jsx
│   │   │   │   │   ├── MessageThread.jsx
│   │   │   │   │   ├── MessageBubble.jsx
│   │   │   │   │   ├── CodeBlock.jsx
│   │   │   │   │   └── Composer.jsx
│   │   │   │   ├── Settings/
│   │   │   │   │   ├── SettingsDrawer.jsx
│   │   │   │   │   └── ModelParams.jsx
│   │   │   │   └── common/
│   │   │   │       ├── HealthBanner.jsx
│   │   │   │       └── ConfirmDialog.jsx
│   │   │   ├── store/
│   │   │   │   ├── sessionStore.js     # Zustand: sessions list
│   │   │   │   └── chatStore.js        # Zustand: active session + messages
│   │   │   ├── hooks/
│   │   │   │   ├── useStream.js        # SSE streaming hook
│   │   │   │   └── useSessions.js      # Session CRUD hooks
│   │   │   ├── api/
│   │   │   │   └── client.js           # Axios instance + API functions
│   │   │   ├── utils/
│   │   │   │   └── timeAgo.js
│   │   │   ├── App.jsx
│   │   │   └── main.jsx
│   │   ├── tailwind.config.js
│   │   ├── vite.config.js
│   │   └── package.json
│   │
│   └── backend/                   # Node.js + Express
│       ├── src/
│       │   ├── routes/
│       │   │   ├── sessions.js         # CRUD for sessions
│       │   │   ├── messages.js         # Send message + SSE stream
│       │   │   └── health.js           # Health check
│       │   ├── controllers/
│       │   │   ├── sessionController.js
│       │   │   └── messageController.js
│       │   ├── services/
│       │   │   ├── ollama.js           # Ollama API client + stream
│       │   │   └── db.js               # pg pool + query helpers
│       │   ├── db/
│       │   │   └── migrations/
│       │   │       ├── 001_create_sessions.sql
│       │   │       └── 002_create_messages.sql
│       │   └── app.js                  # Express app setup
│       ├── server.js                   # Entry point
│       ├── .env.example
│       └── package.json
│
├── docker-compose.yml
├── nginx.conf
└── README.md
```

---

## 13. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| GPU VRAM insufficient for 30B model | Medium | High | Use `qwen3-coder:30b-q4_K_M` quantization (~18 GB); document CPU fallback with reduced speed |
| Ollama API latency / timeout | Medium | Medium | 120 s SSE timeout; user-visible error; retry button |
| Long context window degrading performance | High | Medium | Cap context to last 50 messages; show token count indicator |
| PostgreSQL connection pool exhaustion | Low | Medium | Use `pg` pool with `max: 10`; health check includes DB ping |
| Browser SSE connection drops | Low | Medium | Auto-reconnect with exponential backoff; connection status indicator |
| Session data loss on crash | Low | High | Transactional inserts; stream completion saves full message atomically |

---

## 14. Acceptance Criteria

These must pass before the application is considered production-ready:

- [ ] **AC-01** User creates a new chat; it appears in the sidebar within 500 ms and becomes the active session.
- [ ] **AC-02** Recent Chats section shows exactly the 5 most recently updated sessions, sorted correctly.
- [ ] **AC-03** Sending a message to Qwen3-Coder:30b produces a streaming response; first token arrives within 5 s on a GPU machine.
- [ ] **AC-04** Code blocks in AI responses render with correct syntax highlighting and a working Copy button.
- [ ] **AC-05** Renaming a session updates both the sidebar and the PostgreSQL row within 1 s.
- [ ] **AC-06** Deleting a session removes it from the sidebar and cascades to delete all its messages in PostgreSQL.
- [ ] **AC-07** Sessions are grouped correctly: Today / Yesterday / Previous 7 Days / Older.
- [ ] **AC-08** Stop Generation button halts the SSE stream; partial response is saved and displayed.
- [ ] **AC-09** When Ollama is offline, the frontend shows a clear error banner and the API returns 503.
- [ ] **AC-10** All REST endpoints return correct HTTP status codes and JSON error bodies on failure.
- [ ] **AC-11** Application starts in full with `docker compose up` without manual configuration beyond `.env`.
- [ ] **AC-12** Backend API integration test suite passes with ≥ 70 % route coverage.

---

## 15. Appendix

### 15.1 Environment Variables

Copy `.env.example` to `.env` before starting the backend.

```env
# --- Ollama ---
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=qwen3-coder:30b

# --- PostgreSQL ---
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=qwen_chat
POSTGRES_USER=postgres
POSTGRES_PASSWORD=yourpassword
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/qwen_chat

# --- API Server ---
API_PORT=8000
CORS_ORIGINS=http://localhost:3000

# --- Model Defaults ---
DEFAULT_TEMPERATURE=0.7
DEFAULT_MAX_TOKENS=2048
DEFAULT_TOP_P=0.9
DEFAULT_TOP_K=40
MAX_CONTEXT_MESSAGES=50
STREAM_TIMEOUT_MS=120000
```

### 15.2 Ollama Setup on Ubuntu 24.04

```bash
# 1. Install Ollama
curl -fsSL https://ollama.com/install.sh | sh

# 2. Pull the Qwen3-Coder model (requires ~18 GB disk for Q4)
ollama pull qwen3-coder:30b

# 3. Verify it is available
ollama list
curl http://localhost:11434/api/tags

# 4. Test a completion
curl http://localhost:11434/api/chat -d '{
  "model": "qwen3-coder:30b",
  "messages": [{"role": "user", "content": "Write hello world in Python"}],
  "stream": true
}'
```

### 15.3 Docker Compose

```yaml
version: '3.9'
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: qwen_chat
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: yourpassword
    volumes:
      - pgdata:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  backend:
    build: ./apps/backend
    ports:
      - "8000:8000"
    environment:
      DATABASE_URL: postgresql://postgres:yourpassword@postgres:5432/qwen_chat
      OLLAMA_BASE_URL: http://host.docker.internal:11434
      OLLAMA_MODEL: qwen3-coder:30b
    depends_on:
      - postgres
    extra_hosts:
      - "host.docker.internal:host-gateway"

  frontend:
    build: ./apps/frontend
    ports:
      - "3000:3000"
    depends_on:
      - backend

volumes:
  pgdata:
```

### 15.4 Recommended npm Packages

**Frontend (`apps/frontend`):**

```bash
npm create vite@latest frontend -- --template react
cd frontend
npm install react-router-dom zustand axios react-markdown
npm install react-syntax-highlighter lucide-react
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

**Backend (`apps/backend`):**

```bash
npm init -y
npm install express pg cors dotenv morgan
npm install -D jest supertest nodemon
```

---

*End of Document — Qwen3-Coder Chat Application PRD v1.0*
