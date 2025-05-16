import React, { useRef, useState } from 'react';
import AgoraRTC from 'agora-rtc-sdk-ng';
import axios from 'axios';

const AGORA_APP_ID = "730f44314cf3422a9f79db66b7d391cf";
const AGORA_CHANNEL = "test";
const TOKEN_SERVER_URL = "http://localhost:5000/api/auth/token"

const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });

const VideoCall = () => {
    const localContainer = useRef(null);
    const remoteContainer = useRef(null);
    const micTrackRef = useRef(null);
    const camTrackRef = useRef(null);

    const [joined, setJoined] = useState(false);

    const uid = Math.floor(Math.random() * 100000);

    // const fetchToken = async () => {
    //     // const res = await fetch(`${TOKEN_SERVER_URL}?channel=${AGORA_CHANNEL}&uid=${uid}`);
    //     const { data } = await axios.post("http://localhost:3000/api/auth/token", {
    //         channelName: AGORA_CHANNEL,
    //     })
    //     return data.token;
    // };

    const fetchToken = async () => {
        const { data } = await axios.post("/api/auth/token", {
            channelName: AGORA_CHANNEL,
        });
        return data.token;
    };


    const joinCall = async () => {
        const token = await fetchToken();

        client.on('user-published', async (user, mediaType) => {
            await client.subscribe(user, mediaType);

            if (mediaType === 'audio') {
                user.audioTrack.play();
            }

            if (mediaType === 'video') {
                remoteContainer.current.innerHTML = '';
                user.videoTrack.play(remoteContainer.current);
            }
        });

        await client.join(AGORA_APP_ID, AGORA_CHANNEL, token, uid);

        // Store tracks in refs
        const [micTrack, camTrack] = await AgoraRTC.createMicrophoneAndCameraTracks();
        micTrackRef.current = micTrack;
        camTrackRef.current = camTrack;

        micTrack.setMuted(false)

        camTrack.play(localContainer.current);
        await client.publish([micTrack, camTrack]);

        setJoined(true);
    };

    const leaveCall = async () => {
        try {
            // Stop and close local tracks
            if (micTrackRef.current) {
                micTrackRef.current.stop();
                micTrackRef.current.close();
                micTrackRef.current = null;
            }

            if (camTrackRef.current) {
                camTrackRef.current.stop();
                camTrackRef.current.close();
                camTrackRef.current = null;
            }

            // Stop and clear remote user tracks
            client.remoteUsers.forEach(user => {
                user.videoTrack?.stop();
                user.audioTrack?.stop();
            });

            // Clear video containers
            localContainer.current.innerHTML = '';
            remoteContainer.current.innerHTML = '';

            await client.leave();
            setJoined(false);
        } catch (err) {
            console.error('Error while leaving call:', err);
        }
    };



    return (
        <div>
            <h2>Agora Video Call</h2>
            {!joined ? (
                <button onClick={joinCall}>Join Call</button>
            ) : (
                <button onClick={leaveCall}>Leave Call</button>
            )}
            <div style={{ display: 'flex', marginTop: '20px' }}>
                <div ref={localContainer} style={{ width: '300px', height: '200px', background: '#000' }} />
                <div ref={remoteContainer} style={{ width: '300px', height: '200px', background: '#000', marginLeft: '20px' }} />
            </div>
        </div>
    );
};

export default VideoCall;