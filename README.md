# NawaNapam

**A Premium, Culturally Rich, Real-Time Video Chat Platform for Meaningful Connections**

---

## Overview

**NawaNapam** — _“New Connection”_ in Assamese — is a modern, luxury video chat platform for meaningful, respectful, and spontaneous connections. Built for India and the world, it combines a beautiful UI, cultural warmth, and robust real-time backend.

---

## Features

- Real-time 1-on-1 video and text chat (WebRTC, Socket.IO)
- Interest-based matching (gender, tags, preferences)
- Secure, encrypted, and private
- Fully responsive (mobile, tablet, desktop)
- Elegant, glassmorphic UI with golden gradients
- Mute/camera controls, "Next" and "End Chat" actions
- Scalable backend with Redis and Lua scripts
- Modern authentication (NextAuth.js, Google, Instagram)
- Modular, production-ready codebase

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
├── be/         # Backend (Express, Socket.IO, Redis)
│   ├── src/
│   │   ├── app.ts
│   │   ├── services/
│   │   ├── socket/
│   │   └── utils/
│   ├── redis/scripts/
│   └── package.json
├── fe/         # Frontend (Next.js, UI, Auth, Prisma)
│   ├── src/
│   ├── components/
│   ├── hooks/
│   ├── lib/
│   ├── public/
│   ├── prisma/
│   └── package.json
└── README.md
```

---

## Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/nawa-napam.git
cd NawaNapam.website
```

### 2. Setup Backend (`be/`)

```bash
cd be
npm install
# Copy and edit your .env (see .env.example if present)
npm run build
npm start
# Or for development:
npm run dev
```

### 3. Setup Frontend (`fe/`)

```bash
cd fe
npm install
# Copy and edit your .env.local (see .env.example if present)
npm run dev
```

Frontend: [http://localhost:3000](http://localhost:3000)
Backend: [http://localhost:4000](http://localhost:4000) (or as set in env)

---

## Environment Variables

**Backend (`be/.env`):**

- `PORT=4000`
- `REDIS_URL=redis://localhost:6379`
- `JWT_SECRET=your_secret`

**Frontend (`fe/.env.local`):**

- `NEXTAUTH_SECRET=your_secret`
- `NEXTAUTH_URL=http://localhost:3000`
- `GOOGLE_CLIENT_ID=...`
- `GOOGLE_CLIENT_SECRET=...`
- `INSTAGRAM_CLIENT_ID=...` (optional)
- `INSTAGRAM_CLIENT_SECRET=...`

---

## Scripts

**Backend**

- `npm run dev` — Start backend in watch mode
- `npm run build` — Build TypeScript
- `npm start` — Run compiled server

**Frontend**

- `npm run dev` — Start Next.js frontend
- `npm run build` — Build frontend
- `npm start` — Run production frontend

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
