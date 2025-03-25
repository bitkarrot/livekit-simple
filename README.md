# LiveKit Simple Video Conference Demo

A simple video conferencing application built with LiveKit and Node.js. This demo showcases basic LiveKit functionality including:

- Video and audio conferencing
- Device selection (camera, microphone)
- Screen sharing
- Room management
- Real-time audio visualization

## Prerequisites

Before running this application, you need to have the following installed:

- [Node.js](https://nodejs.org/) (v14 or later)
- [pnpm](https://pnpm.io/) (recommended) or [yarn](https://yarnpkg.com/)
- [LiveKit CLI](https://docs.livekit.io/home/get-started/intro-to-livekit/) for the development server

## Setup Instructions

### 1. Install LiveKit CLI

If you haven't installed the LiveKit CLI yet, you can do so with:

https://docs.livekit.io/home/cli/cli-setup/

### 2. Install Dependencies

Navigate to the project directory and install the required dependencies:

```bash
# Using pnpm
pnpm install

# Using yarn
yarn install
```

### 3. Configure Environment Variables

The application uses environment variables for configuration. A `.env` file is included with default development settings:

```
LIVEKIT_API_KEY=devkey
LIVEKIT_API_SECRET=secret
LIVEKIT_WS_URL=ws://localhost:7880
PORT=3000
```

These are the default values for the LiveKit development server. You can modify them if needed.

## Running the Application

To run the application, you need to start both the LiveKit development server and the Node.js server.

### 1. Start the LiveKit Development Server

Open a terminal window and run:

```bash
livekit-server --dev
```

This will start the LiveKit server on port 7880 with the default development API key and secret.

For network access (to allow other devices to connect), use:

```bash
livekit-server --dev --bind 0.0.0.0
```

### 2. Start the Node.js Server

Open another terminal window, navigate to the project directory, and run:

```bash
# Using node directly
node server.js

# Or if you have nodemon installed for development
nodemon server.js
```

The server will start on port 3000 (or the port specified in your `.env` file).

### 3. Access the Application

Open your web browser and navigate to:

```
http://localhost:3000
```

## Using the Application

1. Enter your username and a room name
2. Click "Join Room" to enter the video conference
3. Use the control buttons at the bottom to:
   - Toggle microphone
   - Toggle camera
   - Share your screen
   - Leave the room

## Troubleshooting

### Connection Issues

If you encounter connection issues:

1. Make sure both the LiveKit server and Node.js server are running
2. Check that the WebSocket URL in the `.env` file matches your LiveKit server address
3. For local development, use `ws://` protocol (not `wss://`)
4. Check browser console for detailed error messages

### Permission Issues

If you have camera or microphone permission issues:

1. Make sure you've granted the necessary permissions in your browser
2. Try using a different browser if permissions are not working
3. Check if your camera/microphone is being used by another application

## Development Notes

- The application uses the LiveKit Client SDK loaded via CDN
- The server uses Express.js to serve static files and handle token generation
- Media device selection is handled through the browser's Media Devices API

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [LiveKit](https://livekit.io/) for the WebRTC platform
- [Express.js](https://expressjs.com/) for the web server framework
