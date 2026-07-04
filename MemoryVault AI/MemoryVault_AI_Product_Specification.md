# MemoryVault AI — Product Specification

> Tagline observed in app: **"AI Second Brain"**
> Reconstructed from screen-recording analysis. No existing codebase — this is a from-scratch spec.

---

## 1. Overall Purpose

MemoryVault AI is a **personal knowledge-management / "second brain" web application**. It lets a user capture everyday inputs — notes, voice memos, chat/conversation logs, meeting notes, photos, documents, and activity logs — into a single unified, AI-organized memory store. The AI automatically tags, categorizes, summarizes, and surfaces connections between these "memories," and lets the user query their own history using natural language (RAG-style chat) instead of manually searching folders.

Core value proposition: *"Capture everything, let AI organize it, and ask your memory anything."*

---

## 2. Main User Journey

1. **Sign up / log in** → lands on **Dashboard**.
2. **Capture** a memory via the global "+ Capture" button (Note, Voice, Chat, or Meeting) or via Quick Capture tiles on the Dashboard.
3. AI (background "AI Active" indicator) automatically **summarizes, tags, and categorizes** the new memory in real time.
4. User **browses** memories via Timeline (chronological feed), Calendar (date-based), Collections (manual folders), or Categories (auto type-based + tag cloud).
5. User **pins** or **favorites** important memories for quick access from the Dashboard.
6. User **asks the AI Assistant** natural-language questions ("What did I discuss in my last meeting?") and gets synthesized answers drawn from their memories.
7. User **searches/filters** memories directly when they know roughly what they're looking for.
8. User reviews **Analytics** to understand capture habits, mood trends, and memory-type distribution.
9. User manages **account/settings**, reviews **notifications**, recovers items from **Trash**, or visits **Help Center** for support.

---

## 3. Complete Feature List

### Capture & Input
- Global "+ Capture" button (top nav, always visible)
- 4 capture types: **Note**, **Voice** (memo), **Chat** (conversation log), **Meeting**
- Quick Capture tiles replicated on Dashboard (Note / Voice / Chat / Meeting)
- (Inferred) Image/Document upload capture, since "Image" and "Document" memory types exist and appear in Categories/Timeline despite no dedicated quick-capture tile shown — likely accessible via a generic "Capture" modal with a type picker or drag-and-drop upload.

### Memory Types (7)
| Type | Icon Color | Example from recording |
|---|---|---|
| Note | Blue | "Midnight thought on consciousness" |
| Conversation | Green | "Chat with Sarah about remote work" |
| Meeting | Orange | "Q3 Product Strategy Meeting" |
| Voice Memo | Pink | "Voice memo: App idea brainstorm" |
| Image | Purple | "Sunset at the lake — photo journal" |
| Document | Teal | "Design principles from Dieter Rams" |
| Activity | Amber | "Morning run insights" |

### Organization
- **Pin** memories (shown in dedicated "Pinned" section on Dashboard)
- **Favorite/star** memories (counted in stats, filterable)
- **Tagging** — manual + AI-suggested tags, shown as chips on every memory card
- **Collections** — user-created named groups (e.g., Work, Personal, Learning, Ideas, Health) with icon, color, description, and memory count
- **Categories** — auto-derived groupings by memory *type*, each showing a count, plus a **Popular Tags** cloud with per-tag counts
- **Trash** — soft-delete with restore capability ("Deleted memories can be restored")

### Browsing & Discovery
- **Dashboard** — daily greeting, stat cards, quick capture, pinned, recent memories, AI insight banner
- **Timeline** — full reverse-chronological feed of all memories, card grid
- **Calendar** — month view; days with memories are indicated; clicking a day filters memories captured that day
- **Search** — dedicated full-text + filter search page (type filter, sort order, favorites-only toggle)
- **AI Assistant** — conversational natural-language Q&A over the memory corpus, with suggested starter prompts
- **Analytics** — usage/insight dashboard (see AI features below)

### Account & System
- **Profile** — identity, role, member-since date, lifetime stats (memories/collections/favorites), account details
- **Notifications** — All/Unread tabs, empty state shown
- **Settings** — Profile editing, AI Preferences, Notification preferences, Appearance (dark mode/compact view), Danger Zone (export data, delete account)
- **Help Center** — searchable FAQ, quick guides, contact support
- **Collapsible sidebar** ("Collapse" control at bottom of nav)
- **Global keyboard shortcut** for search (⌘K)
- **AI Active** live status indicator in sidebar footer ("Processing & organizing your memories in real-time")

---

## 4. Navigation Structure

Persistent left sidebar, grouped into 3 sections, plus a top bar.

**Top Bar (all pages):** Logo/App name ("MemoryVault — AI Second Brain") · Page title (breadcrumb-style, changes per route) · Global Search input (⌘K) · "+ Capture" button (primary, purple) · Notification bell icon · User avatar (initials, e.g., "MM")

**Sidebar — MAIN**
- Dashboard
- Timeline
- Calendar
- Collections
- Categories

**Sidebar — INTELLIGENCE**
- AI Assistant
- Search
- Analytics

**Sidebar — ACCOUNT**
- Profile
- Notifications
- Settings
- Trash
- Help Center

**Sidebar footer:** "AI Active" status card + "Collapse" toggle

This is a single persistent shell (sidebar + topbar) with a routed content area — i.e., a classic SPA dashboard layout, not a marketing site + app split (no public marketing pages were observed in the recording).

---

## 5. Every Page Visible in the Recording

1. **Dashboard** (`/`)
2. **Timeline** (`/memories` or `/timeline`)
3. **Calendar** (`/calendar`)
4. **Collections** (`/collections`, and filtered `/memories?collection=Personal`)
5. **Categories** (`/categories`)
6. **AI Assistant** (`/assistant` or `/search` per observed URL — see note below)
7. **Search** (`/search`)
8. **Analytics** (`/analytics`)
9. **Profile** (`/profile`)
10. **Notifications** (`/notifications`)
11. **Settings** (`/settings`)
12. **Trash** (`/trash`)
13. **Help Center** (`/help`)

> Note: the recording's browser status bar showed URLs like `.../search` and `.../categories` and `.../memories?collection=Personal` on a `base44.app` subdomain — confirming this was prototyped on a no-code platform (Base44). We will rebuild it as a genuine custom codebase per the request.

No login/signup screen was captured in the recording, and no individual "memory detail" modal/page was opened on-camera — both are inferred and specified below since they're essential to the product.

---

## 6. Components Required on Each Page

### Dashboard
- Greeting header ("Good morning 👋" + dynamic time-of-day + subtitle) with "AI Assistant" CTA button
- 4 Stat Cards: Total Memories, This Week, Favorites, Active (AI Insights status)
- Quick Capture row: 4 colored action tiles (Note/Voice/Chat/Meeting)
- Pinned section: list of pinned MemoryCards (full-width card with icon, type badge, pin icon, title, snippet, tags, relative timestamp)
- Recent Memories section: grid of MemoryCards + "View all →" link
- AI Insight banner/card (purple-bordered, sparkle icon, generated insight text)

### Timeline
- Page header + subtitle
- Memory card grid (responsive 3-column), each card: type icon (colored), type label badge, optional star/favorite icon, optional pin icon, title, 1–2 line description, tag chips, relative time ("2 days ago")
- (Inferred) Infinite scroll or pagination; filter/sort affordances consistent with Search page

### Calendar
- Header + subtitle ("Navigate your memories through time — N memories this month")
- Month calendar grid (Sun–Sat columns), "Today" button, prev/next month chevrons, current-day highlight, day cells with indicator dot/overflow ("...") when memories exist
- Side panel: "Select a day" empty state OR list of memories for the selected day

### Collections
- Header + subtitle + "New Collection" primary button
- Grid of Collection cards: colored icon, name, description, memory count, hover affordance (arrow / "..." overflow menu)
- Collection detail (filtered Timeline view) when a collection is opened
- "New Collection" modal (inferred): name, description, icon picker, color picker

### Categories
- Header + subtitle
- Grid of Type cards: icon, count, label (Notes, Conversations, Meetings, Voice Memos, Images, Documents, Activity)
- "Popular Tags" section: tag chip cloud, each chip showing tag name + usage count
- Clicking a type or tag (inferred) filters into Timeline/Search

### AI Assistant
- Centered hero: brain-icon avatar, "Ask your **memory**" headline, subtitle
- Grid of 6 suggested-prompt cards (e.g., "What did I discuss in my last meeting?")
- Sticky bottom chat input bar ("Ask anything about your memories...") + send button
- (Inferred, not captured mid-conversation) Chat message thread view: user bubble vs. AI bubble, AI responses citing/linking source memories, streaming response indicator, "new chat" / conversation history list

### Search
- Header + subtitle
- Search input (full width, icon-prefixed)
- Filter row: Filters button, "All Types" dropdown, sort dropdown ("Newest First"), "Favorites" toggle button
- Result count text ("8 results")
- Result grid of MemoryCards (same component as Timeline)

### Analytics
- Header + subtitle
- 4 stat cards: Total Memories, Avg/Day, Favorites, Pinned
- "Memory Activity (Last 30 Days)" line/area chart (date x-axis, count y-axis)
- "Memories by Type" bar chart (per-type colored bars)
- "Mood Distribution" donut/pie chart
- "Capture Time of Day" bar chart (hour-of-day histogram)

### Profile
- Header + subtitle
- Identity card: avatar initials, full name, edit-pencil icon, email, role badge, "Member since" date
- 3 stat tiles: Memories, Collections, Favorites
- "Account Details" panel: Full Name, Email, Role, User ID (read-only key/value rows)

### Notifications
- Header + subtitle ("N unread notifications")
- Tab toggle: All / Unread
- Empty state: bell icon, "No notifications", helper text
- (Inferred) Notification list item component: icon, message, timestamp, read/unread dot, mark-as-read action

### Settings
- Header + subtitle
- "Profile" section card: Display Name (editable input), Email (read-only or editable)
- "AI Preferences" section card: toggles — Auto-summarize memories, Suggest related memories, AI-powered tagging
- "Notifications" section card: toggles — Daily memory digest, Weekly insights report, Memory anniversary reminders
- "Appearance" section card: toggles — Dark mode, Compact view
- "Danger Zone" section card (red accent): "Export all data" (button), "Delete account" (destructive button)
- Sticky/inline "Save Changes" primary button

### Trash
- Header + subtitle ("N items · Deleted memories can be restored")
- Empty state: trash icon, "Trash is empty", helper text, "Browse Memories" CTA
- (Inferred) Populated state: MemoryCard variant with "Restore" and "Delete permanently" actions, auto-purge countdown (e.g., "Deleted 12 days ago — purges in 18 days")

### Help Center
- Hero: icon, "Help Center" title, subtitle, search-for-help input
- "Quick Guides" grid (4 cards): Getting Started, Using AI Assistant, Timeline & Calendar, Organize with Collections — each with icon, title, description, arrow
- "Frequently Asked Questions" accordion list (7 items observed)
- "Still need help?" contact card with "Contact Support" link/button

---

## 7. Reusable UI Components

- **AppShell** (Sidebar + Topbar + content outlet)
- **SidebarNavItem** (icon + label + active state + badge support)
- **AIStatusCard** (sidebar footer "AI Active" indicator)
- **TopBar** (page title, GlobalSearchInput, CaptureButton, NotificationBell, UserAvatarMenu)
- **CaptureButton + CaptureModal** (type picker → Note/Voice/Chat/Meeting/Image/Document form)
- **MemoryCard** (icon, type badge, star, pin, title, snippet, tag chips, timestamp) — used on Dashboard, Timeline, Search, Collections, Categories, Trash, Calendar day panel
- **MemoryDetailModal/Page** (inferred — full content, edit, delete, pin/favorite toggle, AI-suggested related memories, comments/notes)
- **TagChip**
- **StatCard** (icon, value, label, optional trend)
- **SectionCard** (used heavily in Settings — header icon + title + content)
- **ToggleSwitch**
- **EmptyState** (icon, title, description, optional CTA) — reused in Notifications, Trash, AI Assistant first-load, Calendar "select a day"
- **Dropdown/Select** (type filter, sort order)
- **Button variants** (primary/purple, destructive/red, ghost, icon-only)
- **Avatar** (initials-based)
- **Modal/Dialog** (New Collection, Capture, Confirm Delete)
- **Chart components**: LineChart, BarChart, DonutChart (Analytics)
- **Calendar grid component**
- **Accordion** (FAQ)
- **Breadcrumb/PageHeader** (title + subtitle, consistent across all pages)
- **Toast/Notification** (inferred, for save/delete confirmations)

---

## 8. Suggested Database Entities

```
User
- id (PK)
- full_name
- email (unique)
- password_hash            -- if not using third-party auth
- avatar_url / initials_color
- role (enum: admin, member)
- created_at (member since)
- ai_preferences (jsonb: auto_summarize, suggest_related, ai_tagging)
- notification_preferences (jsonb: daily_digest, weekly_report, anniversary_reminders)
- appearance_preferences (jsonb: dark_mode, compact_view)
- updated_at

Memory
- id (PK)
- user_id (FK -> User)
- type (enum: note, conversation, meeting, voice_memo, image, document, activity)
- title
- content (text/markdown — raw captured content)
- ai_summary (text — generated description shown on cards)
- media_url (nullable — for voice/image/document file storage)
- mood (enum/nullable — used in Mood Distribution chart)
- is_favorite (bool)
- is_pinned (bool)
- occurred_at (timestamp — when the memory "happened", drives Calendar/Timeline)
- created_at / updated_at
- deleted_at (nullable — soft delete / Trash, with purge_at derived)

Tag
- id (PK)
- user_id (FK -> User)       -- tags are scoped per user
- name (unique per user)

MemoryTag (join table)
- memory_id (FK -> Memory)
- tag_id (FK -> Tag)

Collection
- id (PK)
- user_id (FK -> User)
- name
- description
- icon (string/enum)
- color (string)
- created_at / updated_at

MemoryCollection (join table)
- memory_id (FK -> Memory)
- collection_id (FK -> Collection)

AIConversation
- id (PK)
- user_id (FK -> User)
- title (auto-generated from first message)
- created_at / updated_at

AIMessage
- id (PK)
- conversation_id (FK -> AIConversation)
- role (enum: user, assistant)
- content (text)
- referenced_memory_ids (array/jsonb — memories cited in the answer)
- created_at

Notification
- id (PK)
- user_id (FK -> User)
- type (enum: digest, insight, reminder, system)
- message
- is_read (bool)
- created_at

AnalyticsSnapshot (optional, or computed on the fly)
- user_id
- date
- memories_captured_count
- avg_per_day
- type_breakdown (jsonb)
- mood_breakdown (jsonb)
- capture_hour_histogram (jsonb)
```

### Relationships
- **User 1—N Memory**
- **User 1—N Collection**
- **User 1—N Tag**
- **Memory N—M Tag** via MemoryTag
- **Memory N—M Collection** via MemoryCollection (a memory can live in multiple collections; matches "5 collections, 8 memories" math where totals didn't need to add up exactly)
- **User 1—N AIConversation 1—N AIMessage**
- **AIMessage N—M Memory** (referenced/cited memories, loosely modeled as an id array or join table)
- **User 1—N Notification**
- **Memory soft-delete** → Trash is simply `Memory.deleted_at IS NOT NULL`, filtered out of all normal queries

---

## 9. Authentication Flow

Not captured in the recording (session was already logged in), so this is a reasonable, standard inference:

1. **Landing/marketing page** (optional, minimal) → "Sign in" / "Get started"
2. **Sign Up**: name, email, password (or OAuth — Google) → creates `User` row → redirected to Dashboard with an empty-state onboarding ("Capture your first memory" — matches the Help Center "Getting Started" guide copy)
3. **Sign In**: email + password (or OAuth) → JWT/session cookie → Dashboard
4. **Forgot Password**: email link → reset form
5. **Session handling**: persistent session (httpOnly cookie) checked by middleware on every protected route; all `/app/*` routes require auth and redirect to `/login` if absent
6. **Account deletion** (from Settings → Danger Zone) → confirmation modal → cascades delete of all user data, then logs out
7. **Roles**: a "role" field exists (`admin` seen in Profile) — likely vestigial/single-tenant for now, but worth keeping for future team/sharing features

Recommended implementation: email/password + Google OAuth via NextAuth.js (Auth.js) or Supabase Auth, with bcrypt-hashed passwords if rolling custom auth.

---

## 10. AI Features

1. **Auto-summarization** — every captured memory (note/voice/meeting/etc.) gets an AI-generated short description/snippet shown on its card (toggle in Settings: "Auto-summarize memories")
2. **AI-powered tagging** — automatic tag suggestion/assignment on capture (toggle in Settings: "AI-powered tagging")
3. **Related memory suggestions** — AI surfaces related/connected memories (toggle in Settings: "Suggest related memories"); likely surfaced in a Memory Detail view ("Related Memories" panel)
4. **Conversational AI Assistant (RAG)** — natural-language Q&A over the user's entire memory corpus; retrieves relevant memories via semantic search (vector embeddings) and generates a grounded answer with citations back to source memories
5. **Voice-to-text transcription** — for Voice Memo captures (implied by "Voice memo: App idea brainstorm" content being readable text)
6. **AI Insights banner** — proactive, periodic insight generated from patterns across memories, shown on Dashboard ("AI Active... Processing & organizing your memories in real-time")
7. **Mood/sentiment detection** — analytics shows a "Mood Distribution" chart, implying AI sentiment-tags each memory
8. **Weekly insights report / Daily memory digest** — scheduled AI-generated email or in-app summary (toggles in Settings)
9. **Memory anniversary reminders** — AI/scheduled job resurfaces a memory from "N years/months ago today"

### Suggested AI Architecture
- **Embeddings**: generate vector embedding per memory (title + content + summary) on create/update → store in a vector index (pgvector, Pinecone, or Weaviate)
- **RAG pipeline** for AI Assistant: user query → embed query → vector similarity search top-k memories → inject as context → LLM generates answer with citations
- **Background job queue** (e.g., BullMQ/Redis or Inngest) for: summarization, tagging, embedding generation, mood detection, digest emails — keeps capture fast and async, matching the "AI Active... processing in real-time" UX
- **LLM provider**: Anthropic Claude API (e.g., Claude Sonnet/Haiku) for summarization, tagging, RAG answers; a smaller/faster model for tagging, a stronger one for the Assistant conversation
- **Speech-to-text**: Whisper API (or Claude's audio support if available) for Voice Memo transcription

---

## 11. Suggested Technology Stack

**Frontend**
- Next.js 14+ (App Router) + React + TypeScript
- Tailwind CSS (matches the dark, purple-accented, card-based design system observed)
- shadcn/ui for base components (dialogs, dropdowns, toggles, accordion)
- Recharts for Analytics charts (line, bar, donut)
- React Query / TanStack Query for data fetching & cache
- Zustand or React Context for lightweight client state (sidebar collapsed state, capture modal)
- Framer Motion for transitions (page fades, modal animations)

**Backend**
- Next.js API routes / Route Handlers (or a separate Node.js + Express/Fastify service if decoupling)
- PostgreSQL as primary datastore
- Prisma ORM
- pgvector extension on Postgres for embeddings (avoids a separate vector DB for v1)
- Redis (caching, rate limiting, job queue backing store)
- BullMQ or Inngest for background AI jobs

**Auth**
- Auth.js (NextAuth) with email/password + Google provider, or Supabase Auth if using Supabase as BaaS

**AI / ML**
- Anthropic Claude API (summarization, tagging, RAG chat, insights)
- OpenAI Whisper (or equivalent) for voice transcription
- text-embedding model (OpenAI `text-embedding-3-small` or Voyage AI) for vector embeddings

**Storage**
- S3-compatible object storage (AWS S3 / Cloudflare R2) for uploaded images/documents/audio files

**Infra / DevOps**
- Vercel (frontend + API routes) or Docker + Fly.io/Render for full-stack hosting
- GitHub Actions CI (lint, typecheck, test, deploy)
- Sentry for error monitoring
- PostHog or Plausible for product analytics (separate from in-app Analytics feature)

---

## 12. Folder Structure

```
memoryvault-ai/
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── public/
│   └── icons/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   ├── signup/page.tsx
│   │   │   └── forgot-password/page.tsx
│   │   ├── (app)/                      # authenticated shell layout
│   │   │   ├── layout.tsx              # Sidebar + Topbar
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── timeline/page.tsx
│   │   │   ├── calendar/page.tsx
│   │   │   ├── collections/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [collectionId]/page.tsx
│   │   │   ├── categories/page.tsx
│   │   │   ├── assistant/page.tsx
│   │   │   ├── search/page.tsx
│   │   │   ├── analytics/page.tsx
│   │   │   ├── profile/page.tsx
│   │   │   ├── notifications/page.tsx
│   │   │   ├── settings/page.tsx
│   │   │   ├── trash/page.tsx
│   │   │   ├── help/page.tsx
│   │   │   └── memories/[memoryId]/page.tsx   # Memory detail
│   │   └── api/
│   │       ├── auth/[...nextauth]/route.ts
│   │       ├── memories/route.ts
│   │       ├── memories/[id]/route.ts
│   │       ├── collections/route.ts
│   │       ├── tags/route.ts
│   │       ├── assistant/route.ts             # RAG chat endpoint
│   │       ├── analytics/route.ts
│   │       ├── notifications/route.ts
│   │       └── settings/route.ts
│   ├── components/
│   │   ├── layout/ (Sidebar, TopBar, AIStatusCard)
│   │   ├── memory/ (MemoryCard, MemoryDetailModal, CaptureModal)
│   │   ├── dashboard/ (StatCard, QuickCapture, PinnedSection, InsightBanner)
│   │   ├── calendar/ (CalendarGrid, DayPanel)
│   │   ├── analytics/ (LineChartCard, BarChartCard, DonutChartCard)
│   │   ├── settings/ (SectionCard, ToggleRow)
│   │   └── ui/ (shadcn primitives: button, dialog, dropdown, accordion, switch, badge, input)
│   ├── lib/
│   │   ├── db.ts (Prisma client)
│   │   ├── auth.ts
│   │   ├── ai/
│   │   │   ├── summarize.ts
│   │   │   ├── tag.ts
│   │   │   ├── embed.ts
│   │   │   ├── rag.ts
│   │   │   └── transcribe.ts
│   │   ├── queue/ (BullMQ job definitions: summarize-job, embed-job, digest-job)
│   │   └── utils.ts
│   ├── hooks/ (useMemories, useCollections, useAssistantChat, useAnalytics)
│   ├── types/ (memory.ts, collection.ts, user.ts)
│   └── styles/globals.css
├── .env.example
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## 13. Development Roadmap

### Phase 0 — Foundation (Week 1)
- Repo setup, Next.js + TypeScript + Tailwind + shadcn/ui scaffolding
- Prisma schema + Postgres setup (User, Memory, Tag, Collection + joins)
- Auth.js integration (email/password + Google OAuth)
- App shell: Sidebar, TopBar, route structure, dark theme/design tokens (colors, card styles matching recording)

### Phase 1 — Core Capture & Browse (Weeks 2–3)
- Capture modal (Note, Voice — file upload only at first, Chat, Meeting types)
- MemoryCard component + Timeline page (CRUD: create, list, soft-delete)
- Memory Detail page/modal (view, edit, delete, pin, favorite)
- Dashboard: stat cards (real counts), Quick Capture, Pinned, Recent Memories
- Calendar page with real memory-date indicators and day-filtering

### Phase 2 — Organization (Week 4)
- Collections: CRUD, assign memories to collections, collection detail view
- Categories: type aggregation page + tag cloud (computed from real data)
- Tagging UI (manual add/remove tags on a memory)
- Trash: soft-delete flow, restore, permanent delete, auto-purge job

### Phase 3 — AI Layer (Weeks 5–6)
- Embedding pipeline on memory create/update (pgvector)
- Auto-summarization job (Claude API) feeding the card snippet
- AI-powered auto-tagging job
- AI Assistant page: chat UI + RAG endpoint (retrieve top-k memories, generate cited answer)
- Voice transcription pipeline (Whisper) for Voice Memo capture
- Mood/sentiment tagging for memories

### Phase 4 — Search, Analytics & Insights (Week 7)
- Search page: full-text + filters (type, sort, favorites) — Postgres full-text or hybrid with vector search
- Analytics page: real aggregation queries → 4 stat cards + 4 charts
- AI Insights banner generation (scheduled job analyzing recent activity)
- Daily digest / Weekly report email jobs

### Phase 5 — Account, Settings, Polish (Week 8)
- Profile page (editable identity, real stats)
- Settings: persist AI/notification/appearance preferences; Export data (JSON/zip download); Delete account flow
- Notifications: real notification generation + read/unread state
- Help Center: static FAQ content + working search-in-page filter
- Responsive QA, empty states, loading skeletons, toasts, accessibility pass

### Phase 6 — Hardening & Launch (Week 9+)
- Rate limiting, input validation/sanitization, file-upload virus/type checks
- Error monitoring (Sentry), structured logging
- E2E tests (Playwright) for capture → AI processing → search/assistant happy path
- Performance pass (pagination/virtualization on Timeline, image optimization)
- Deploy to production, set up backups for Postgres + object storage
