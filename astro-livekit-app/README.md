# LiveKit Video Conference - Astro App

A LiveKit video conferencing application built with Astro framework and vanilla JavaScript.

## Features

- Video conferencing with LiveKit
- Camera and microphone controls (off by default)
- Screen sharing
- Layout switching
- Connection quality indicators
- Device selection
- Invite link sharing

## Getting Started

### Prerequisites

- Node.js (v16 or later)
- npm or pnpm
- A LiveKit server (or LiveKit Cloud account)

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   # or
   pnpm install
   ```
3. Copy `.env.example` to `.env` and fill in your LiveKit credentials:
   ```
   LIVEKIT_API_KEY=your_api_key_here
   LIVEKIT_API_SECRET=your_api_secret_here
   LIVEKIT_WS_URL=wss://your-livekit-server.com
   ```

### Development

Start the development server:

```bash
npm run dev
# or
pnpm dev
```

The application will be available at http://localhost:4321

### Production Build

Build for production:

```bash
npm run build
# or
pnpm build
```

Preview the production build:

```bash
npm run preview
# or
pnpm preview
```

## Architecture

- **Astro Framework**: Server-side rendering with API endpoints
- **Vanilla JavaScript**: Client-side interactivity
- **TailwindCSS**: Styling
- **LiveKit Client SDK**: WebRTC video conferencing

## Security Note

This application generates LiveKit tokens on the server side. In a production environment, make sure to properly secure your API endpoints and environment variables.
