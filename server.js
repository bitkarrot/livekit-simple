const express = require('express');
const path = require('path');
const { AccessToken } = require('livekit-server-sdk');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files
app.use(express.static(path.join(__dirname)));

// API endpoint to generate LiveKit tokens (for demo purposes only)
// In production, you should secure this endpoint and use environment variables for keys
app.get('/get-token', (req, res) => {
  const roomName = req.query.room;
  const participantName = req.query.username;
  
  if (!roomName || !participantName) {
    return res.status(400).json({ error: 'Room name and participant name are required' });
  }
  
  // Get API key and secret from environment variables
  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;
  
  if (!apiKey || !apiSecret) {
    return res.status(500).json({ error: 'LiveKit API key or secret not configured' });
  }
  
  // Create a new access token
  const token = new AccessToken(apiKey, apiSecret, {
    identity: participantName,
  });
  
  // Grant permissions to the room
  token.addGrant({
    roomJoin: true,
    room: roomName,
    canPublish: true,
    canSubscribe: true,
  });
  
  // Return the token and WebSocket URL
  res.json({
    token: token.toJwt(),
    url: process.env.LIVEKIT_WS_URL || 'wss://your-livekit-server.com',
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log(`Open your browser to http://localhost:${PORT} to view the application`);
});
