# Qisa - AI Chat Application

## Overview

Qisa is a modern AI-powered chat application built with a React frontend and Express.js backend. The application integrates with Google's Gemini AI for both text responses and image generation, features Firebase authentication, and uses a PostgreSQL database with Drizzle ORM for data persistence.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

**2025-07-31**: 
- **Implemented Custom Username/Password Authentication System** ✅ RESOLVIDO
- **Replaced Firebase with custom Redis-based authentication**
- **Created secure password hashing with bcrypt**
- **Fixed Redis Upstash data parsing issues causing login failures**
- **Resolved session management for proper user switching**
- **Fixed chat history isolation per authenticated user**
- **Enhanced cache invalidation when users login/logout**
- **Personalized welcome message: "Bem vindo a qisa [username]"**
- **IMPLEMENTED COMPLETE CHAT HISTORY SYSTEM IN REDIS** ✅ RESOLVIDO
- **Created persistent chat history storage with user-specific sessions**
- **Added username personalization in AI system instructions**
- **Implemented anonymous vs authenticated user handling**
- **Anonymous users: no history saved, temporary session only**
- **Authenticated users: full history saved in Redis with proper isolation**
- **New endpoints: `/api/chat/send`, `/api/chat/history/:sessionId`, `/api/chat/history/:sessionId` (DELETE)**
- **Updated frontend to load history on login and save messages automatically**
- **Added visual indicators for history status in chat interface**
- **FIXED CHAT HISTORY FRONTEND INTEGRATION** ✅ NOVO
- **Corrected authentication headers (x-username) in API requests**
- **Synchronized localStorage keys between auth and query client**
- **Fixed cache invalidation to reload history after login**
- **Complete chat history now loads automatically in frontend**
- **IMPLEMENTED DARK/LIGHT MODE THEME SYSTEM** ✅ NOVO
- **Added smooth theme toggle with CSS transitions**
- **Enhanced UI animations (fade-in, scale-in, bounce-subtle, pulse-gentle)**
- **Light mode set as default theme**
- **Responsive design with adaptive colors for both themes**
- **Created comprehensive Vercel deployment guide** ✅ NOVO
- **Updated vercel.json with correct serverless function configuration**
- **Added troubleshooting guide for common Vercel deployment issues**
- **Removed ping system (anti-hibernation) per user request**
- **IMPLEMENTED MARKDOWN AND MATH SUPPORT IN CHAT** ✅ NOVO
- **Added react-markdown with KaTeX for mathematical expressions**
- **Support for text formatting: bold, italic, lists, code blocks**
- **Mathematical expressions rendered with proper LaTeX syntax**
- **Prose styling with proper theme integration (light/dark)**
- **CREATED COMPREHENSIVE ABOUT PAGE** ✅ NOVO
- **Added detailed About page based on Qisa.md content**
- **Includes QisaSeek AI Labs information and company vision**
- **Added navigation button in header across all pages**
- **Responsive design with animated cards and proper theming**
- **ENHANCED HOME PAGE WITH KEY FEATURES** ✅ NOVO
- **Added mathematics support highlight and key differentials from About**
- **Updated footer to match About page style with heart emoji**
- **Improved layout with 3-column feature grid and 4 main differentials**
- **Maintained consistent design language across all pages**
- **IMPLEMENTED COMPLETE QKOINS VIRTUAL CURRENCY SYSTEM** ✅ NOVO
- **Created comprehensive QKoins schema with user balances and transaction logging**
- **Developed Redis-based QKoins storage with daily reward system (10 QKoins daily)**
- **Built frontend QKoins integration with useQkoins hook and QkoinDisplay component**
- **Added QKoins display in chat interface header and configuration modal**
- **Integrated QKoins verification for image generation (1 QKoin = 1 image)**
- **Enhanced About and Home pages with QKoins system information and features**
- **Created user-friendly QKoins balance display with compact and detailed views**
- **IMPLEMENTED BONUS QKOINS SYSTEM WITH USER PROFILE PAGE** ✅ NOVO
- **Added `/profile` page with complete user account information and QKoins management**
- **Created bonus claim system (+5 QKoins) with 4-hour cooldown limit via `/api/qkoins/claim-bonus`**
- **Fixed timestamp-based daily reward system (24h real-time validation using Redis)**
- **Added profile navigation button in chat interface for authenticated users**
- **Enhanced QKoins transaction history display with recent activity tracking**
- **Implemented proper fallback storage handling for offline Redis scenarios**
- **BONUS QKOINS COOLDOWN UPDATED TO 4 HOURS** ✅ ATUALIZADO

**2025-08-01**: 
- **IMPLEMENTED MULTIPLE CHAT SESSIONS SYSTEM LIKE CHATGPT** ✅ NOVO
- **Created comprehensive multiple chat sessions management with persistent history per session**
- **Added ChatSidebar component with session creation, renaming, deletion, and switching**
- **Enhanced storage interface with getUserSessions, updateChatSession, setCurrentSession methods**
- **Built useSessions hook for managing multiple chat sessions with React Query integration**
- **Updated useChat hook to work with dynamic session IDs from current session**
- **Added new API endpoints: GET/POST/PATCH/DELETE `/api/chat/sessions` for session management**
- **Implemented session activation system with proper history isolation**
- **Updated chat interface with sidebar toggle and current session title display**
- **Anonymous users remain single-session, authenticated users get multiple sessions**
- **Each session maintains independent chat history and can be renamed/deleted**
- **Sidebar shows session list with timestamps, creation dates, and management options**
- **Changed bonus system from 1-hour to 4-hour cooldown for better balance**
- **Updated frontend messages and info to reflect 4-hour limitation**
- **Backend validation ensures users must wait 4 hours between bonus claims**
- **COMPREHENSIVE ADMIN PANEL SYSTEM IMPLEMENTED** ✅ NOVO
- **Created full administrative control panel restricted to user "daniel08"**
- **Admin features: user management, chat history control, system logs, ban/unban users, delete users**
- **Added admin button in chat interface for quick access (only visible to daniel08)**
- **Fixed React hooks error by reorganizing component structure**
- **Implemented secure admin-only endpoints with username verification**
- **Added system status monitoring and control capabilities**
- **ENHANCED TYPEWRITER ANIMATION WITH CURSOR** ✅ NOVO
- **Added blinking cursor to typewriter effect on homepage**
- **Cursor automatically adapts to light/dark theme colors**
- **Removed cursor from "Bem-vindo à" text, kept only on "Qisa" for focus**
- **SEO AND SOCIAL MEDIA OPTIMIZATION** ✅ NOVO
- **Added comprehensive Open Graph meta tags for better link previews**
- **Generated custom Qisa logo for social media previews**
- **Added favicon and Apple touch icon support**
- **Optimized for Facebook, WhatsApp, Twitter sharing**
- **Added SEO meta tags with Portuguese keywords**
- **FIXED CRITICAL SESSION DELETION AND RENAMING BUGS** ✅ RESOLVIDO
- **Implemented direct Redis operations for reliable session deletion bypassing storage layer issues**
- **Added automatic session cleanup on server startup keeping only 3 most recent sessions per user**
- **Fixed session renaming with robust error handling and corrupted data recovery**
- **Added comprehensive logging and verification system for Redis operations**
- **Session deletion now works completely removing conversations from interface**
- **Session renaming handles JSON parsing errors and recreates minimal session data when needed**

**2025-08-03**:
- **ENHANCED ADMIN PANEL WITH MAINTENANCE MODE & CHAT MONITORING** ✅ NOVO
- **Added comprehensive maintenance mode system with custom messages and user blocking**
- **Only "daniel08" can access system during maintenance mode**
- **Created maintenance page for blocked users with personalized messaging**
- **Added real-time chat monitoring allowing admin to view all user conversations**
- **Enhanced admin panel to 6 tabs: Users, System, Maintenance, Chat Viewer, Logs, Database**
- **IMPROVED CHAT USER EXPERIENCE WITH VISUAL ENHANCEMENTS** ✅ NOVO
- **Enhanced chat sidebar with gradient highlighting for active chat session**
- **Added border-left accent and ring effect for currently selected conversation**
- **Implemented informative popups for image and attachment buttons**
- **Auto-showing popups: "teste e crie suas imagens" for image button (4 seconds)**
- **Auto-showing popups: "a qisa tbm lê seus pdf's e imagens" for attachment button (4 seconds)**
- **Popups appear automatically 1-1.5 seconds after chat opens to guide new users**
- All core features working: custom auth, persistent chat history, image generation, personalized AI responses, theme system, markdown/math support, about page, enhanced home with typewriter cursor, QKoins virtual currency system, comprehensive admin panel with maintenance mode, enhanced UX with visual chat highlights and helpful popups, SEO optimization, robust session management, Vercel deployment ready

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **UI Library**: Shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming
- **State Management**: TanStack Query (React Query) for server state
- **Routing**: Wouter for lightweight client-side routing
- **Build Tool**: Vite with React plugin

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Runtime**: Node.js with ES modules
- **API Style**: RESTful endpoints under `/api` prefix
- **Middleware**: JSON parsing and request logging with timing

### Database Layer
- **Database**: Redis for high-performance data storage
- **Client**: Node Redis client with connection pooling
- **Structure**: Optimized key-value storage for chat data
- **Connection**: Direct Redis connection with automatic reconnection

## Key Components

### Authentication System
- **Provider**: Firebase Authentication with Google OAuth
- **Flow**: Firebase handles authentication, backend syncs user data to Redis
- **Storage**: User profiles stored in Redis Upstash with Firebase ID mapping
- **Security**: Firebase tokens handled client-side, user sync with backend
- **Features**: Complete login/logout flow with user profile display

### AI Integration
- **Provider**: Google Gemini AI via `@google/genai` package
- **Capabilities**: 
  - Text conversation with context awareness
  - Image generation on request
  - Portuguese Brazilian language responses
- **System Prompt**: Configured as "Qisa" assistant with specific personality traits

### Chat System
- **Sessions**: Each authenticated user has persistent chat sessions saved in Redis
- **Messages**: Support both text and image content with metadata
- **Real-time**: Currently polling-based (no WebSocket implementation)
- **Storage**: 
  - **Authenticated users**: Messages stored in Redis with user-specific keys
  - **Anonymous users**: Messages stored in browser memory only (no persistence)
- **History**: Full conversation history loaded automatically on login
- **Personalization**: AI includes username in system instructions for natural conversation

### Data Storage
- **Database**: Redis Upstash for cloud-hosted high-performance storage
- **Structure**: Key-value pairs with lists and hashes for relationships
- **Persistence**: User profiles, authentication data, and chat history stored in Redis
- **Chat Storage**: 
  - **Authenticated users**: Messages stored in Redis with keys `user:{userId}:session:{sessionId}:history`
  - **Anonymous users**: Messages expire after 1 hour or are not saved
- **History Organization**: Messages stored in chronological order using Redis lists
- **Performance**: Optimized for real-time operations with global CDN
- **Scalability**: Serverless Redis with automatic scaling and high availability

## Data Flow

1. **User Authentication**: Username/Password → Redis user verification → Session establishment
2. **Chat Initiation**: 
   - **Authenticated users**: Load existing chat history from Redis
   - **Anonymous users**: Start fresh session in browser memory
3. **Message Flow**: 
   - **Authenticated users**: User input → Save to Redis → Gemini API (with username context) → Save response to Redis → Display
   - **Anonymous users**: User input → Gemini API → Display response (no storage)
4. **Image Requests**: Detected by keywords → Gemini image generation → Save/Display based on user type
5. **Session Isolation**: Each authenticated user has persistent history, anonymous users get temporary sessions
6. **History Management**: Authenticated users can clear history (deletes from Redis), anonymous users clear local memory

## External Dependencies

### Core Services
- **Firebase**: Authentication and user management
- **Google Gemini**: AI text and image generation
- **Neon Database**: PostgreSQL hosting (serverless)

### Development Tools
- **Vite**: Build tool with HMR and development server
- **TypeScript**: Type safety across frontend and backend
- **Tailwind CSS**: Utility-first styling
- **Drizzle Kit**: Database schema management

### UI Components
- **Radix UI**: Accessible component primitives
- **Shadcn/ui**: Pre-built component library
- **Lucide React**: Icon library

## Deployment Strategy

### Build Process
- **Frontend**: Vite builds to `dist/public` directory
- **Backend**: ESBuild bundles server code to `dist/index.js`
- **Assets**: Static files served from build output

### Environment Configuration
- **Development**: Uses Vite dev server with API proxy
- **Production**: Express serves both API and static files
- **Database**: Requires `REDIS_URL` environment variable for Upstash connection
- **AI**: Requires `GEMINI_API_KEY` for Gemini integration
- **Auth**: Firebase configuration via `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_APP_ID`

### Scalability Considerations
- **Database**: Uses connection pooling via Neon serverless
- **Storage**: In-memory fallback for development, PostgreSQL for production
- **AI Requests**: Direct API calls to Gemini (no rate limiting implemented)
- **Sessions**: Server-side storage (no Redis or session management)

The application follows a monorepo structure with shared TypeScript types and schemas, making it easy to maintain consistency between frontend and backend while supporting rapid development and deployment.