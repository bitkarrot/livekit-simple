// LiveKit configuration
let room;
let isReconnecting = false;

// DOM elements - wait for DOM to be fully loaded before accessing
let connectModal, permissionsWarning, joinBtn, usernameInput, roomInput;
let participantsContainer, micBtn, cameraBtn, screenBtn, inviteBtn, leaveBtn;
let micIcon, micOffIcon, cameraIcon, cameraOffIcon, statusBanner, statusText;
let audioInputSelect, videoInputSelect, toast, toastMessage;

// State
let micEnabled = true;
let cameraEnabled = true;
let screenShareTrack = null;
let currentRoom = '';
let audioAnalysers = new Map();
let roomEventsBound = false;

// Initialize the application
document.addEventListener('DOMContentLoaded', init);

async function init() {
  console.log('Initializing LiveKit app...');
  
  // Initialize DOM elements after DOM is loaded
  connectModal = document.getElementById('connect-modal');
  permissionsWarning = document.getElementById('permissions-warning');
  joinBtn = document.getElementById('join-btn');
  usernameInput = document.getElementById('username');
  roomInput = document.getElementById('room');
  participantsContainer = document.getElementById('participants-container');
  micBtn = document.getElementById('mic-btn');
  cameraBtn = document.getElementById('camera-btn');
  screenBtn = document.getElementById('screen-btn');
  inviteBtn = document.getElementById('invite-btn');
  leaveBtn = document.getElementById('leave-btn');
  micIcon = document.getElementById('mic-icon');
  micOffIcon = document.getElementById('mic-off-icon');
  cameraIcon = document.getElementById('camera-icon');
  cameraOffIcon = document.getElementById('camera-off-icon');
  statusBanner = document.getElementById('status-banner');
  statusText = document.getElementById('status-text');
  audioInputSelect = document.getElementById('audio-input');
  videoInputSelect = document.getElementById('video-input');
  toast = document.getElementById('toast');
  toastMessage = document.getElementById('toast-message');
  
  try {
    // Verify LiveKit is available
    if (typeof LivekitClient === 'undefined') {
      throw new Error('LiveKit SDK not loaded. Please refresh the page and try again.');
    }
    
    console.log('LiveKit SDK version:', LivekitClient.version);
    
    // Create a new room instance
    room = new LivekitClient.Room({
      adaptiveStream: true,
      dynacast: true,
      videoCaptureDefaults: {
        resolution: { width: 640, height: 480 }
      }
    });
    
    // Populate device selection dropdowns
    await populateDeviceOptions();
    
    // Setup event listeners
    setupEventListeners();
    
    // Check for URL parameters (for direct room joining)
    const urlParams = new URLSearchParams(window.location.search);
    const roomParam = urlParams.get('room');
    if (roomParam) {
      roomInput.value = roomParam;
      
      // Auto-connect if room is specified in URL
      const username = localStorage.getItem('livekit-username') || '';
      if (username) {
        usernameInput.value = username;
        // Auto-join after a short delay to allow UI to initialize
        setTimeout(() => {
          joinBtn.click();
        }, 500);
      }
    }
    
    console.log('LiveKit app initialized successfully');
    
    // Remove any developer tools or debug elements that might be showing
    setTimeout(removeDebugElements, 500);
  } catch (error) {
    console.error('Failed to initialize app:', error);
    showToast('Failed to initialize: ' + error.message);
  }
}

// Remove any developer tools or debug elements
function removeDebugElements() {
  // Try to find and remove the "Send element" box
  const debugElements = document.querySelectorAll('div[id^="send-element"], div[id^="debug-"], div[id^="dev-"]');
  debugElements.forEach(el => {
    console.log('Removing debug element:', el);
    el.style.display = 'none';
  });
}

// Setup event listeners
function setupEventListeners() {
  // Join button
  joinBtn.addEventListener('click', async () => {
    const username = usernameInput.value.trim();
    const roomName = roomInput.value.trim();
    
    if (!username || !roomName) {
      showToast('Please enter your name and room name');
      return;
    }
    
    // Save username for future use
    localStorage.setItem('livekit-username', username);
    
    try {
      await joinRoom(username, roomName);
      
      // Update URL with room parameter without reloading the page
      const url = new URL(window.location);
      url.searchParams.set('room', roomName);
      window.history.pushState({}, '', url);
    } catch (error) {
      console.error('[ERROR] Error connecting to room:', error);
      showToast('Failed to connect: ' + (error.message || 'Unknown error'));
    }
  });
  
  // Mic toggle
  micBtn.addEventListener('click', async () => {
    try {
      if (!room || !room.localParticipant) {
        console.error('Cannot toggle microphone: Room or local participant not available');
        showToast('You must join a room before toggling your microphone');
        return;
      }
      
      try {
        if (micEnabled) {
          // Disable microphone
          await room.localParticipant.setMicrophoneEnabled(false);
          micEnabled = false;
          showToast('Microphone disabled');
        } else {
          // Enable microphone
          await room.localParticipant.setMicrophoneEnabled(true);
          micEnabled = true;
          showToast('Microphone enabled');
        }
        
        updateMicButton();
      } catch (deviceError) {
        console.error('[ERROR] Error toggling microphone:', deviceError);
        
        // Handle permission errors
        if (deviceError.name === 'NotAllowedError' || deviceError.message.includes('Permission denied')) {
          permissionsWarning.classList.remove('hidden');
          showToast('Microphone access denied. Please check your permissions.');
        } else {
          showToast('Failed to toggle microphone: ' + (deviceError.message || 'Unknown error'));
        }
        
        // Update button state to reflect reality
        micEnabled = !micEnabled;
        updateMicButton();
      }
    } catch (error) {
      console.error('[ERROR] Unexpected error toggling microphone:', error);
      showToast('An unexpected error occurred');
    }
  });
  
  // Camera toggle
  cameraBtn.addEventListener('click', async () => {
    try {
      if (!room || !room.localParticipant) {
        console.error('Cannot toggle camera: Room or local participant not available');
        showToast('You must join a room before toggling your camera');
        return;
      }
      
      try {
        if (cameraEnabled) {
          // Disable camera
          await room.localParticipant.setCameraEnabled(false);
          cameraEnabled = false;
          showToast('Camera disabled');
        } else {
          // Enable camera
          await room.localParticipant.setCameraEnabled(true);
          cameraEnabled = true;
          showToast('Camera enabled');
        }
        
        updateCameraButton();
      } catch (deviceError) {
        console.error('[ERROR] Error toggling camera:', deviceError);
        
        // Handle permission errors
        if (deviceError.name === 'NotAllowedError' || deviceError.message.includes('Permission denied')) {
          permissionsWarning.classList.remove('hidden');
          showToast('Camera access denied. Please check your permissions.');
        } else {
          showToast('Failed to toggle camera: ' + (deviceError.message || 'Unknown error'));
        }
        
        // Update button state to reflect reality
        cameraEnabled = !cameraEnabled;
        updateCameraButton();
      }
    } catch (error) {
      console.error('[ERROR] Unexpected error toggling camera:', error);
      showToast('An unexpected error occurred');
    }
  });
  
  // Screen share
  screenBtn.addEventListener('click', async () => {
    try {
      if (!room || !room.localParticipant) {
        console.error('Cannot toggle screen share: Room or local participant not available');
        showToast('You must join a room before sharing your screen');
        return;
      }
      
      if (screenShareTrack) {
        // Stop screen sharing
        await room.localParticipant.unpublishTrack(screenShareTrack);
        // Make sure to properly dispose the track to free up resources
        screenShareTrack.stop();
        screenShareTrack = null;
        screenBtn.classList.remove('bg-blue-600');
        screenBtn.classList.add('bg-gray-700');
        showToast('Screen sharing stopped');
      } else {
        // Start screen sharing
        try {
          // Use a simpler approach with getDisplayMedia
          const constraints = {
            audio: true,
            video: true
          };
          
          console.log('Getting display media with constraints:', constraints);
          
          // Create screen capture stream
          const screenStream = await navigator.mediaDevices.getDisplayMedia(constraints);
          
          // Get video track
          const videoTrack = screenStream.getVideoTracks()[0];
          if (!videoTrack) {
            throw new Error('No video track found in screen share stream');
          }
          
          console.log('Created screen share video track:', videoTrack.id, videoTrack.label);
          
          // Create a LiveKit track from the media track
          // Use the simpler constructor to avoid issues with source identification
          screenShareTrack = new LivekitClient.LocalVideoTrack(videoTrack);
          
          console.log('Created LiveKit screen share track:', screenShareTrack);
          
          // Handle screen share ending
          videoTrack.addEventListener('ended', () => {
            console.log('Screen share track ended event fired');
            if (screenShareTrack) {
              room.localParticipant.unpublishTrack(screenShareTrack);
              screenShareTrack = null;
              screenBtn.classList.remove('bg-blue-600');
              screenBtn.classList.add('bg-gray-700');
              showToast('Screen sharing stopped');
              // Force update the participant grid
              updateParticipantGrid();
            }
          });
          
          // Publish the track with metadata to ensure it's recognized as screen share
          const publishOptions = {
            name: 'screen',
            source: 'screenshare'
          };
          
          await room.localParticipant.publishTrack(screenShareTrack, publishOptions);
          console.log('Published screen share track:', screenShareTrack.sid);
          
          screenBtn.classList.remove('bg-gray-700');
          screenBtn.classList.add('bg-blue-600');
          showToast('Screen sharing started');
          
          // Wait a short time for the track publication to be registered
          setTimeout(() => {
            updateParticipantGrid();
          }, 1000);
        } catch (screenError) {
          // Handle user cancellation (not a real error)
          if (screenError.name === 'NotAllowedError' || screenError.message.includes('Permission denied')) {
            console.log('User cancelled screen sharing');
            return;
          }
          
          console.error('[ERROR] Error toggling screen share:', screenError);
          showToast('Failed to share screen: ' + (screenError.message || 'Unknown error'));
        }
      }
    } catch (error) {
      console.error('[ERROR] Error toggling screen share:', error);
      showToast('An unexpected error occurred while sharing screen');
    }
  });
  
  // Invite link
  inviteBtn.addEventListener('click', () => {
    const url = new URL(window.location.href);
    url.searchParams.set('room', currentRoom);
    navigator.clipboard.writeText(url.toString())
      .then(() => showToast('Invite link copied to clipboard'))
      .catch(error => {
        console.error('Failed to copy invite link:', error);
        showToast('Failed to copy invite link');
      });
  });
  
  // Leave button
  leaveBtn.addEventListener('click', async () => {
    if (room) {
      await room.disconnect();
      connectModal.classList.remove('hidden');
      statusBanner.classList.add('hidden');
      participantsContainer.innerHTML = '';
    }
  });
  
  // Device selection
  audioInputSelect.addEventListener('change', async () => {
    try {
      if (!room || !room.localParticipant) {
        console.log('Cannot change audio device: Not connected to a room');
        return;
      }
      
      const deviceId = audioInputSelect.value;
      if (!deviceId) return;
      
      await room.switchActiveDevice(LivekitClient.Track.Kind.Audio, deviceId);
      showToast('Microphone changed');
    } catch (error) {
      console.error('[ERROR] Failed to switch audio device:', error);
      showToast('Failed to change microphone: ' + (error.message || 'Unknown error'));
    }
  });
  
  videoInputSelect.addEventListener('change', async () => {
    try {
      if (!room || !room.localParticipant) {
        console.log('Cannot change video device: Not connected to a room');
        return;
      }
      
      const deviceId = videoInputSelect.value;
      if (!deviceId) return;
      
      await room.switchActiveDevice(LivekitClient.Track.Kind.Video, deviceId);
      showToast('Camera changed');
    } catch (error) {
      console.error('[ERROR] Failed to switch video device:', error);
      showToast('Failed to change camera: ' + (error.message || 'Unknown error'));
    }
  });
}

// Setup room events
function setupRoomEvents() {
  if (!room) return;
  
  // Remove any existing event listeners to prevent duplicates
  room.removeAllListeners();
  roomEventsBound = true;
  
  // Connection state changes
  room.on(LivekitClient.RoomEvent.ConnectionStateChanged, (state) => {
    console.log('Connection state changed:', state);
    switch (state) {
      case LivekitClient.ConnectionState.Connecting:
        updateConnectionStatus('Connecting...');
        break;
      case LivekitClient.ConnectionState.Connected:
        updateConnectionStatus('Connected');
        isReconnecting = false;
        break;
      case LivekitClient.ConnectionState.Disconnected:
        updateConnectionStatus('Disconnected');
        if (!isReconnecting) {
          // Clean up resources
          cleanupRoom();
        }
        break;
      case LivekitClient.ConnectionState.Reconnecting:
        updateConnectionStatus('Reconnecting...');
        isReconnecting = true;
        break;
      default:
        break;
    }
  });
  
  // Participant events
  room.on(LivekitClient.RoomEvent.ParticipantConnected, (participant) => {
    console.log('Participant connected:', participant.identity);
    showToast(`${participant.identity} joined the room`);
    updateParticipantGrid();
  });
  
  room.on(LivekitClient.RoomEvent.ParticipantDisconnected, (participant) => {
    console.log('Participant disconnected:', participant.identity);
    showToast(`${participant.identity} left the room`);
    updateParticipantGrid();
  });
  
  // Track events
  room.on(LivekitClient.RoomEvent.TrackSubscribed, (track, publication, participant) => {
    console.log('Track subscribed:', track.kind, 'from', participant.identity);
    updateParticipantGrid();
    
    if (track.kind === LivekitClient.Track.Kind.Audio) {
      setupAudioVisualization(participant);
    }
  });
  
  room.on(LivekitClient.RoomEvent.TrackUnsubscribed, (track, publication, participant) => {
    console.log('Track unsubscribed:', track.kind, 'from', participant.identity);
    updateParticipantGrid();
  });
  
  room.on(LivekitClient.RoomEvent.TrackMuted, (publication, participant) => {
    console.log('Track muted:', publication.kind, 'from', participant.identity);
    // Only update grid if the room is still connected
    if (room && room.state === LivekitClient.ConnectionState.Connected) {
      updateParticipantGrid();
    }
  });
  
  room.on(LivekitClient.RoomEvent.TrackUnmuted, (publication, participant) => {
    console.log('Track unmuted:', publication.kind, 'from', participant.identity);
    // Only update grid if the room is still connected
    if (room && room.state === LivekitClient.ConnectionState.Connected) {
      updateParticipantGrid();
    }
  });
  
  // Active speaker detection
  room.on(LivekitClient.RoomEvent.ActiveSpeakersChanged, (speakers) => {
    // Only update if the room is still connected
    if (room && room.state === LivekitClient.ConnectionState.Connected) {
      highlightActiveSpeakers(speakers);
    }
  });
  
  // Connection quality
  room.on(LivekitClient.RoomEvent.ConnectionQualityChanged, (quality, participant) => {
    // Only update if the room is still connected
    if (room && room.state === LivekitClient.ConnectionState.Connected) {
      updateConnectionQuality(quality, participant);
    }
  });
  
  // Disconnection
  room.on(LivekitClient.RoomEvent.Disconnected, () => {
    console.log('Disconnected from room');
    if (!isReconnecting) {
      connectModal.classList.remove('hidden');
      statusBanner.classList.add('hidden');
      participantsContainer.innerHTML = '';
      cleanupRoom();
    }
  });
}

// Clean up room resources
function cleanupRoom() {
  // Clean up audio analyzers
  audioAnalysers.forEach((analyserData) => {
    if (analyserData.audioContext) {
      try {
        analyserData.audioContext.close();
      } catch (e) {
        console.error('Error closing audio context:', e);
      }
    }
  });
  audioAnalysers.clear();
  
  // Reset state
  micEnabled = true;
  cameraEnabled = true;
  screenShareTrack = null;
  roomEventsBound = false;
  
  // Update UI
  updateMicButton();
  updateCameraButton();
}

// Join a room
async function joinRoom(username, roomName) {
  try {
    // Show connecting status
    updateConnectionStatus('Connecting...');
    statusBanner.classList.remove('hidden');
    
    // Get token from server
    const response = await fetch(`/get-token?username=${encodeURIComponent(username)}&room=${encodeURIComponent(roomName)}`);
    if (!response.ok) {
      throw new Error(`Failed to get token: ${response.status} ${response.statusText}`);
    }
    
    const { token, url } = await response.json();
    if (!token) {
      throw new Error('Invalid token response from server');
    }
    
    console.log('Received token and URL from server:', { url });
    
    // If we already have a room, disconnect from it first
    if (room && room.state !== LivekitClient.ConnectionState.Disconnected) {
      try {
        await room.disconnect();
        // Wait a moment for cleanup
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (disconnectError) {
        console.log('Error disconnecting from previous room:', disconnectError);
        // Continue anyway
      }
    }
    
    // Create a new room instance
    room = new LivekitClient.Room({
      adaptiveStream: true,
      dynacast: true,
      videoCaptureDefaults: {
        resolution: { width: 640, height: 480 }
      }
    });
    
    // Setup room events
    setupRoomEvents();
    
    // Connect to room with proper error handling
    try {
      // Try different URL formats if needed
      // For local development, ws:// usually works better than wss://
      let wsUrl = url || 'ws://localhost:7880';
      
      // If URL starts with wss:// but we're on localhost, try ws:// instead
      if (wsUrl.startsWith('wss://localhost')) {
        wsUrl = wsUrl.replace('wss://', 'ws://');
      }
      
      console.log('Connecting to LiveKit server at:', wsUrl);
      
      await room.connect(wsUrl, token, {
        autoSubscribe: true
      });
      
      console.log('Connected to room:', room.name);
      
      // Save current room name
      currentRoom = roomName;
      
      // Hide connect modal
      connectModal.classList.add('hidden');
      
      // Enable local tracks with proper error handling
      try {
        await room.localParticipant.enableCameraAndMicrophone();
        micEnabled = true;
        cameraEnabled = true;
        updateMicButton();
        updateCameraButton();
      } catch (mediaError) {
        console.error('[ERROR] Error enabling camera and microphone:', mediaError);
        
        // Still allow connection even if media fails
        if (mediaError.name === 'NotAllowedError' || mediaError.message.includes('Permission denied')) {
          permissionsWarning.classList.remove('hidden');
          showToast('Camera and microphone access denied. Please check your permissions.');
        } else {
          showToast('Failed to enable camera and microphone: ' + (mediaError.message || 'Unknown error'));
        }
        
        // Set initial state to reflect reality
        micEnabled = false;
        cameraEnabled = false;
        updateMicButton();
        updateCameraButton();
      }
      
      // Update UI
      updateParticipantGrid();
      
      // Update connection status
      updateConnectionStatus('Connected');
      showToast(`Joined room: ${roomName}`);
    } catch (connectionError) {
      console.error('[ERROR] Error connecting to room:', connectionError);
      updateConnectionStatus('Connection failed');
      throw connectionError;
    }
  } catch (error) {
    console.error('[ERROR] Error joining room:', error);
    
    // Check for permission errors
    if (error.name === 'NotAllowedError' || error.message.includes('Permission denied')) {
      permissionsWarning.classList.remove('hidden');
    }
    
    throw error;
  }
}

// Populate device options
async function populateDeviceOptions() {
  try {
    // Request permissions first
    await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
    
    // Get available devices
    const devices = await navigator.mediaDevices.enumerateDevices();
    
    // Filter audio input devices
    const audioInputs = devices.filter(device => device.kind === 'audioinput');
    audioInputSelect.innerHTML = '';
    audioInputs.forEach(device => {
      const option = document.createElement('option');
      option.value = device.deviceId;
      option.text = device.label || `Microphone ${audioInputSelect.length + 1}`;
      audioInputSelect.appendChild(option);
    });
    
    // Filter video input devices
    const videoInputs = devices.filter(device => device.kind === 'videoinput');
    videoInputSelect.innerHTML = '';
    videoInputs.forEach(device => {
      const option = document.createElement('option');
      option.value = device.deviceId;
      option.text = device.label || `Camera ${videoInputSelect.length + 1}`;
      videoInputSelect.appendChild(option);
    });

    // Add device selection change event listeners
    audioInputSelect.addEventListener('change', async () => {
      try {
        if (!room || !room.localParticipant) {
          console.log('Cannot change audio device: Not connected to a room');
          return;
        }
        
        const deviceId = audioInputSelect.value;
        if (!deviceId) return;
        
        await room.switchActiveDevice(LivekitClient.Track.Kind.Audio, deviceId);
        showToast('Microphone changed');
      } catch (error) {
        console.error('[ERROR] Failed to switch audio device:', error);
        showToast('Failed to change microphone: ' + (error.message || 'Unknown error'));
      }
    });
    
    videoInputSelect.addEventListener('change', async () => {
      try {
        if (!room || !room.localParticipant) {
          console.log('Cannot change video device: Not connected to a room');
          return;
        }
        
        const deviceId = videoInputSelect.value;
        if (!deviceId) return;
        
        await room.switchActiveDevice(LivekitClient.Track.Kind.Video, deviceId);
        showToast('Camera changed');
      } catch (error) {
        console.error('[ERROR] Failed to switch video device:', error);
        showToast('Failed to change camera: ' + (error.message || 'Unknown error'));
      }
    });
  } catch (error) {
    console.error('Failed to enumerate devices:', error);
    
    // Check for permission errors
    if (error.name === 'NotAllowedError' || error.message.includes('Permission denied')) {
      permissionsWarning.classList.remove('hidden');
    }
  }
}

// Update connection status
function updateConnectionStatus(status) {
  statusText.textContent = status;
  statusBanner.classList.remove('hidden');
}

// Update participant grid
function updateParticipantGrid() {
  try {
    console.log('Updating participant grid');
    // Clear the container
    participantsContainer.innerHTML = '';
    
    // Add local participant
    if (room && room.localParticipant) {
      console.log('Adding local participant to grid:', room.localParticipant.identity);
      createParticipantTile(room.localParticipant, true);
    }
    
    // Add remote participants
    if (room && room.participants) {
      room.participants.forEach(participant => {
        console.log('Adding remote participant to grid:', participant.identity);
        createParticipantTile(participant, false);
      });
    }
  } catch (error) {
    console.error('[ERROR] Error updating participant grid:', error);
  }
}

// Create a participant tile
function createParticipantTile(participant, isLocal) {
  const tile = document.createElement('div');
  tile.id = `participant-${participant.identity}`;
  tile.className = 'relative bg-gray-800 rounded-lg overflow-hidden aspect-video';
  
  // Create video container
  const videoContainer = document.createElement('div');
  videoContainer.className = 'absolute inset-0';
  tile.appendChild(videoContainer);
  
  // Create info bar
  const infoBar = document.createElement('div');
  infoBar.className = 'absolute bottom-0 left-0 right-0 bg-gray-900 bg-opacity-70 p-2 flex justify-between items-center';
  
  // Participant name
  const nameElement = document.createElement('span');
  nameElement.className = 'text-white text-sm';
  nameElement.textContent = isLocal ? `${participant.identity} (You)` : participant.identity;
  infoBar.appendChild(nameElement);
  
  // Indicators container
  const indicators = document.createElement('div');
  indicators.className = 'flex items-center gap-2';
  
  // Audio indicator
  const audioIndicator = document.createElement('div');
  audioIndicator.className = 'h-4 w-4 rounded-full bg-red-500';
  audioIndicator.id = `audio-indicator-${participant.identity}`;
  indicators.appendChild(audioIndicator);
  
  // Connection quality indicator
  const qualityIndicator = document.createElement('div');
  qualityIndicator.className = 'text-white text-xs';
  qualityIndicator.id = `connection-quality-${participant.identity}`;
  qualityIndicator.innerHTML = `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
  </svg>`;
  indicators.appendChild(qualityIndicator);
  
  infoBar.appendChild(indicators);
  tile.appendChild(infoBar);
  participantsContainer.appendChild(tile);
  
  // Attach video track if available
  const videoPublication = participant.getTrackPublication(LivekitClient.Track.Source.Camera);
  if (videoPublication && videoPublication.track && !videoPublication.isMuted) {
    const videoElement = videoPublication.track.attach();
    videoElement.autoplay = true;
    videoElement.className = 'w-full h-full object-cover';
    videoContainer.appendChild(videoElement);
    
    // If this is the local participant, mirror the video
    if (isLocal) {
      videoElement.style.transform = 'scaleX(-1)';
    }
  }
  
  // Check if screen share is active
  let screenPublication = participant.getTrackPublication(LivekitClient.Track.Source.ScreenShare);
  
  // If we're the local participant and have an active screen share track but no publication found yet
  if (isLocal && screenShareTrack && !screenPublication) {
    console.log('Local participant has active screen share track but no publication found via getTrackPublication');
    
    // Try to find the screen share publication by iterating through all track publications
    const publications = participant.trackPublications;
    console.log('All local participant publications:', Array.from(publications.values()).map(p => ({ sid: p.trackSid, source: p.source, kind: p.kind })));
    
    // Find the screen share publication manually
    for (const pub of publications.values()) {
      if (pub.track && pub.track === screenShareTrack) {
        console.log('Found screen share publication by direct track comparison:', pub.trackSid);
        screenPublication = pub;
        break;
      }
    }
  }
  
  if (screenPublication && screenPublication.track && !screenPublication.isMuted) {
    console.log('Found screen share publication for participant:', participant.identity, 'trackSid:', screenPublication.trackSid);
    
    // Create a screen share indicator
    const screenShareIndicator = document.createElement('div');
    screenShareIndicator.className = 'absolute top-2 right-2 bg-blue-600 text-white text-xs px-2 py-1 rounded';
    screenShareIndicator.textContent = 'Sharing Screen';
    videoContainer.appendChild(screenShareIndicator);
    
    // Create a separate tile for the screen share
    createScreenShareTile(participant, screenPublication);
  } else if (isLocal && screenShareTrack) {
    console.log('Local participant has active screen share track but no publication found');
    
    // Create a direct screen share tile using the local track
    createDirectScreenShareTile(participant, screenShareTrack);
  }
  
  // Update audio indicator based on track state
  const audioPublication = participant.getTrackPublication(LivekitClient.Track.Source.Microphone);
  if (audioPublication && !audioPublication.isMuted) {
    audioIndicator.classList.add('bg-green-500');
    audioIndicator.classList.remove('bg-red-500');
  }
}

// Create a screen share tile
function createScreenShareTile(participant, screenPublication) {
  console.log('Creating screen share tile for participant:', participant.identity);
  
  const tile = document.createElement('div');
  tile.id = `screen-${participant.identity}`;
  tile.className = 'relative bg-gray-800 rounded-lg overflow-hidden aspect-video';
  
  // Create screen container
  const screenContainer = document.createElement('div');
  screenContainer.className = 'absolute inset-0';
  
  // Attach screen share
  console.log('Attaching screen share track:', screenPublication.trackSid);
  const screenElement = screenPublication.track.attach();
  screenElement.autoplay = true;
  screenElement.className = 'w-full h-full object-contain';
  screenContainer.appendChild(screenElement);
  
  // Create info bar
  const infoBar = document.createElement('div');
  infoBar.className = 'absolute bottom-0 left-0 right-0 bg-gray-900 bg-opacity-70 p-2';
  
  // Screen share label
  const label = document.createElement('div');
  label.className = 'text-white text-sm';
  label.textContent = `${participant.identity}'s Screen`;
  infoBar.appendChild(label);
  
  tile.appendChild(screenContainer);
  tile.appendChild(infoBar);
  participantsContainer.appendChild(tile);
  
  console.log('Screen share tile created and added to grid');
}

// Create a direct screen share tile using the local track (fallback method)
function createDirectScreenShareTile(participant, track) {
  console.log('Creating direct screen share tile for participant:', participant.identity);
  
  const tile = document.createElement('div');
  tile.id = `screen-direct-${participant.identity}`;
  tile.className = 'relative bg-gray-800 rounded-lg overflow-hidden aspect-video';
  
  // Create screen container
  const screenContainer = document.createElement('div');
  screenContainer.className = 'absolute inset-0';
  
  // Attach screen share directly
  console.log('Attaching screen share track directly');
  const screenElement = track.mediaStreamTrack ? new MediaStream([track.mediaStreamTrack]).getTracks()[0].attach() : track.attach();
  screenElement.autoplay = true;
  screenElement.className = 'w-full h-full object-contain';
  screenContainer.appendChild(screenElement);
  
  // Create info bar
  const infoBar = document.createElement('div');
  infoBar.className = 'absolute bottom-0 left-0 right-0 bg-gray-900 bg-opacity-70 p-2';
  
  // Screen share label
  const label = document.createElement('div');
  label.className = 'text-white text-sm';
  label.textContent = `${participant.identity}'s Screen (Direct)`;
  infoBar.appendChild(label);
  
  tile.appendChild(screenContainer);
  tile.appendChild(infoBar);
  participantsContainer.appendChild(tile);
  
  console.log('Direct screen share tile created and added to grid');
}

// Setup audio visualization
function setupAudioVisualization(participant) {
  try {
    const audioPublication = participant.getTrackPublication(LivekitClient.Track.Source.Microphone);
    
    if (!audioPublication || !audioPublication.track) {
      return;
    }
    
    // Skip if we already have an analyser for this participant
    if (audioAnalysers.has(participant.sid)) {
      return;
    }
    
    try {
      // Create audio context
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      
      // Get audio source
      const audioElement = audioPublication.track.attach();
      const source = audioContext.createMediaStreamSource(audioElement.srcObject);
      source.connect(analyser);
      
      // Store the analyser
      audioAnalysers.set(participant.sid, { analyser, audioContext });
      
      // Start visualization
      visualizeAudio(participant);
    } catch (error) {
      console.error('Failed to setup audio visualization:', error);
    }
  } catch (error) {
    console.error('[ERROR] Error in setupAudioVisualization:', error);
  }
}

// Visualize audio levels
function visualizeAudio(participant) {
  try {
    const analyserData = audioAnalysers.get(participant.sid);
    if (!analyserData) return;
    
    const { analyser } = analyserData;
    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    
    const audioIndicator = document.getElementById(`audio-indicator-${participant.identity}`);
    if (!audioIndicator) return;
    
    // Update audio indicator based on volume
    const updateIndicator = () => {
      try {
        analyser.getByteFrequencyData(dataArray);
        
        // Calculate average volume
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const average = sum / dataArray.length;
        
        // Update indicator size based on volume
        const size = Math.max(4, Math.min(12, 4 + (average / 25)));
        audioIndicator.style.width = `${size}px`;
        audioIndicator.style.height = `${size}px`;
        
        // Request next frame only if the participant is still connected
        if (room && room.state === LivekitClient.ConnectionState.Connected) {
          requestAnimationFrame(updateIndicator);
        }
      } catch (error) {
        console.error('[ERROR] Error in audio visualization:', error);
      }
    };
    
    updateIndicator();
  } catch (error) {
    console.error('[ERROR] Error in visualizeAudio:', error);
  }
}

// Highlight active speakers
function highlightActiveSpeakers(speakers) {
  // Reset all participant tiles
  const allTiles = participantsContainer.querySelectorAll('[id^="participant-"]');
  allTiles.forEach(tile => {
    tile.classList.remove('border-2', 'border-blue-500');
  });
  
  // Highlight active speakers
  speakers.forEach(speaker => {
    const tile = document.getElementById(`participant-${speaker.identity}`);
    if (tile) {
      tile.classList.add('border-2', 'border-blue-500');
    }
  });
}

// Update mic button UI
function updateMicButton() {
  if (micEnabled) {
    micIcon.classList.remove('hidden');
    micOffIcon.classList.add('hidden');
    micBtn.classList.remove('bg-red-600');
    micBtn.classList.add('bg-gray-700');
  } else {
    micIcon.classList.add('hidden');
    micOffIcon.classList.remove('hidden');
    micBtn.classList.remove('bg-gray-700');
    micBtn.classList.add('bg-red-600');
  }
}

// Update camera button UI
function updateCameraButton() {
  if (cameraEnabled) {
    cameraIcon.classList.remove('hidden');
    cameraOffIcon.classList.add('hidden');
    cameraBtn.classList.remove('bg-red-600');
    cameraBtn.classList.add('bg-gray-700');
  } else {
    cameraIcon.classList.add('hidden');
    cameraOffIcon.classList.remove('hidden');
    cameraBtn.classList.remove('bg-gray-700');
    cameraBtn.classList.add('bg-red-600');
  }
}

// Update connection quality indicator
function updateConnectionQuality(quality, participant) {
  const qualityIndicator = document.getElementById(`connection-quality-${participant.identity}`);
  if (!qualityIndicator) return;
  
  let qualityClass = '';
  let qualityText = '';
  
  switch (quality) {
    case LivekitClient.ConnectionQuality.Excellent:
      qualityClass = 'text-green-500';
      qualityText = 'Excellent';
      break;
    case LivekitClient.ConnectionQuality.Good:
      qualityClass = 'text-green-400';
      qualityText = 'Good';
      break;
    case LivekitClient.ConnectionQuality.Poor:
      qualityClass = 'text-yellow-500';
      qualityText = 'Poor';
      break;
    default:
      qualityClass = 'text-red-500';
      qualityText = 'Unknown';
  }
  
  qualityIndicator.className = `text-xs ${qualityClass}`;
  qualityIndicator.title = qualityText;
}

// Show toast notification
function showToast(message, duration = 3000) {
  toastMessage.textContent = message;
  toast.classList.remove('hidden');
  
  // Hide after duration
  setTimeout(() => {
    toast.classList.add('hidden');
  }, duration);
}
