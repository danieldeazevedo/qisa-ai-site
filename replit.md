# Qisa - AI Chat Application

## Overview

Qisa is a modern AI-powered chat application built with a React frontend and Express.js backend. The application integrates with Google's Gemini AI for both text responses and image generation, features Firebase authentication, and uses a PostgreSQL database with Drizzle ORM for data persistence.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

**2025-07-30**: 
- **Implemented Firebase Google Authentication system**
- **Added Redis Upstash integration for database** ✅ RESOLVIDO
- **Created authenticated chat sessions per user**
- **Each authenticated user gets unique secure chat history**
- **Complete Google OAuth login/logout functionality**
- **Firebase user sync with Redis backend storage**
- **Enhanced UI with user profile display and auth controls**
- **Redis Upstash configurado com biblioteca @upstash/redis**
- **Interface mostra foto do usuário quando logado**
- All core features working: authentication, chat, image generation, persistent secure storage

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
- **Sessions**: Each user has chat sessions with persistent message history
- **Messages**: Support both text and image content with metadata
- **Real-time**: Currently polling-based (no WebSocket implementation)
- **Storage**: All chat data persisted in PostgreSQL

### Data Storage
- **Database**: Redis Upstash for cloud-hosted high-performance storage
- **Structure**: Key-value pairs with sets and hashes for relationships
- **Persistence**: All chat history, user profiles, and session data stored in Redis Upstash
- **Performance**: Optimized for real-time chat operations with global CDN
- **Scalability**: Serverless Redis with automatic scaling and high availability

## Data Flow

1. **User Authentication**: Google OAuth → Firebase → Backend sync → Redis user record
2. **Chat Initiation**: Authenticated user → Get/create current session → Load message history from Redis
3. **Message Flow**: User input → Gemini API → Store response in Redis → Update UI
4. **Image Requests**: Detected by keywords → Gemini image generation → Store with URL in Redis

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