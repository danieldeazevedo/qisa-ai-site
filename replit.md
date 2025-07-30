# Qisa - AI Chat Application

## Overview

Qisa is a modern AI-powered chat application built with a React frontend and Express.js backend. The application integrates with Google's Gemini AI for both text responses and image generation, features Firebase authentication, and uses a PostgreSQL database with Drizzle ORM for data persistence.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

**2024-07-30**: 
- Fixed Firebase authentication with user-provided API keys
- Removed demo mode, now using proper Firebase authentication
- Updated chat system to work with authenticated users
- All core features working: chat, image generation, user authentication

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
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Database**: PostgreSQL (configured for Neon Database)
- **Migrations**: Drizzle Kit for schema management
- **Connection**: Uses `@neondatabase/serverless` for serverless deployment

## Key Components

### Authentication System
- **Provider**: Firebase Authentication with Google OAuth
- **Flow**: Firebase handles authentication, backend syncs user data
- **Storage**: User profiles stored in PostgreSQL with Firebase ID mapping
- **Security**: Firebase Admin SDK for token verification (configured but not fully implemented)

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
- **Development**: In-memory storage for rapid development
- **Production**: PostgreSQL with proper relational schema
- **Schema**: Users, chat sessions, and messages with proper foreign key relationships

## Data Flow

1. **User Authentication**: Firebase → Backend sync → PostgreSQL user record
2. **Chat Initiation**: Get/create current session → Load message history
3. **Message Flow**: User input → Gemini API → Store response → Update UI
4. **Image Requests**: Detected by keywords → Gemini image generation → Store with URL

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
- **Database**: Requires `DATABASE_URL` environment variable
- **AI**: Requires `GEMINI_API_KEY` for Gemini integration
- **Auth**: Firebase configuration via environment variables

### Scalability Considerations
- **Database**: Uses connection pooling via Neon serverless
- **Storage**: In-memory fallback for development, PostgreSQL for production
- **AI Requests**: Direct API calls to Gemini (no rate limiting implemented)
- **Sessions**: Server-side storage (no Redis or session management)

The application follows a monorepo structure with shared TypeScript types and schemas, making it easy to maintain consistency between frontend and backend while supporting rapid development and deployment.