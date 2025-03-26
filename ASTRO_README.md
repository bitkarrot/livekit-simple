# LiveKit Video Conference - Astro Version

This repository has been ported to use the Astro framework with server-side API endpoints while maintaining the vanilla JavaScript client-side code.

## What's Changed

- Converted the Express.js server to Astro's server-side API endpoints
- Maintained the vanilla JavaScript client-side code (no React)
- Organized the codebase into Astro's component-based structure
- Kept the camera and microphone off by default when users join video rooms

## How to Use the Astro Version

1. Navigate to the Astro app directory:
   ```bash
   cd astro-livekit-app
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   pnpm install
   ```

3. Copy your existing `.env` file or create a new one with your LiveKit credentials:
   ```
   LIVEKIT_API_KEY=your_api_key_here
   LIVEKIT_API_SECRET=your_api_secret_here
   LIVEKIT_WS_URL=wss://your-livekit-server.com
   ```

4. Start the development server:
   ```bash
   npm run dev
   # or
   pnpm dev
   ```

5. Open your browser to http://localhost:4321

## Benefits of Using Astro

- **Performance**: Astro's partial hydration approach means only the interactive parts of your page use JavaScript
- **Server-side rendering**: Better SEO and initial page load performance
- **API endpoints**: Built-in API routes without needing a separate Express server
- **Component-based**: Easier to maintain and extend the codebase
- **Modern development**: TypeScript support, hot module reloading, and more

## Original vs. Astro Version

The original version using Express.js is still available in the root directory. The Astro version maintains all the same functionality while providing a more modern development experience.
