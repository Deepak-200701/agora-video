import AgoraRTC from 'agora-rtc-sdk-ng';
import { config, createClient } from '../lib/agora';
import axios from 'axios';

// Create and initialize Agora client
const client = createClient();

export const agoraService = {
  // Initialize the client
  init: async () => {
    if (!config.appId) {
      throw new Error('Agora App ID is required!');
    }

    // Set log level (optional)
    AgoraRTC.setLogLevel(1); // Information level logging

    return client;
  },

  fetchToken: async (channel) => {
    // const res = await fetch(`${TOKEN_SERVER_URL}?channel=${AGORA_CHANNEL}&uid=${uid}`);
    const { data } = await axios.post("http://localhost:5000/api/auth/token", {
      channelName: channel,
    })
    return data.token;
  },

  // Join a channel
  join: async (channelName, token = null) => {
    try {
      if (!channelName) {
        throw new Error('Channel name is required!');
      }

      // Use the App ID security mechanism or token-based security mechanism
      const appId = config.appId;
      let uid = Math.floor(Math.random() * 100000);

      // Join the channel
      uid = await client.join(appId, channelName, token, uid);

      // Create and publish local audio and video tracks
      // const [microphoneTrack, cameraTrack] = await AgoraRTC.createMicrophoneAndCameraTracks();
      const localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack();
      const localVideoTrack = await AgoraRTC.createCameraVideoTrack();

      // Publish local tracks
      await client.publish([localAudioTrack, localVideoTrack]);

      return {
        client,
        localAudioTrack,
        localVideoTrack,
        uid,
      };
    } catch (error) {
      console.error('Error joining channel:', error);
      throw error;
    }
  },

  // Leave the channel
  leave: async () => {
    try {
      // Get all local tracks
      const localTracks = client.localTracks;

      // Stop and close all local tracks
      for (const track of localTracks) {
        track.stop();
        track.close();
      }

      // Leave the channel
      await client.leave();

      return true;
    } catch (error) {
      console.error('Error leaving channel:', error);
      throw error;
    }
  },

  // Toggle camera
  toggleCamera: async (localVideoTrack, isEnabled) => {
    if (!localVideoTrack) return false;

    try {
      if (isEnabled) {
        await localVideoTrack.setEnabled(false);
      } else {
        await localVideoTrack.setEnabled(true);
      }
      return !isEnabled;
    } catch (error) {
      console.error('Error toggling camera:', error);
      throw error;
    }
  },

  // Toggle microphone
  toggleMicrophone: async (localAudioTrack, isEnabled) => {
    if (!localAudioTrack) return false;

    try {
      if (isEnabled) {
        await localAudioTrack.setEnabled(false);
      } else {
        await localAudioTrack.setEnabled(true);
      }
      return !isEnabled;
    } catch (error) {
      console.error('Error toggling microphone:', error);
      throw error;
    }
  },

  // Get client instance
  getClient: () => client,
};