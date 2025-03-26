import type { APIRoute } from 'astro';
import { AccessToken } from 'livekit-server-sdk';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const roomName = url.searchParams.get('room');
  const participantName = url.searchParams.get('username');
  
  if (!roomName || !participantName) {
    return new Response(
      JSON.stringify({ error: 'Room name and participant name are required' }), 
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }
  
  // Get API key and secret from environment variables
  const apiKey = import.meta.env.ASTRO_LIVEKIT_API_KEY;
  const apiSecret = import.meta.env.ASTRO_LIVEKIT_API_SECRET;
  
  if (!apiKey || !apiSecret) {
    return new Response(
      JSON.stringify({ error: 'LiveKit API key or secret not configured' }), 
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
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
  return new Response(
    JSON.stringify({
      token: token.toJwt(),
      url: import.meta.env.ASTRO_LIVEKIT_WS_URL || 'wss://your-livekit-server.com',
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
}
