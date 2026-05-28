# Chaesa Live - Micro-Learning Platform

## Overview
A Next.js (Pages Router) application for converting meetings into micro-learning courses, now integrated with competency-based learning (SKKNI/BNSP standard) and BimtekKita (bimtek.replit.app — construction training platform for Indonesia). Built with React 18, TypeScript, Tailwind CSS, and Supabase. Features creator tools, HRD tools, AI-powered Competency E-Course Builder, a digital Competency Passport, full cross-platform integration with BimtekKita's 157 BIMTEK modules, 334 SKK positions, PKB points tracking, 8 AI construction experts, and an AI Tools Hub with 55+ specialized no-prompt tools.

### `/platform` — Comprehensive Platform Overview page
- Hero + stats row (3 platforms, 157+ BIMTEK modules, 334 SKK, 6 segments)
- Interactive 6-segment picker with per-segment feature grid (6 features each)
- All-features accordion table with segment tags (Chaesa / Competency / BimtekKita)
- Platform comparison table vs competitors
- 5-step end-to-end learning journey timeline
- **6-Step SKKNI Course Structure** (Orientasi → Konteks → Micro-Learning → Praktik → Asesmen → Refleksi) — each with bullets
- **SKKNI L1–L4 level framework** (Asisten Ahli → Teknisi Madya → Ahli Muda → Ahli Utama)
- **8 AI Expert Konstruksi profiles** with 3 sample prompts each
- **FAQ section** with 7 Q&A items covering all segments
- 3-app showcase cards + 12-item Quick Access grid
- Gradient CTA banner
- Nav: "🚀 Platform" link added to both desktop nav and mobile Sheet menu

### `/ai-agents` — Chaesa Multi-Agent AI System (OpenClaw-style)
- Full-screen chat UI with split-pane layout: agent roster sidebar (left) + chat (right)
- **8 AI Expert agents**: Struktur Beton, K3 Keselamatan, MEP Spesialis, Geoteknik, Kontrak/Hukum, Manajer Proyek, RAB/QS, BIM & Teknologi
- **Auto-Route mode**: Orchestrator (gpt-4o-mini) analyzes query and auto-routes to best agent
- **Manual mode**: User directly selects any of the 8 agents
- Agent response includes: routing confidence %, routing reason, 3 AI-generated follow-up suggestions
- Message copy-to-clipboard, new session clear, animated loading indicator
- 3 sample prompts per agent in sidebar
- Nav: "🤖 AI Experts" (amber) added to desktop + mobile nav
- **API**: `src/pages/api/ai/multi-agent.ts` — two-step: orchestrator → specialist
- **Shared data**: `src/lib/agents-data.ts` — AGENTS const + AgentId type (safe for client import)
- **Citation Intelligence System**: `src/lib/standards-data.ts` — 30+ SNI/PP/ISO/FIDIC standards; `CitationPanel` auto-extracts standard codes from agent responses and displays color-coded chips (Wajib/Disarankan/Referensi)
- **Agent Memory**: `src/lib/agent-memory.ts` — auto-extracts project facts from chat via regex; stores in `chaesa_agent_memory_v2` localStorage key; injected into all API calls as `memoryContext`
- **Blackboard Collab Mode**: `src/pages/api/ai/multi-agent-collab.ts` — 2 agents answer in parallel via `Promise.all`, then synthesis step
- **API**: all agents instructed to cite exact standard codes (SNI 2847:2019 etc.) for citation parser to detect

### `/tools` — AI Tools Hub (GipsyAI-inspired)
- **27+ pre-built AI apps** for construction — no prompting needed, just fill form fields
- **8 categories**: Manajemen Proyek, K3, Dokumen & Surat, Estimasi & RAB, Teknis & Sipil, Kontrak & Legal, MEP, BIM & Digital
- **Tool card grid** with POPULER/BARU/PRO badges and estimated generation time
- **Split-pane UX**: left sidebar category filter + right form panel with live output
- **Form → Output**: structured fields → `buildPrompt()` → API → Markdown output with copy/download
- **Tools include**: WBS Generator, JSA Generator, HIRARC, APD List, Surat Teguran, Perpanjangan Waktu, Notulen Rapat, RAB Kasar, AHS (Analisa Harga Satuan), Cash Flow, Volume Beton, QC Checklist, Interpretasi SPT, Klaim Keterlambatan, Estimasi Daya Listrik, Spesifikasi AC, BEP Generator, LOD Matrix, Clash Detection Checklist, dll
- **API**: `src/pages/api/ai/run-tool.ts` — takes `toolId` + `formData`, calls `tool.buildPrompt(formData)`, sends to OpenAI gpt-4o-mini (2000 tokens)
- **Data**: `src/lib/tools-data.ts` — `AiTool` interface with fields array + `buildPrompt` function
- Nav: "🔧 AI Tools" (emerald) added to homepage desktop+mobile nav and AI Experts page

### `/hub` — ChaesaHub Skill Marketplace
- ClawHub-style skill library with 35+ skills
- **Hero** with stats ticker (35+ skills, 178K+ activations, 4.8 avg rating, 8 new)
- **Editor's Spotlight** — 3 featured gradient cards (Editor's Pick)
- **"Baru Minggu Ini"** — horizontal scroll strip of 8 new skills
- **Sidebar**: 12 categories with count badges + Level filter (Semua/Pemula/Menengah/Lanjutan)
- **Sort**: Terpopuler/Terbaru/Top Rating/Unggulan; Grid/List view toggle
- **Skill cards**: icon, level badge, activity progress bar, weeklyActive count, last updated, duration
- **Skill Bundles** — 4 curated packs (Starter Pack, Creator Pro, Corporate Compliance, Mahasiswa→Professional)

## Architecture
- **Framework**: Next.js 15.5.9 (Pages Router, `src/pages/`)
- **Styling**: Tailwind CSS + Radix UI components + Framer Motion
- **Backend**: Supabase (auth + database), API routes in `src/pages/api/`
- **Payments**: Mayar.id (replaced Midtrans)
- **AI**: OpenAI gpt-4o-mini via Replit AI Integrations for chatbot, captions, and content generation

## Project Structure
```
src/
  pages/          - Next.js pages and API routes
    api/mayar/    - Mayar.id payment API (create-payment, webhook)
    api/ai/       - AI APIs (generate-caption, optimize-social, generate-module, etc.)
    api/chat/     - Chatbot API (ask.ts)
  components/     - React UI components
  contexts/       - React context providers
  hooks/          - Custom React hooks
  integrations/   - Supabase client setup
  lib/            - Utility functions
  services/       - Service layer
  styles/         - Global styles
public/           - Static assets
supabase/         - Supabase configuration
```

## Configuration
- **Port**: 5000 (bound to 0.0.0.0 for Replit)
- **Dev command**: `npm run dev` (next dev -p 5000 -H 0.0.0.0)
- **Build/Start**: `npm run build` / `npm run start`

## Required Environment Variables
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous/public key
- `OPENAI_API_KEY` - For AI features (meeting analysis, transcription)
- `MAYAR_API_KEY` - Mayar.id API key for payment processing
- `MAYAR_IS_PRODUCTION` - Set to "true" for production Mayar environment
- `NEXT_PUBLIC_BASE_URL` - Base URL for payment callbacks

## Theme
- Dark/Light mode via `next-themes` with Tailwind CSS class-based dark mode
- ThemeProvider configured with `attribute="class"` and `defaultTheme="dark"` in `_app.tsx`
- Toggle component: `src/components/ThemeSwitch.tsx` (in navbar on index page)
- Options: Terang (Light), Gelap (Dark), Sistem (System)

## Chatbot (Agentic AI)
- ChatWidget component (`src/components/ChatWidget.tsx`) rendered globally via `_app.tsx`
- Draggable floating button — user can move it anywhere on screen (drag & drop)
- On mobile: opens full-screen; on desktop: opens as floating panel near button position
- API endpoint: `src/pages/api/chat/ask.ts` with AI (Replit AI Integrations / OpenAI)
- Uses `gpt-4o-mini` model via `AI_INTEGRATIONS_OPENAI_BASE_URL` and `AI_INTEGRATIONS_OPENAI_API_KEY`
- Falls back to keyword-based knowledge base if AI unavailable
- Sends conversation history for multi-turn context
- Renders bot messages as rich markdown (tables, headings, code blocks, lists)
- **Agentic Behavior**: Atentif, Proaktif, Konsultatif persona
  - Page-aware greetings: detects current page and shows relevant welcome message
  - Contextual quick reply suggestions per page
  - Feature link cards: clickable navigation buttons in chat responses
  - Role-based consultation: detects if user is Learner, Creator, or HRD
  - Internal links rendered as Next.js Links for SPA navigation
  - API returns `feature_links` array for clickable feature navigation cards
  - Full knowledge base covers ALL features: Storybook, Sertifikasi, Skills Matrix, Learning Path, Broadcast, Creator Dashboard, Content Calendar, AI Studio, etc.

## Creator Tools
### Creator Dashboard (`/creator-dashboard`)
- Page: `src/pages/creator-dashboard.tsx`
- Shows analytics: total views, subscribers, engagement rate, revenue
- Time range selector (7/30/90 days)
- Quick actions: Start Live, Create Content, Broadcast
- Recent content performance with views/engagement/revenue
- Top channel breakdown (YouTube, Instagram, TikTok, LinkedIn)

### Broadcast Hub (`/broadcast`)
- Page: `src/pages/broadcast.tsx`
- Multi-channel broadcast composer:
  - WhatsApp Blast: compose + send via wa.me links
  - Email Campaign: compose with subject/body, generates mailto links
  - Social Media: share to Twitter, Facebook, LinkedIn, copy captions for Instagram/TikTok/YouTube
- Template library (promo, event, content, reminder)
- Audience list management (add contacts, CSV import)
- Schedule broadcast (date/time picker)
- localStorage persistence for contacts

### Content Calendar (`/content-calendar`)
- Page: `src/pages/content-calendar.tsx`
- Monthly/weekly calendar view
- Color-coded entries: Live (green), Broadcast (blue), Content (purple)
- Integrates with existing schedule data from localStorage
- Add/edit/delete content plans
- localStorage persistence

### AI Caption Generator
- API: `src/pages/api/ai/generate-caption.ts`
- Generates platform-specific captions (Instagram, TikTok, YouTube, LinkedIn, Twitter)
- Tone options: fun, professional, viral
- Returns: caption, hashtags, emoji suggestions, best posting time
- Uses gpt-4o-mini with fallback to templates

## Live Schedule
- Page: `src/pages/schedule.tsx` — Create, edit, delete live sessions
- Data stored in localStorage (client-side)
- Features: Share via WhatsApp, Email, copy link/invite text
- Auto-generates meeting codes (format: XXXX-XXXX-XXXX)
- Status tracking: upcoming, live, ended

## Meeting Room
- Page: `src/pages/meeting/[id].tsx` — Live meeting room with video/audio
- In-meeting invite panel (Zoom-like): share link, copy meeting code, WhatsApp, email, copy invite text
- WebRTC-based video/audio, recording, reactions, polls, whiteboard, breakout rooms

## PWA (Progressive Web App)
- Manifest: `public/manifest.json` — app name, icons, shortcuts, theme color (#7C3AED purple)
- Service Worker: `public/sw.js` — network-first caching with offline fallback
- Offline page: `public/offline.html` — Indonesian offline message with retry button
- Icons: `public/icons/icon-{72,96,128,144,152,192,384,512}x*.png` — purple-to-pink gradient with video frame + play button + live dot
- Viewport meta in `_app.tsx` with `viewport-fit=cover` for safe-area support
- Service worker registered in `_app.tsx` on mount
- App installable on Android (Chrome) and iOS (Safari Add to Home Screen)

## Branding & Logo
- Custom SVG logo component: `src/components/ChaesaLogo.tsx`
- `ChaesaLogo` — full-color app icon (purple-pink gradient bg, white video frame + play button + text lines + green live dot)
- `ChaesaLogoMark` — monochrome version using currentColor (for inline text contexts)
- Used in: Landing page navbar (size 40), PageHeader (size 28), Footer (size 32), mobile drawer (size 36)
- Text "Chaesa Live" rendered with `bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent`

## HRD & Training Tools

### Competency E-Course Builder (`/competency-builder`)
- Page: `src/pages/competency-builder.tsx`
- Integration with https://competency-builder-1-kucing44441.replit.app framework
- 6-step structured e-course wizard: Orientasi, Konteks, Microlearning, Praktik, Asesmen, Refleksi
- 4-level competency progression: L1 (Awareness) → L2 (Application) → L3 (Mastery) → L4 (Strategic)
- SKKNI sector mapping with unit competency codes
- AI content generation for indicators, case studies, microlearning topics, tasks, and reflection prompts
- 6 assessment method selection: APL, Observasi, Wawancara, Tes Tertulis, Portfolio, Simulasi
- Course library with localStorage persistence and progress tracking
- Cross-links to AI Studio, Skills Matrix, and Exam Center

### Competency Passport (`/competency-passport`)
- Page: `src/pages/competency-passport.tsx`
- Digital portfolio of all verified competencies with SKKNI unit codes
- Unique passport ID with QR verification URL
- Level distribution dashboard (L1-L4) with progress bars
- Filter by sector and level
- Manual add competency with: title, SKKNI unit, sector, level, assessment method, score, date, status
- Sample data pre-loaded for new users
- LSP/BNSP feature section: APL, Assessor Management, SKKNI Mapping, 6 Assessment Methods
- Download PDF and Share functionality
- Cross-links to Competency Builder, Exam Center, Skills Matrix

### Certification & Exam Center (`/sertifikasi`)
- Page: `src/pages/sertifikasi.tsx`
- Exam builder: create exams with MCQ, True/False, Essay, Practical Assessment
- Exam catalog with 8 categories (IT, Marketing, Leadership, etc.)
- Take exam: timer countdown, question navigation, auto-submit, instant scoring
- Results history with per-question review
- 3 sample exams pre-loaded (Digital Marketing, Leadership, K3/Safety)
- localStorage persistence

### Digital Certificate Generator (`/sertifikat`)
- Page: `src/pages/sertifikat.tsx`
- Generate professional certificates with unique ID (CL-XXXX-XXXX-XXXX-XXXX)
- QR code verification, print/download support
- Verification tab: verify certificate authenticity by ID
- My Certificates: list all earned certificates
- localStorage persistence

### Skills Matrix & Gap Analysis (`/skills-matrix`)
- Page: `src/pages/skills-matrix.tsx`
- 6 pre-built competency frameworks (Digital Marketing, Software Dev, PM, Leadership, Customer Service, Data Analytics)
- Team member management with 1-5 star skill ratings
- SVG radar/spider chart visualization
- Gap analysis: current vs required skill levels
- AI-powered training recommendations based on gaps
- Individual skill passport per team member
- Export as text file
- localStorage persistence

### Learning Path Builder (`/learning-path`)
- Page: `src/pages/learning-path.tsx`
- Create structured learning paths with stages/milestones
- 6 pre-built templates (Digital Marketing Specialist, Full-Stack Developer, PM, Content Creator Pro, HR Professional, Data Analyst)
- Each stage: modules, exams, assignments, min score to advance, XP, badges
- Visual timeline/roadmap with stage progression
- Gamification: XP tracking, badge unlocking, completion celebrations
- localStorage persistence

### AI Competency Assessment API
- API: `src/pages/api/ai/generate-exam.ts`
- Auto-generate competency exam questions using gpt-4o-mini
- Input: topic, difficulty, questionCount, questionTypes
- Output: questions with options, answers, explanations, competency tags, passing score, estimated time
- Fallback to template-based questions if AI unavailable

## Storybook Visual Learning (`/storybook`)
- Page: `src/pages/storybook.tsx`
- AI-powered visual storytelling for learning: transforms topics into illustrated stories
- API: `src/pages/api/ai/generate-story.ts` — generates story with characters, scenes, quiz, learning points
- Interactive scene-by-scene viewer with AI-generated illustrations
- 3 sample stories with 15 AI-generated illustrations in `public/storybook/`:
  - "Pak Budi Membangun Rumah Impian" (Construction → Project Management)
  - "Startup Digital Rina" (Technology → Entrepreneurship)
  - "Dokter Muda di Desa Terpencil" (Health → Leadership & Empathy)
- Story creator: pick topic, industry, audience, scene count → AI generates full story
- Quiz at end of each story, learning points summary
- Industries: Construction, Business, Technology, Health, Education, Marketing
- localStorage persistence

## Auth Hook
- Shared hook: `src/hooks/useAuth.ts`
- Returns: `{ user, isLoggedIn, isLoading, userName, userId, isGuest }`
- Uses Supabase auth + localStorage guest user fallback
- `getUserStorageKey(userId, key)` — generates user-scoped localStorage keys
- All feature pages use this hook to show user info and persist data per-user

## User Progress Dashboard (`/dashboard`)
- Page: `src/pages/dashboard.tsx`
- Aggregated view of user's activity across ALL features
- Stats: Total XP (ring chart), Certificates, Exams Passed, Stories Created, Learning Paths, Skills Rated, Achievements
- 12 achievements with unlock conditions (Bookworm, Storyteller, Exam Ace, Certified, Pathfinder, etc.)
- Achievement filter by category (Semua, Belajar, Ujian, Milestone)
- Recent activity timeline with links to relevant pages
- Quick action cards: Storybook, Learning Path, Ujian, Skills Matrix
- Auth-aware with useAuth hook
- XP system: certs=100 XP, exam pass=50 XP, exam complete=20 XP, story=30 XP, skills framework=25 XP

## Profile Page (`/profile`)
- Page: `src/pages/profile.tsx`
- Auth-required: redirects to /auth if not logged in
- User info: avatar placeholder (initial letter), display name, email
- Editable display name via authService.updateProfile
- Subscription status card (Free/Pro/Business/Yearly)
- Account actions: Change Password (Supabase reset email), Logout
- Quick links to Dashboard, Pricing, AI Studio, Creator Dashboard

## Auth Page Enhancements
- Google OAuth: "Masuk dengan Google" button using authService.signInWithGoogle()
- Visual divider between social and email auth
- "Lupa Password?" link under password field (login mode only)
- Sends reset email via `supabase.auth.resetPasswordForEmail()`
- Auth callback page: `src/pages/auth/callback.tsx` handles OAuth redirect
- Located at `src/pages/auth.tsx`

## Micro-Learning Tabs
- **Marketplace**: Course browsing grid with category filters, search, price badges, "Mulai Belajar" CTA
- **Analytics**: Summary stats (courses, modules, learners, duration), course performance table with progress bars, 7-day activity streak grid

## Creator Dashboard
- Dynamic stats from localStorage + Supabase: Total Konten, Total Modul, Sertifikat Dibuat, Skills Framework
- Recent content merged from courses + storybooks, sorted by date
- Empty state with CTA when no content exists

## 404 Page
- Themed with Chaesa Live dark/purple gradient
- Animated 404 badge with gradient text
- 6 quick-link cards to popular pages
- CTA buttons: Kembali ke Beranda, Buka Dashboard
- Dark/light mode with theme toggle

## Page Transition Loading Bar
- Green gradient progress bar at top of page
- Animates during route transitions (routeChangeStart/Complete/Error)
- Implemented in `src/pages/_app.tsx` as `RouteLoadingBar` component
- z-index 9999 to appear above all content

## OnboardingWizard
- Component: `src/components/OnboardingWizard.tsx`
- Renders globally via `_app.tsx`
- Automatically shows for first-time authenticated users
- Checks `user_profiles.onboarding_completed` in Supabase
- 2-step wizard: select role (Creator/Seller/Streamer/Corporate) → enter display name
- Saves role and display name to `user_profiles` table

## Footer Component
- Component: `src/components/Footer.tsx`
- 4 columns: Produk, Fitur, Bantuan, Legal
- Logo, tagline, social media icons
- Dark/light mode, responsive

## FAQ Section
- Added to landing page (`src/pages/index.tsx`) before footer
- 10 accordion questions covering pricing, AI, security, compatibility, refund, mobile, certification
- Uses shadcn Accordion component

## Shared PageHeader Component
- Component: `src/components/PageHeader.tsx`
- Reusable sticky nav bar used by ALL feature pages
- Props: `title`, `icon?`, `showAuth?`, `backHref?`, `backLabel?`, `rightContent?`
- Includes: Chaesa Live logo, page title, auth status (login/profile link), search trigger (⌘K), NotificationCenter (bell), ThemeSwitch, back arrow
- All 14+ feature pages now use this component for consistent navigation

## Command Palette (Ctrl+K)
- Component: `src/components/CommandPalette.tsx`
- Global keyboard shortcut: Ctrl+K or Cmd+K
- Searchable command dialog with 5 groups: Navigasi, Belajar, Creator Tools, HRD & Training, Akun
- Uses existing cmdk-based `src/components/ui/command.tsx`
- Renders globally from `_app.tsx`

## Notification Center
- Component: `src/components/NotificationCenter.tsx`
- Bell icon with unread count badge (red dot)
- Popover dropdown showing auto-generated notifications from user activity
- Sources: certificates, exam results, storybooks, learning paths, skills matrix
- Mark individual or all as read (stored in localStorage)
- Relative timestamps ("5 menit lalu", "2 hari lalu")
- Integrated into PageHeader

## Navigation
- Homepage navbar (segment-based):
  - Harga, Jadwal Live
  - "Belajar" dropdown: Micro-Learning, Learning Path, Ujian & Sertifikasi, Sertifikat Saya, Storybook Visual, Dashboard Progress
  - "HRD & Training" dropdown: Skills Matrix & Gap Analysis, Exam Center, Training Path, Digital Certificate
  - "Creator Tools" dropdown: AI Studio, Dashboard Kreator, Broadcast & Marketing, Kalender Konten
- **Mobile hamburger menu**: Sheet drawer (left slide) with accordion sections for all nav groups, auth buttons, closes on navigation
- **Feature pages**: All use shared PageHeader with consistent back navigation, search, notifications

## Notes
- Supabase client handles missing env vars gracefully (warns instead of crashing)
- Payment gateway: Mayar.id (sandbox: api.mayar.club, production: api.mayar.id)
- Global `overflow-x: hidden` on html/body to prevent horizontal scroll on mobile
- Migrated from Vercel; `vercel.json` kept for reference but not used on Replit
