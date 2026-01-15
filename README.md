# NawaNapam

**A Premium, Culturally Rich, Real-Time Video Chat Platform for Meaningful Connections**

---

## Overview

**NawaNapam** — _“New Connection”_ in Assamese — is a modern, luxury video chat platform for meaningful, respectful, and spontaneous connections. Built for India and the world, it combines a beautiful UI, cultural warmth, and robust real-time backend.

---

## Features

- ✨ Real-time 1-on-1 video and text chat (WebRTC, Socket.IO)
- 🎯 Interest-based matching (gender, tags, preferences)
- 🔒 Secure, encrypted, and private
- 📱 Fully responsive (mobile, tablet, desktop)
- 🎨 Elegant, glassmorphic UI with golden gradients
- 🎛️ Mute/camera controls, "Next" and "End Chat" actions
- ⚡ Scalable backend with Redis and Lua scripts
- 🔐 Modern authentication (NextAuth.js, Google, Instagram)
- 📦 Modular, production-ready codebase
- 💎 PWA-ready with custom icons and manifest
- 🚀 Turbopack for development, webpack for production
- 📲 Mobile testing support with ADB reverse scripts

---

## Architecture

**Frontend (`fe/`)**

- Next.js 14 (App Router, TypeScript, Tailwind CSS)
- ShadCN/UI, Lucide React, Sonner, Zustand, Zod
- NextAuth.js for authentication
- Prisma ORM for database
- PWA-ready, Vercel deployable

**Backend (`be/`)**

- Node.js, Express, TypeScript
- Socket.IO for real-time signaling
- Redis for state, pub/sub, and matchmaking
- Lua scripts for atomic match/finalize logic
- JWT for secure socket authentication

---

## Folder Structure

```
NawaNapam.website/
├── be/                      # Backend (Express, Socket.IO, Redis)
│   ├── src/
│   │   ├── app.ts          # Express app configuration
│   │   ├── index.ts        # Server entry point
│   │   ├── services/       # Socket.IO service
│   │   ├── socket/         # Socket handlers
│   │   └── utils/          # Redis client & utilities
│   ├── redis/scripts/      # Lua scripts for Redis
│   ├── scripts/            # Build & utility scripts
│   │   └── reverse-port.js # ADB reverse for mobile (port 8080)
│   └── package.json
├── fe/                      # Frontend (Next.js, UI, Auth, Prisma)
│   ├── src/
│   │   ├── app/            # Next.js App Router
│   │   ├── components/     # React components
│   │   ├── hooks/          # Custom hooks (Socket, WebRTC, etc.)
│   │   ├── lib/            # Utilities, Prisma, Auth
│   │   └── types/          # TypeScript definitions
│   ├── public/
│   │   ├── icons/          # PWA icons (generated)
│   │   ├── images/         # Static images
│   │   │   └── nawanapam.png  # Main logo/icon
│   │   └── manifest.json   # PWA manifest
│   ├── prisma/             # Database schema & migrations
│   ├── scripts/            # Build & utility scripts
│   │   ├── generate-icons.js   # Generate PWA icons
│   │   ├── generate-favicon.js # Generate favicon
│   │   └── reverse-fe.js       # ADB reverse for mobile (port 3000)
│   └── package.json
├── scripts/
│   └── start.js            # Root-level dev server runner
├── package.json            # Root package.json with workspace scripts
└── README.md
```

---

## Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/NawaNapam/NawaNapam.website.git
cd NawaNapam.website
```

### 2. Install Dependencies

```bash
# Install root dependencies
npm install

# Install frontend dependencies
cd fe
npm install

# Install backend dependencies
cd ../be
npm install
```

### 3. Run Development Servers

**Option A: Run Both (Recommended)**

```bash
# From root directory
npm run dev
```

**Option B: Run Individually**

```bash
# Frontend only
npm run dev:fe

# Backend only
npm run dev:be
```

**Option C: Mobile Development with ADB**

```bash
# Automatically setup ADB reverse and start both
npm run dev:mobile
```

### 4. Access the Application

- **Frontend**: [http://localhost:3000](http://localhost:3000)
- **Backend**: [http://localhost:8080](http://localhost:8080)
- **Mobile**: Use `npm run dev:mobile` after connecting your device via USB

---

## Environment Variables

````env
PORT=8080
REDIS_URL=redis://localhost:6379
JWT_SECRET=your_secret
``
- `PORT=4000`
```env
NEXTAUTH_SECRET=your_secret
NEXTAUTH_URL=http://localhost:3000
DATABASE_URL=your_postgresql_url
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
INSTAGRAM_CLIENT_ID=... (optional)
INSTAGRAM_CLIENT_SECRET=...
NEXT_PUBLIC_SOCKET_URL=http://localhost:8080
````

- `NEXTAUTH_URL=http://localhost:3000`
- `GOOGLE_CLIENT_ID=...`
- `GOOGLE_CLIENT_SECRET=...`
- `INSTAGRAM_CLIENT_ID=...` (optional)
- `INSTAGRAM_CLIENT_SECRET=...`

---

## Scripts

### Root Level Commands

```bash
npm run dev         # Start both frontend and backend with colored output
npm run dev:fe      # Start frontend only
npm run dev:be      # Start backend only
npm run dev:mobile  # Setup ADB reverse + start both (for mobile testing)
```

### Frontend Scripts (`fe/`)

```bash
npm run dev          # Start Next.js with Turbopack
npm run build        # Build for production (uses webpack for PWA compatibility)
npm run start        # Start production server
npm run lint         # Run ESLint
npm run dev:mobile   # ADB reverse (port 3000) + start dev
```

### Backend Scripts (`be/`)

```bash
npm run dev          # Start in watch mode with TypeScript compilation
npm run build        # Build TypeScript
npm run start        # Run compiled server
npm run dev:mobile   # ADB reverse (port 8080) + start dev
```

### Icon Generation (`fe/scripts/`)

```bash
node scripts/generate-icons.js   # Generate PWA icons from nawanapam.png
node scripts/generate-favicon.js # Generate favicon.ico
```

---

## Key Pages & API

| Route              | Purpose         | Design Highlights                    |
| ------------------ | --------------- | ------------------------------------ |
| `/`                | Landing Page    | Hero, golden glow, animated blobs    |
| `/login`           | Login Page      | Glass card, live time, golden inputs |
| `/signup`          | Signup Page     | Same as login, extra fields          |
| `/dashboard`       | User Dashboard  | Stats, quick actions, golden cards   |
| `/settings/update` | Profile Update  | Avatar, edit badge, golden button    |
| `/chat`            | Video Chat Room | Full-screen, no-scroll, golden tags  |

---

## Backend API & Real-Time

- **Socket.IO**: `/socket` namespace for signaling, matchmaking, chat
- **REST API**: (extendable for user/profile management)
- **Redis**: Used for user state, matchmaking pools, pub/sub
- **Lua Scripts**: Atomic match/finalize logic for performance

---

## Roadmap

- [ ] Advanced WebRTC (Socket.IO / LiveKit / PeerJS)
- [ ] Smarter interest-based matching
- [ ] Like / Report user
- [ ] Chat history & favorites
- [ ] Mobile app (React Native / Expo)
- [ ] Hindi / Regional language support
- [ ] Voice-only mode
- [ ] Dark/Light mode toggle

---

## Contributing

We welcome contributions! Please:

- Open issues for bugs/ideas
- Submit PRs (with clear descriptions)
- Follow code style and keep the **calm, luxurious, Indian soul** alive

---

## License

MIT License © 2025 Nawa Napam

---

**Made with love in India**

> _"Har mulakat ek nayi kahani hai."_  
> — Every meeting is a new story.

---

**Star this repo if you love the vibe!**

Namaste  
— The NTeam
