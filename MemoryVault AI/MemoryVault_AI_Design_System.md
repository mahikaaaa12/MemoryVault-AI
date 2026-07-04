# MemoryVault AI — Design System

> Derived from pixel-level analysis of the reference screen recording (colors sampled directly from frames) plus directional choices to bring it in line with best-in-class modern SaaS products. **Documentation only — no application code.**

---

## 0. Design Philosophy

MemoryVault is a **dark-first, focus-mode productivity tool**. The visual language borrows specific, intentional things from five references rather than vaguely "looking like all of them":

| Reference | What we borrow |
|---|---|
| **Linear** | Near-black, low-chroma base surface; hairline 1px borders instead of heavy drop shadows; tight 13–14px UI type; restrained motion |
| **Notion** | Calm information density, generous internal card padding, icon-led list rows |
| **Vercel** | Pure geometric sans (Inter-class), high-contrast white-on-black headings, minimal color used only for status/accent |
| **Arc Browser** | Playful gradient accents on an otherwise monochrome shell; soft glow behind hero icons; rounded "squircle" icon containers |
| **ChatGPT** | Centered conversational hero layout, pill-shaped suggested-prompt chips, composer bar pinned to viewport bottom |

**Three non-negotiable rules:**
1. The base UI is **monochrome dark slate/navy** — color is reserved for meaning (memory type, status, charts, the single brand accent).
2. **One accent family** (violet/purple) carries all primary actions, focus states, and active navigation. It must never compete with the 7 memory-type colors.
3. **Elevation comes from subtle borders + barely-there shadows**, not from big color jumps — surfaces sit only 1–2 steps lighter than the base background.

---

## 1. Color Palette

### 1.1 Base surfaces (sampled directly from the recording)

| Token | Hex | Sampled from | Usage |
|---|---|---|---|
| `--bg-canvas` | `#0B0C15` | Page background, far from any card | Root app background |
| `--bg-shell` | `#0E1020` | Sidebar / top bar background | Sidebar, topbar |
| `--bg-surface` | `#12132A` | Stat cards, quick-capture tiles, memory cards | Default card surface |
| `--bg-surface-raised` | `#181A33` | Pinned memory card, hover states | Emphasized / hovered cards |
| `--bg-surface-active` | `#1C1740` | Active sidebar nav item | Selected/active states (violet-tinted) |
| `--border-subtle` | `#21233F` | Card edges (barely visible 1px) | Default card/divider border |
| `--border-default` | `#2A2D4D` | Input borders, dropdown borders | Inputs, dropdowns |
| `--border-focus` | `#7C3AED` | — (brand) | Focus rings, active input border |

### 1.2 Text

| Token | Hex | Usage |
|---|---|---|
| `--text-primary` | `#F8FAFC` | Headings, primary labels, values |
| `--text-secondary` | `#A1A8C3` | Body copy, descriptions, card snippets |
| `--text-tertiary` | `#6B7290` | Timestamps, helper text, placeholder |
| `--text-disabled` | `#454966` | Disabled control labels |
| `--text-on-accent` | `#FFFFFF` | Text/icons on filled violet buttons |

### 1.3 Brand accent (sampled from logo mark, Capture button, AI hero icon)

| Token | Hex | Notes |
|---|---|---|
| `--accent-400` | `#9F75F0` | Gradient text highlight (e.g. "**memory**" in "Ask your memory") |
| `--accent-500` | `#8B5CF6` | Hover state of primary buttons |
| `--accent-600` | `#7C3AED` | **Primary brand color** — Capture button, active nav bar, links |
| `--accent-700` | `#6320D6` | Gradient end / pressed state |
| `--accent-glow` | `#7C3AED` @ 35% opacity, 40px blur | Soft glow behind hero icons (Arc-style) |

Primary gradient (used on the Capture button and AI hero icon): `linear-gradient(135deg, #722CE4 0%, #5B21B6 100%)`

### 1.4 Memory-type colors (sampled from category icons — these are fixed semantic colors, never reused for anything else)

| Type | Color token | Hex | Icon |
|---|---|---|---|
| Note | `--type-note` | `#3B82F6` (blue-500) | document |
| Voice Memo | `--type-voice` | `#EC4899` (pink-500) | microphone |
| Conversation | `--type-conversation` | `#10B981` (emerald-500) | chat bubble |
| Meeting | `--type-meeting` | `#F97316` (orange-500) | calendar |
| Image | `--type-image` | `#A855F7` (purple-500) | image |
| Document | `--type-document` | `#14B8A6` (teal-500) | file-text |
| Activity | `--type-activity` | `#F59E0B` (amber-500) | activity/pulse |

Each type color is used at **full saturation only on the small icon badge** (28–40px squircle). Everywhere else (card border accents, chart legends) it drops to a 12–16% background tint of the same hue, e.g. `rgba(59,130,246,0.12)` for Note.

### 1.5 Semantic / status colors

| Token | Hex | Usage |
|---|---|---|
| `--success` | `#22C55E` | "AI Active" dot, success toasts, positive deltas |
| `--warning` | `#F59E0B` | Caution banners |
| `--danger` | `#EF4444` | Danger Zone, destructive buttons, delete confirmations |
| `--info` | `#3B82F6` | Informational banners |
| `--favorite-gold` | `#FBBF24` | Star/favorite icon |

### 1.6 Chart palette (Analytics)

Ordered sequence for multi-series charts (bars/donut), cycling in this order: `#3B82F6 → #EC4899 → #10B981 → #F97316 → #A855F7 → #14B8A6 → #F59E0B`
This is identical to the memory-type palette — analytics colors must always match their corresponding type color so a user can pattern-match a bar to a category instantly.

---

## 2. Typography Scale

**Font families**
- **UI / body**: `Inter` (or `Inter Variable`) — geometric, high x-height, matches Vercel/Linear
- **Numerals / stats**: `Inter` with `font-feature-settings: "tnum"` (tabular numbers) so stat cards never jitter
- **Monospace** (User ID, API keys if added later): `JetBrains Mono` or `Roboto Mono`

**Scale** (1.250 — "Major Third" ratio, rounded to clean pixel values)

| Token | Size / Line-height | Weight | Usage |
|---|---|---|---|
| `--text-display` | 32px / 40px | 700 | "Good morning 👋", hero headline ("Ask your **memory**") |
| `--text-h1` | 28px / 36px | 700 | Page title in header (e.g. "Dashboard", "Analytics") |
| `--text-h2` | 20px / 28px | 600 | Section headers ("Quick Capture", "Pinned", "Recent Memories") |
| `--text-h3` | 16px / 24px | 600 | Card titles (memory title, collection name) |
| `--text-body` | 14px / 20px | 400 | Default body copy, card descriptions |
| `--text-body-sm` | 13px / 18px | 400 | Secondary text, tag chips, table cells |
| `--text-caption` | 12px / 16px | 500 | Timestamps, badges, helper text |
| `--text-eyebrow` | 11px / 16px | 600, uppercase, +0.06em tracking | Sidebar section labels ("MAIN", "INTELLIGENCE", "ACCOUNT") |
| `--text-stat` | 30px / 36px | 700, tabular-nums | Big numbers in stat cards ("8", "0.3", "3") |

**Weight ramp**: 400 (regular body), 500 (emphasis/labels), 600 (headings/buttons), 700 (display numbers, page titles). Never use 800/900 — keeps the brand feeling calm, not shouty.

**Gradient text treatment**: reserved for exactly one phrase per hero moment (e.g. "memory" in "Ask your memory") — `background: linear-gradient(90deg, #C4B5FD, #7C3AED); -webkit-background-clip: text;`. Never apply gradient text to more than 1–2 words.

---

## 3. Spacing System

Base unit: **4px**, exposed as a token scale (Tailwind-compatible) so every margin/padding in the product is one of these values — no arbitrary numbers.

| Token | Value |
|---|---|
| `--space-1` | 4px |
| `--space-2` | 8px |
| `--space-3` | 12px |
| `--space-4` | 16px |
| `--space-5` | 20px |
| `--space-6` | 24px |
| `--space-8` | 32px |
| `--space-10` | 40px |
| `--space-12` | 48px |
| `--space-16` | 64px |

**Applied conventions** (observed in recording):
- Page content padding: `--space-8` (32px) horizontal, `--space-6` (24px) top
- Card internal padding: `--space-6` (24px)
- Gap between cards in a grid: `--space-6` (24px)
- Gap between stacked sections (Quick Capture → Pinned → Recent): `--space-8` (32px)
- Sidebar nav item padding: `12px 16px` (`--space-3` / `--space-4`)
- Sidebar item-to-item gap: `--space-1` (4px)
- Icon-to-label gap (inline): `--space-2` (8px)
- Tag chip internal padding: `4px 10px`

---

## 4. Border Radius

A 3-tier rounding system — never use `border-radius: 0` (no sharp corners anywhere) and never exceed full-pill except for avatars/icon badges.

| Token | Value | Usage |
|---|---|---|
| `--radius-sm` | 6px | Tag chips, small badges, checkboxes |
| `--radius-md` | 10px | Inputs, buttons, dropdown menus |
| `--radius-lg` | 14px | Cards (stat cards, memory cards, collection cards) |
| `--radius-xl` | 20px | Modals, large panels, icon "squircles" (Quick Capture / AI hero icon) |
| `--radius-full` | 9999px | Avatars, status dots, pill buttons, toggle switches |

The signature shape is the **squircle icon container** (radius-xl applied to a square ~44–88px box) used for: Quick Capture tiles, Category type cards, the AI Assistant hero icon, and Collection icons. This squircle is the single most recognizable shape in the product — keep it exclusive to "iconic" containers, never apply it to plain content cards.

---

## 5. Shadows / Elevation

Shadows are **almost invisible** — elevation is communicated primarily through border + a slightly lighter surface color, with shadow only adding depth on interactive/floating elements (Linear-style restraint).

| Token | Value | Usage |
|---|---|---|
| `--shadow-none` | none | Static cards at rest |
| `--shadow-xs` | `0 1px 2px rgba(0,0,0,0.4)` | Inputs, buttons at rest |
| `--shadow-sm` | `0 2px 8px rgba(0,0,0,0.35)` | Card hover lift |
| `--shadow-md` | `0 8px 24px rgba(0,0,0,0.45)` | Dropdown menus, popovers |
| `--shadow-lg` | `0 16px 48px rgba(0,0,0,0.55)` | Modals, dialogs |
| `--shadow-glow-accent` | `0 0 32px rgba(124,58,237,0.35)` | Behind the AI hero icon, behind the active "AI Active" status card, primary button hover |
| `--shadow-glow-success` | `0 0 16px rgba(34,197,94,0.3)` | "AI Active" pulsing dot |

Rule of thumb: **borders define edges, shadows define floating.** Anything in the normal document flow (cards in a grid) uses border only; anything that floats above content (modal, dropdown, toast, tooltip) gets a shadow.

---

## 6. Glassmorphism Rules

Glassmorphism is used **sparingly and only for floating/overlay surfaces**, never for base page content (keeps performance high and avoids the "everything is frosted" cliché).

**Where to use it:**
- Modals / dialogs backdrop
- Command palette (⌘K search overlay)
- Notification dropdown / user menu popover
- Sticky AI Assistant composer bar at the bottom of the screen

**Recipe:**
```
background: rgba(18, 19, 42, 0.72);
backdrop-filter: blur(20px) saturate(140%);
-webkit-backdrop-filter: blur(20px) saturate(140%);
border: 1px solid rgba(255, 255, 255, 0.08);
box-shadow: var(--shadow-lg);
```

**Backdrop scrim** (behind modals): `background: rgba(5, 6, 12, 0.6); backdrop-filter: blur(4px);`

**Rules:**
- Never stack two glass layers on top of each other.
- Text on glass must use `--text-primary` / `--text-secondary` only — never reduce text opacity to "fit the vibe," it hurts legibility.
- Glass borders are always `rgba(255,255,255,0.08–0.12)`, never a solid color.

---

## 7. Grid System

**Shell layout**
- Sidebar: fixed `260px` width (desktop), collapsible to `72px` (icon-only rail) via the "Collapse" control
- Top bar: fixed `64px` height, full remaining width, sticky on scroll
- Content area: `max-width: 1440px`, centered, with `32px` horizontal padding; no max-width constraint below 1440px viewport (content fills)

**Breakpoints**

| Name | Width | Behavior |
|---|---|---|
| `sm` | ≥ 640px | Single-column cards |
| `md` | ≥ 768px | 2-column card grids |
| `lg` | ≥ 1024px | 3-column card grids; sidebar becomes persistent (below this, sidebar overlays as a drawer) |
| `xl` | ≥ 1280px | 4-column stat-card rows |
| `2xl` | ≥ 1536px | Content max-width caps at 1440px, extra space becomes margin |

**Card grids observed in the app:**
- Dashboard stat cards: 4-column grid, `gap: 24px`, equal-width
- Quick Capture tiles: 4-column grid, `gap: 24px`, equal-width, square-ish aspect
- Timeline / Search / Categories result cards: 3-column grid, `gap: 24px`, `minmax(320px, 1fr)`
- Collections: 3-column grid, `gap: 24px`
- Categories type tiles: 4-column grid, `gap: 20px`
- Calendar: 7-column grid (`repeat(7, 1fr)`) for day cells, `gap: 4px`, fixed aspect-square cells
- Analytics charts: 2-column grid for the two bottom chart cards, full-width for the top activity chart

Base grid unit for all of the above: **12-column responsive grid**, gutters `24px`, with components spanning `span 3` (stat card), `span 4` (memory card in 3-col), or `span 6` (chart card).

---

## 8. Icon System

- **Library**: Lucide Icons (open-source, matches the exact line-weight seen in the recording's nav and card icons — rounded line caps, 2px stroke)
- **Stroke width**: `2px` at all sizes (never switch to filled icons except status dots and the brand brain mark)
- **Sizes**:
  - `16px` — inline with body text, tag icons, dropdown chevrons
  - `18px` — sidebar nav icons, input prefix icons
  - `20px` — card header icons, button icons
  - `24px` — empty-state icons (medium), section header icons ("✨ Quick Capture", "📌 Pinned")
  - `32–40px` — icon badges inside memory-type squircles
  - `64px` — large empty-state icons, AI hero icon
- **Icon badge container** (the colored squircle behind a type icon): size `40px` (card icons) or `88px` (hero/empty states), `border-radius: var(--radius-lg)` or `var(--radius-xl)` at large size, icon centered, icon color always white, background = that type's solid color (never tinted at this size).
- **Color**: icons inherit `--text-secondary` by default (inactive nav, neutral UI icons); become `--accent-600` on active/hover; type icons keep their fixed semantic color always.

---

## 9. Button Variants

| Variant | Background | Text | Border | Usage |
|---|---|---|---|---|
| **Primary** | Gradient `#722CE4 → #5B21B6` | White, 600 weight | none | "+ Capture", "Save Changes", "New Collection" |
| **Secondary** | `--bg-surface-raised` | `--text-primary` | `1px solid --border-default` | "Browse Memories", secondary modal actions |
| **Ghost** | transparent | `--text-secondary` | none | Toolbar icon actions, "Filters" button |
| **Outline (toggle)** | transparent → `--bg-surface-active` when active | `--text-secondary` → `--accent-400` when active | `1px solid --border-default` | "All / Unread" tabs, "Favorites" filter toggle |
| **Destructive** | `#EF4444` solid (or outline red for less severe actions) | White | none | "Delete All", "Delete account" |
| **Icon button** | transparent, `--bg-surface` on hover | `--text-secondary` → `--text-primary` on hover | none, circular `36px` hit-area | Bell, avatar menu, card overflow "..." |

**Sizing**

| Size | Height | Padding (h) | Font |
|---|---|---|---|
| `sm` | 32px | 12px | 13px / 500 |
| `md` (default) | 40px | 16px | 14px / 600 |
| `lg` | 48px | 20px | 15px / 600 |

**States**
- Hover: brightness +8%, shadow `--shadow-glow-accent` fades in over 150ms (primary only)
- Active/pressed: scale `0.98`, 100ms
- Focus-visible: `2px solid --accent-600` outline offset `2px` (always visible for keyboard nav — required, never suppressed)
- Disabled: opacity `0.4`, `cursor: not-allowed`, no hover effects
- Loading: label replaced by a 16px spinner, button stays same width (no layout shift)

---

## 10. Input Styles

**Text input / search input**
- Height: `40px` (44px for the AI Assistant composer)
- Background: `--bg-surface` (`#12132A`)
- Border: `1px solid --border-default`
- Border radius: `--radius-md` (10px); the global ⌘K search and AI composer use `--radius-full` (pill) per the recording
- Padding: `0 14px`, `40px` left padding when a leading icon is present
- Placeholder color: `--text-tertiary`
- Focus state: border becomes `1px solid --accent-600`, plus a `0 0 0 3px rgba(124,58,237,0.2)` focus ring
- Trailing shortcut hint (e.g. "⌘K"): small `--text-tertiary` chip, right-aligned, `--radius-sm`, `bg: rgba(255,255,255,0.05)`

**Select / dropdown trigger** ("All Types", "Newest First")
- Same height/border/radius as text input
- Chevron-down icon, 16px, right-aligned, rotates 180° when open

**Textarea** (capture Note content)
- Same background/border/radius as text input
- Min-height `120px`, resizable vertically only, `14px` padding all sides

**Toggle switch** (Settings page)
- Track: `44px × 24px`, `--radius-full`
- Off: track `--bg-surface-raised` with `1px` border `--border-default`; thumb `--text-tertiary`
- On: track `--accent-600` solid; thumb white
- Thumb: `18px` circle, `2px` inset, transitions `200ms ease`

**Checkbox / radio** (if used in filters)
- `18px` square (checkbox, `--radius-sm`) or circle (radio)
- Checked: `--accent-600` fill, white checkmark icon

---

## 11. Card Styles

All cards share a base recipe and differ only in content/icon:

```
background: var(--bg-surface);          /* #12132A */
border: 1px solid var(--border-subtle); /* #21233F */
border-radius: var(--radius-lg);        /* 14px */
padding: 20px–24px;
transition: border-color 150ms, transform 150ms;
```

**Hover state (all clickable cards)**: border brightens to `--border-default`, background steps up to `--bg-surface-raised`, `transform: translateY(-2px)`, `box-shadow: --shadow-sm`.

### Specific card types

- **Stat Card** (Dashboard/Analytics/Profile): icon badge top-left (40px squircle, type-tinted background e.g. 12% accent tint), big `--text-stat` number, `--text-caption` label beneath. No hover lift (not clickable).
- **Quick Capture Tile**: icon badge centered (48px squircle, solid type color), label centered below, whole tile is a button (hover lift + border brighten).
- **Memory Card**: header row = icon badge (32px, type color) + uppercase type label (`--text-caption`, type-colored) + optional star/pin icon (right-aligned); title (`--text-h3`); 2-line clamped description (`--text-body-sm`, `--text-secondary`); tag chip row; footer row = clock icon + relative timestamp (`--text-caption`, `--text-tertiary`). Fixed min-height so grid rows align even with 1-line vs 2-line descriptions.
- **Collection Card**: icon badge (44px squircle, custom collection color) top-left, optional "..." overflow menu top-right, name (`--text-h3`, colored to match collection accent on hover), description (`--text-body-sm`), memory count (`--text-caption`) bottom, optional trailing arrow that slides right 2px on hover.
- **Category Type Card**: centered icon badge (square, solid type color, `--radius-lg`), large count number (`--text-h2`, bold) below icon, type label (`--text-caption`) at bottom.
- **Tag Chip**: `background: rgba(255,255,255,0.06)`, `--text-body-sm`, `--text-secondary`, `padding: 4px 10px`, `border-radius: --radius-sm`; Popular Tags variant adds a trailing count in `--text-tertiary`.

---

## 12. Sidebar Styling

- Width `260px` expanded / `72px` collapsed; background `--bg-shell` (`#0E1020`); right edge `1px solid --border-subtle` separating it from content.
- **Logo block** (top, 64px tall, aligned with topbar): squircle brain-mark icon (32px, brand gradient fill) + wordmark "MemoryVault" (`--text-h3`, weight 700) + eyebrow "AI SECOND BRAIN" (`--text-eyebrow`, `--text-tertiary`).
- **Global search field** directly beneath logo: pill input, `⌘K` hint chip.
- **Section groups**: "MAIN", "INTELLIGENCE", "ACCOUNT" rendered as `--text-eyebrow` labels with `16px` top margin, `8px` bottom margin, never bordered — whitespace alone separates groups.
- **Nav item** (default): `40px` height, `10px` border-radius, icon (18px, `--text-secondary`) + label (`--text-body`, `--text-secondary`), `12px` gap.
- **Nav item (hover)**: background `--bg-surface` (`#12132A`), text brightens to `--text-primary`.
- **Nav item (active)**: background `--bg-surface-active` (`#1C1740`), text + icon become `--accent-400`, a `3px` wide `--accent-600` rounded bar on the far left edge of the item (the single most important state indicator in the nav).
- **AI Active status card** (sidebar footer, above Collapse): `--bg-surface-raised` background, `--radius-md`, padding `12px`, pulsing `8px` green dot (`--success`, animated glow), bold "AI Active" label, 2-line muted description.
- **Collapse control**: ghost button, full-width, icon flips horizontally when toggled, bottom-pinned with `1px` top border separating it from nav.
- **Collapsed state**: only icons + active bar visible, labels hidden, tooltips appear on hover (glass style, see §6) with `8px` offset.

---

## 13. Navigation / Top Bar Styling

- Height `64px`, background `--bg-shell`, bottom border `1px solid --border-subtle`, sticky on scroll (no shadow when at top; gains `--shadow-xs` once content scrolls beneath it).
- Left: collapse icon-button + current page title (`--text-h1`, but at 18–20px in the bar context — visually a breadcrumb-like single label, not the full display size).
- Right cluster, `12px` gaps: global search trigger (pill, `240px` wide, dimmed `--text-tertiary` placeholder + `⌘K`), primary "+ Capture" button, notification bell (icon button, red `6px` dot badge when unread), user avatar (32px circle, initials, `--accent-600` background, white 600-weight initials text) → opens glass dropdown menu (Profile / Settings / Sign out).
- Tab-style secondary nav (e.g. Notifications "All/Unread", Search type filters): pill-shaped segmented control, container `--bg-surface`, `--radius-full`, active segment `--bg-surface-active` + `--accent-400` text, inactive segments transparent + `--text-secondary`.

---

## 14. Modal Styling

(No modal was captured open in the recording — specified to match the rest of the system.)

- Backdrop: scrim `rgba(5,6,12,0.6)` + `blur(4px)`, fade in `150ms`
- Container: glass recipe from §6, `--radius-xl` (20px), `max-width` varies by purpose (440px confirm dialogs, 560px forms like "New Collection", 720px+ for richer capture forms)
- Anatomy: header (`--text-h2` title + icon-button close top-right) → divider (`1px solid --border-subtle`) → body (`24px` padding, scrollable if tall, `max-height: 80vh`) → footer (right-aligned button row, `12px` gap, divider above)
- Entrance animation: scale `0.96 → 1` + opacity `0 → 1`, `200ms cubic-bezier(0.16, 1, 0.3, 1)`, slight upward translate (`8px → 0`)
- Destructive confirm modals get a `--danger`-tinted icon badge at the top (e.g. trash icon in a red-tinted squircle) instead of the brand icon
- Mobile: modal becomes a bottom sheet, full-width, `--radius-xl` top corners only, drag handle at top

---

## 15. Dropdown Styling

(User menu, "All Types" filter, "Newest First" sort, notification bell popover)

- Trigger: button/input as defined in §9/§10; chevron rotates on open
- Panel: glass recipe (§6), `--radius-md` (10px), `min-width: 200px`, `padding: 6px`, `box-shadow: --shadow-md`
- Anchor + offset: `8px` below trigger, auto-flips above if it would overflow viewport
- Menu item: `36px` height, `8px` border-radius, `8px` horizontal padding, icon (16px) + label, hover → `--bg-surface-raised`; destructive items (e.g. "Delete") use `--danger` text with no background change beyond a subtle red-tinted hover (`rgba(239,68,68,0.1)`)
- Section dividers inside menus: `1px solid --border-subtle`, `4px` vertical margin
- Checkable items (multi-select filters): checkmark icon right-aligned, appears only when selected
- Entrance animation: opacity + `4px` slide from anchor edge, `120ms ease-out`

---

## 16. Empty States

Consistent anatomy across Notifications, Trash, AI Assistant (first load), Calendar ("Select a day"):

1. Icon badge: `80–96px` squircle, `--bg-surface-raised` background, brand or contextual icon at `32–40px`, color matches context (violet for neutral/AI, `--text-tertiary` for plain empty states)
2. Title: `--text-h3`, `--text-primary`, e.g. "Trash is empty", "No notifications"
3. Description: `--text-body-sm`, `--text-secondary`, max-width `320px`, centered, e.g. "Deleted memories will appear here for recovery"
4. Optional primary action button (e.g. "Browse Memories") — only shown when there's a clear next step; purely informational empty states (Notifications) omit it
5. Vertical centering within the available content area, generous `64px+` top/bottom breathing room

---

## 17. Loading States

- **Skeleton screens** (observed during page transitions — e.g. Collections cards rendering as gray blocks before data arrives): same card geometry as the real component, filled with `--bg-surface-raised`, rounded blocks for icon (`square, --radius-md`), title (`60% width, 14px tall`), subtitle (`40% width`), tag pills (`2× 50px`) — all using a shimmer animation: a `1.5s` linear, infinite gradient sweep `rgba(255,255,255,0.04) → rgba(255,255,255,0.09) → rgba(255,255,255,0.04)` moving left-to-right.
- **Spinner**: 16–20px circular stroke spinner, `--accent-600` arc on `--border-subtle` track, `0.8s linear infinite` rotation — used inside buttons and small inline loads.
- **Page-level loading**: skeleton layout (preferred, matches final layout to avoid jank) over a centered spinner; reserve the centered spinner for very first app load only.
- **Inline AI "thinking" state** (AI Assistant): three pulsing dots (`6px` circles, `--accent-400`) inside a chat-bubble-shaped container, staggered `0.2s` bounce animation, replaces the assistant's message bubble until the first token streams in.
- **Streaming text** (AI Assistant responses): characters/words appended progressively; a thin blinking `2px` cursor (`--accent-600`) trails the last character until the stream completes.

---

## 18. Toast Notifications

(Not captured open in the recording — specified to match Settings "Save Changes" and destructive actions.)

- Position: bottom-right, `24px` inset from viewport edges, stacking upward with `8px` gap for multiple toasts
- Container: `--bg-surface-raised`, `1px solid --border-default`, `--radius-md`, `padding: 14px 16px`, `box-shadow: --shadow-md`, `min-width: 320px`, `max-width: 420px`
- Anatomy: status icon (20px, left) → message text (`--text-body-sm`, `--text-primary`, 2-line max) → optional inline action link (`--accent-400`) → close icon-button (16px, `--text-tertiary`)
- Variants (left icon + 3px left accent bar):
  - Success: `--success` check-circle icon, green bar — "Changes saved"
  - Error: `--danger` alert-circle icon, red bar — "Couldn't delete memory"
  - Info: `--accent-600` info icon, violet bar — "Export started — we'll email you a link"
- Entrance: slide up `16px` + fade in, `200ms ease-out`. Exit: fade + slide down, `150ms ease-in`.
- Auto-dismiss after `4s` (success/info); error toasts persist until manually dismissed.

---

## 19. Animation Guidelines

**Timing scale**

| Token | Duration | Easing | Usage |
|---|---|---|---|
| `--motion-instant` | 100ms | `ease-out` | Button press/scale, checkbox toggle |
| `--motion-fast` | 150ms | `ease-out` | Hover states, border/color transitions |
| `--motion-base` | 200ms | `cubic-bezier(0.16, 1, 0.3, 1)` | Dropdowns, modal entrance, tab switches |
| `--motion-slow` | 300ms | `cubic-bezier(0.16, 1, 0.3, 1)` | Page transitions, sidebar collapse/expand |
| `--motion-ambient` | 1.5–3s loops | `ease-in-out`, infinite | Skeleton shimmer, "AI Active" pulse, glow breathing |

**Principles**
1. **Motion explains state change, never decorates.** Every animation should answer "what just happened?" (something appeared, something is loading, something is now active).
2. **Hover = 150ms, everything that appears/disappears = 200–300ms.** Never animate page content on scroll beyond a simple fade-in-on-mount for cards (staggered `30ms` per card, max 6 cards staggered, then instant).
3. **One ambient animation at a time per viewport.** The pulsing "AI Active" dot is the product's heartbeat — don't add competing ambient motion (e.g. no simultaneously breathing background gradients).
4. **Respect `prefers-reduced-motion`**: disable shimmer/pulse/glow loops and replace slide/scale entrances with simple opacity fades.
5. **Numbers count up, don't snap**, when a stat changes (e.g. Total Memories increments after a capture) — `400ms ease-out` count-up tween.
6. **Drag/restore feedback** (Trash restore, future drag-to-collection): item briefly scales to `1.03` and flashes `--success`-tinted border for `300ms` to confirm the action landed.
7. **Page-to-page navigation**: content area cross-fades (`150ms` out, `200ms` in), sidebar/topbar never re-animate (they're persistent chrome, not page content).
