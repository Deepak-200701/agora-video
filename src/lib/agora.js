import AgoraRTC from 'agora-rtc-sdk-ng';

export const config = {
  appId: import.meta.env.VITE_AGORA_APP_ID,
  defaultChannel: "sdsds",
  token: null, // Use null for testing with the App ID authentication mechanism
  uid: 0, // Set as null for auto-generated uid
};

// Client options
export const clientOptions = {
  mode: 'rtc', // Sets the SDK to RTC mode
  codec: 'vp8', // Sets the video encoder configuration
};

// Create Agora client
export const createClient = () => {
  if (!config.appId) {
    throw new Error('Agora App ID is required!');
  }
  
  return AgoraRTC.createClient(clientOptions);
};

// Create local audio and video tracks
export const createLocalTracks = async () => {
  try {
    const localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack();
    const localVideoTrack = await AgoraRTC.createCameraVideoTrack();
    
    return {
      localAudioTrack,
      localVideoTrack
    }
  } catch (error) {
    console.error('Error creating local tracks:', error);
    throw error;
  }
};
