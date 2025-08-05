# Qisa - AI Chat Application

## Overview

Qisa is a modern AI-powered chat application that integrates with Google's Gemini AI for text responses and image generation. It features a custom authentication system, persistent chat history, virtual currency (QKoins), and an administrative panel. The project aims to provide a personalized and feature-rich AI chat experience with a focus on user interaction and engagement.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Framework**: React 18 with TypeScript
- **UI Library**: Shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming, supporting dark/light modes.
- **State Management**: TanStack Query (React Query)
- **Routing**: Wouter
- **Build Tool**: Vite
- **UI/UX Decisions**: Smooth theme toggles, enhanced UI animations (fade-in, scale-in, bounce-subtle, pulse-gentle), responsive design, typewriter animation with blinking cursor, visual chat highlights with accent and ring effects for active sessions, informative popups for guiding new users (e.g., image/attachment buttons). Prose styling for markdown and math. Advanced dynamic background animations applied to all pages except /chat with intense moving gradients (gradient-aurora, gradient-spiral, gradient-kaleidoscope, gradient-nebula, gradient-plasma animations) creating immersive visual experience. Reusable AnimatedBackground component with configurable opacity levels. PWA install buttons and user guidance for app installation.

### Backend
- **Framework**: Express.js with TypeScript
- **Runtime**: Node.js
- **API Style**: RESTful endpoints
- **Authentication**: Custom username/password system with secure password hashing (bcrypt) and Redis-based session management.
- **Admin Panel**: Comprehensive administrative control panel (restricted to specific user) for user management, chat monitoring, system logs, and maintenance mode.

### Data Storage
- **Database**: Redis (Upstash) for high-performance data storage, including user profiles, authentication data, chat history, QKoins balances, and transaction logs.
- **Chat Storage**: Persistent chat sessions per authenticated user with history stored in Redis. Anonymous users have temporary, non-persistent sessions.
- **QKoins System**: Redis-based virtual currency with daily rewards, bonus claims, and transaction history.

### Core Features
- **AI Integration**: Google Gemini for text conversation (context-aware, Portuguese Brazilian language) and image generation. AI responses are personalized with the user's username.
- **Chat System**: Multiple chat sessions similar to ChatGPT, with persistent history per session, session creation, renaming, deletion, and switching. Support for markdown and mathematical expressions (KaTeX).
- **Voice Features**: Speech recognition for voice input (Portuguese Brazilian) and text-to-speech for AI responses with browser Web Speech API integration.
- **Authentication**: Custom username/password authentication.
- **Virtual Currency (QKoins)**: System for earning and spending QKoins, integrated with image generation.
- **Theme System**: Dark/light mode toggle with adaptive colors.
- **Information Pages**: Comprehensive About page and enhanced Home page.
- **SEO**: Open Graph meta tags, custom logo for social media previews, favicon, and SEO meta tags.
- **PWA (Progressive Web App)**: Full PWA implementation with manual service worker, manifest.json, and installation capabilities. Features robust install button that works both with native browser prompts and fallback manual instructions for different browsers. Install button appears automatically on production deployments even when beforeinstallprompt event doesn't fire.

## External Dependencies

- **Google Gemini**: AI text and image generation via `@google/genai` package.
- **Redis (Upstash)**: Cloud-hosted Redis for data persistence.
- **React**: Frontend framework.
- **Express.js**: Backend framework.
- **Shadcn/ui**: UI component library.
- **Tailwind CSS**: Styling.
- **TanStack Query**: Server state management.
- **Wouter**: Client-side routing.
- **Vite**: Build tool.
- **bcrypt**: Password hashing.
- **react-markdown**: Markdown rendering.
- **rehype-katex**: KaTeX for mathematical expressions.
- **Lucide React**: Icon library.