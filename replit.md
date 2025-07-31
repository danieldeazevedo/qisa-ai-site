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
- All core features working: custom auth, persistent chat history, image generation, personalized AI responses, theme system, Vercel deployment ready

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