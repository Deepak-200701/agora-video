import React, { useRef, useState, useEffect } from 'react';
import AgoraRTC from 'agora-rtc-sdk-ng';
import axios from 'axios';
import {
    FaMicrophone,
    FaVideo,
    FaVideoSlash,
    FaMicrophoneSlash,
    FaPhoneSlash,
    FaDesktop,
    FaUser
} from 'react-icons/fa';
import { Bounce, toast } from 'react-toastify';

const AGORA_APP_ID = import.meta.env.VITE_AGORA_APP_ID;

const JoinCall = () => {
    const clientRef = useRef(null);
    const localVideoRef = useRef(null);
    const remoteStreamsRef = useRef({});
    const micTrackRef = useRef(null);
    const camTrackRef = useRef(null);
    const screenTrackRef = useRef(null);

    const [channel, setChannel] = useState("");
    const [joined, setJoined] = useState(false);
    const [isMicMuted, setIsMicMuted] = useState(false);
    const [isCamMuted, setIsCamMuted] = useState(false);
    const [isScreenSharing, setIsScreenSharing] = useState(false);
    const [remoteUsers, setRemoteUsers] = useState([]);
    const [activeSpeakerId, setActiveSpeakerId] = useState(null);
    const [localUserId, setLocalUserId] = useState(null);
    const [userVideoTracks, setUserVideoTracks] = useState({});

    // Debounce function to prevent flickering during active speaker changes
    const debounce = (func, delay) => {
        let timerId;
        return (...args) => {
            clearTimeout(timerId);
            timerId = setTimeout(() => func(...args), delay);
        };
    };

    // Setup Agora client
    useEffect(() => {
        const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });

        // Configure volume indicator with lower frequency and higher smoothing
        clientRef.current = client;

        // Handle user publishing streams
        client.on('user-published', async (user, mediaType) => {
            console.log(`User ${user.uid} published ${mediaType} track`);
            await client.subscribe(user, mediaType);

            // Add user to our state if not already there
            setRemoteUsers(prev => {
                if (!prev.some(u => u.uid === user.uid)) {
                    return [...prev, user];
                }
                return prev;
            });

            // Store reference to remote user
            remoteStreamsRef.current[user.uid] = user;

            if (mediaType === 'video' && user.videoTrack) {
                console.log(`Playing video for user ${user.uid}`);
                // Track that this user has video
                setUserVideoTracks(prev => ({
                    ...prev,
                    [user.uid]: true
                }));

                // Play video after a small delay to ensure container exists
                setTimeout(() => {
                    const container = document.getElementById(`remote-video-${user.uid}`);
                    if (container) {
                        container.innerHTML = '';
                        user.videoTrack.play(`remote-video-${user.uid}`);
                    } else {
                        console.warn(`Container for remote-video-${user.uid} not found`);
                    }
                }, 500);
            }

            if (mediaType === 'audio' && user.audioTrack) {
                user.audioTrack.play();
            }
        });

        // Handle user unpublishing streams
        client.on('user-unpublished', (user, mediaType) => {
            if (mediaType === 'audio' && user.audioTrack) {
                user.audioTrack.stop();
            }

            if (mediaType === 'video') {
                // Mark that this user doesn't have video
                setUserVideoTracks(prev => ({
                    ...prev,
                    [user.uid]: false
                }));

                // Show avatar instead of video
                const container = document.getElementById(`remote-video-${user.uid}`);
                if (container) {
                    container.innerHTML = `
                        <div class="flex items-center justify-center w-full h-full bg-gray-700">
                            <div class="p-4 rounded-full bg-gray-500 flex items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                            </div>
                        </div>
                    `;
                }
            }
        });

        // Handle user leaving
        client.on('user-left', (user) => {
            // Remove user from state
            setRemoteUsers(prev => prev.filter(u => u.uid !== user.uid));

            // Clean up reference
            delete remoteStreamsRef.current[user.uid];

            // Remove from video tracks state
            setUserVideoTracks(prev => {
                const newState = { ...prev };
                delete newState[user.uid];
                return newState;
            });

            // Reset active speaker if they left
            if (activeSpeakerId === user.uid) {
                setActiveSpeakerId(null);
            }
        });

        // Debounced active speaker detection to prevent UI flickering
        const debouncedSetActiveSpeaker = debounce((uid) => {
            setActiveSpeakerId(uid);
        }, 800);

        // Handle active speaker detection with threshold
        client.on('volume-indicator', (volumes) => {
            if (volumes.length === 0) return;
            // Only consider volumes above threshold to prevent background noise triggers
            const speakingVolumes = volumes.filter(v => v.level > 5);
            if (speakingVolumes.length === 0) return;

            const loudestSpeaker = speakingVolumes.reduce((prev, curr) =>
                prev.level > curr.level ? prev : curr
            );

            // Only update active speaker if clearly speaking
            if (loudestSpeaker.level > 10) {
                debouncedSetActiveSpeaker(loudestSpeaker.uid);
            }
        });

        return () => {
            client.removeAllListeners();
            leaveCall();
        };
    }, []);

    const fetchToken = async () => {
        const { data } = await axios.post("http://localhost:5000/api/auth/token", {
            channelName: channel,
        });
        return data.token;
    };

    const joinCall = async (e) => {
        e.preventDefault();
        if (!channel.trim()) {
            return toast('Please enter a channel name', {
                position: "bottom-right",
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: false,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
                theme: "light",
                transition: Bounce,
            })
        }

        try {
            const token = await fetchToken();
            const uid = Math.floor(Math.random() * 100000);
            const client = clientRef.current;
            client.enableAudioVolumeIndicator();

            await client.join(AGORA_APP_ID, channel, token, uid);
            setLocalUserId(uid);

            // Create local audio and video tracks with quality settings
            const [micTrack, camTrack] = await AgoraRTC.createMicrophoneAndCameraTracks({
                encoderConfig: {
                    width: { min: 640, ideal: 1280, max: 1920 },
                    height: { min: 480, ideal: 720, max: 1080 },
                    frameRate: 24,
                    bitrateMin: 600,
                    bitrateMax: 1500,
                }
            });

            micTrackRef.current = micTrack;
            camTrackRef.current = camTrack;

            // Mark local user as having video
            setUserVideoTracks(prev => ({
                ...prev,
                [uid]: true
            }));

            // Ensure local video is displayed immediately, even when solo
            setTimeout(() => {
                console.log("Playing local video");
                if (localVideoRef.current) {
                    localVideoRef.current.innerHTML = '';
                    camTrack.play(localVideoRef.current);
                }
            }, 500);

            await client.publish([micTrack, camTrack]);

            // Set yourself as active speaker when you're the only participant
            if (remoteUsers.length === 0) {
                setActiveSpeakerId(uid);
            }

            setJoined(true);
        } catch (error) {
            console.error("Error joining call:", error);
            return toast(error.message || "Unknown error", {
                position: "bottom-right",
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: false,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
                theme: "light",
                transition: Bounce,
            })
        }
    };

    const leaveCall = async () => {
        const client = clientRef.current;
        try {
            // Close all tracks
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

            if (screenTrackRef.current) {
                screenTrackRef.current.stop();
                screenTrackRef.current.close();
                screenTrackRef.current = null;
            }

            await client.leave();
            setJoined(false);
            setActiveSpeakerId(null);
            setRemoteUsers([]);
            setUserVideoTracks({});
            setChannel("");
            setIsCamMuted(false);
            setIsMicMuted(false);
            setIsScreenSharing(false);
            if (localVideoRef.current) localVideoRef.current.innerHTML = '';
        } catch (err) {
            console.error('Error while leaving call:', err);
        }
    };

    const toggleMic = async () => {
        if (micTrackRef.current) {
            const muted = !isMicMuted;
            await micTrackRef.current.setMuted(muted);
            setIsMicMuted(muted);
        }
    };

    const toggleCam = async () => {
        if (camTrackRef.current) {
            const muted = !isCamMuted;
            await camTrackRef.current.setMuted(muted);
            setIsCamMuted(muted);

            // Update local video track status
            if (localUserId) {
                setUserVideoTracks(prev => ({
                    ...prev,
                    [localUserId]: !muted
                }));

                // If camera is muted, show avatar instead
                if (muted && localVideoRef.current) {
                    localVideoRef.current.innerHTML = `
                        <div class="flex items-center justify-center w-full h-full bg-gray-700">
                            <div class="p-4 rounded-full bg-gray-500 flex items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                            </div>
                        </div>
                    `;
                } else if (!muted && camTrackRef.current) {
                    // Re-show camera if unmuted
                    localVideoRef.current.innerHTML = '';
                    camTrackRef.current.play(localVideoRef.current);
                }
            }
        }
    };

    const toggleScreenShare = async () => {
        const client = clientRef.current;

        if (!isScreenSharing) {
            try {
                // Create screen track with higher quality
                const screenTrack = await AgoraRTC.createScreenVideoTrack({
                    encoderConfig: {
                        width: 1920,
                        height: 1080,
                        frameRate: 15,
                        bitrateMax: 2000
                    }
                }, "screen-audio");

                // Store the screen track reference
                screenTrackRef.current = Array.isArray(screenTrack) ? screenTrack[0] : screenTrack;

                // Unpublish camera track before publishing screen
                if (camTrackRef.current) {
                    await client.unpublish(camTrackRef.current);
                }

                // Publish screen track
                await client.publish(screenTrackRef.current);

                // Display screen in local video element
                if (localVideoRef.current) {
                    localVideoRef.current.innerHTML = '';
                    screenTrackRef.current.play(localVideoRef.current);
                }

                setIsScreenSharing(true);

                // Handle screen share end initiated by browser or system UI
                screenTrackRef.current.on('track-ended', async () => {
                    // Stop screen sharing and return to camera
                    await stopScreenSharing();
                });
            } catch (err) {
                console.error("Error starting screen share:", err);
                // toast('Failed to start screen sharing. Please try again.', {
                //     position: "bottom-right",
                //     autoClose: 5000,
                //     theme: "light",
                //     transition: Bounce,
                // });
            }
        } else {
            await stopScreenSharing();
        }
    };

    // Separated function to stop screen sharing and switch back to camera
    const stopScreenSharing = async () => {
        const client = clientRef.current;
        try {
            if (screenTrackRef.current) {
                await client.unpublish(screenTrackRef.current);
                screenTrackRef.current.stop();
                screenTrackRef.current.close();
                screenTrackRef.current = null;
            }

            if (camTrackRef.current) {
                await client.publish(camTrackRef.current);

                if (localVideoRef.current) {
                    localVideoRef.current.innerHTML = '';
                    camTrackRef.current.play(localVideoRef.current);
                }
            }

            setIsScreenSharing(false);
        } catch (err) {
            console.error("Error stopping screen share:", err);
        }
    };

    const getGridCols = (count) => {
        if (count <= 1) return "grid-cols-1";
        if (count === 2) return "grid-cols-2";
        if (count <= 4) return "grid-cols-2";
        if (count <= 6) return "grid-cols-3";
        return "grid-cols-4";
    }


    // Google Meet style layout with main user and side thumbnails
    const renderVideoLayout = () => {
        // Determine which user should be featured in the main display area
        const mainUserId = activeSpeakerId || (remoteUsers.length > 0 ? remoteUsers[0].uid : localUserId);
        const isLocalUserMainDisplay = mainUserId === localUserId;

        // Create a list of users to display as thumbnails (everyone except main user)
        const thumbnailUsers = [
            ...remoteUsers.filter(user => user.uid !== mainUserId),
            ...(isLocalUserMainDisplay ? [] : [{ uid: localUserId, isLocal: true }])
        ];

        return (
            <div className="flex flex-col w-full h-full">
                {/* Main Video Area - Shows the active speaker or selected user */}
                <div className="flex-1 flex items-center justify-center">
                    <div className={`grid ${getGridCols(remoteUsers.length + 1)} w-full h-full bg-gray-900 flex gap-4 items-center justify-center text-white shadow-lg relative overflow-hidden`}>
                        {/* Local user video */}
                        <div
                            ref={localVideoRef}
                            className={`w-full h-full bg-black ${activeSpeakerId === localUserId ? 'border-2 border-red-500' : ''}`}
                        >
                            {/* If camera is off, this will be filled with the avatar */}
                        </div>

                        {/* Remote users video thumbnails */}
                        {remoteUsers.map((user) => (
                            <div key={user.uid} className="flex flex-col justify-start gap-2 w-full h-full">
                                <div
                                    className={`w-full h-full bg-gray-800 flex items-center justify-center text-white transition-all duration-200 overflow-hidden ${activeSpeakerId === user.uid ? 'border-2 border-red-500' : ''}`}
                                // onClick={() => setActiveSpeakerId(user.uid)}
                                >
                                    <div
                                        id={`remote-video-${user.uid}`}
                                        className="w-full h-full bg-black"
                                    >
                                        {!userVideoTracks[user.uid] && (
                                            <div className="flex items-center justify-center w-full h-full bg-gray-700">
                                                <div className="p-4 rounded-full bg-gray-500 flex items-center justify-center">
                                                    <FaUser className="text-white text-2xl" />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <>
            {joined ? (
                <div className="flex flex-col h-screen bg-gray-900">
                    {/* Video Area */}
                    <div className="flex-1 p-2 overflow-y-scroll">
                        {renderVideoLayout()}
                    </div>

                    {/* Call Stats */}
                    <div className="bg-gray-800 py-2 px-4 text-white text-sm flex justify-between items-center">
                        <div>
                            Channel: <span className="font-semibold">{channel}</span>
                        </div>
                        <div>
                            {remoteUsers.length + 1} participants
                        </div>
                    </div>

                    {/* Controls */}
                    <div className="flex justify-center gap-4 bg-gray-800 py-4 border-t border-gray-700">
                        <button
                            onClick={toggleMic}
                            className={`p-4 rounded-full ${isMicMuted ? 'bg-red-600' : 'bg-gray-700 hover:bg-gray-600'} text-white transition-colors duration-200`}
                            title={isMicMuted ? "Unmute Microphone" : "Mute Microphone"}
                        >
                            {isMicMuted ? <FaMicrophoneSlash /> : <FaMicrophone />}
                        </button>

                        <button
                            onClick={toggleCam}
                            className={`p-4 rounded-full ${isCamMuted ? 'bg-red-600' : 'bg-gray-700 hover:bg-gray-600'} text-white transition-colors duration-200`}
                            title={isCamMuted ? "Turn On Camera" : "Turn Off Camera"}
                        >
                            {isCamMuted ? <FaVideoSlash /> : <FaVideo />}
                        </button>

                        <button
                            onClick={toggleScreenShare}
                            className={`p-4 rounded-full ${isScreenSharing ? 'bg-yellow-500' : 'bg-gray-700 hover:bg-gray-600'} text-white transition-colors duration-200`}
                            title={isScreenSharing ? "Stop Screen Sharing" : "Share Screen"}
                        >
                            <FaDesktop />
                        </button>

                        <button
                            onClick={leaveCall}
                            className="p-4 rounded-full bg-red-600 hover:bg-red-700 text-white transition-colors duration-200"
                            title="Leave Call"
                        >
                            <FaPhoneSlash />
                        </button>
                    </div>
                </div>
            ) : (
                <div className="flex items-center justify-center min-h-screen flex-col px-6 py-12 bg-gray-100">
                    <div className="sm:mx-auto sm:w-full sm:max-w-sm">
                        <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
                            Join Video Call
                        </h2>
                        <p className="mt-2 text-center text-sm text-gray-600">
                            Enter a channel name to start or join a meeting
                        </p>
                    </div>

                    <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-sm">
                        <form onSubmit={joinCall} className="space-y-6">
                            <div>
                                <label htmlFor="channel" className="block text-sm font-medium text-gray-900">
                                    Channel Name
                                </label>
                                <div className="mt-2">
                                    <input
                                        id="channel"
                                        name="channel"
                                        type="text"
                                        value={channel}
                                        onChange={(e) => setChannel(e.target.value)}
                                        className="block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                        placeholder="Enter channel name"
                                    />
                                </div>
                            </div>
                            <div>
                                <button
                                    type="submit"
                                    className="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors duration-200"
                                >
                                    Join Call
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
};

export default JoinCall;