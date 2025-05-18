// import React, { useRef, useState, useEffect } from 'react';
// import AgoraRTC from 'agora-rtc-sdk-ng';
// import axios from 'axios';
// import {
//     FaMicrophone,
//     FaVideo,
//     FaVideoSlash,
//     FaMicrophoneSlash,
//     FaPhoneSlash,
//     FaDesktop,
//     FaComments
// } from 'react-icons/fa';

// const AGORA_APP_ID = "730f44314cf3422a9f79db66b7d391cf";

// const JoinCall = () => {
//     const clientRef = useRef(null);
//     const localContainer = useRef(null);
//     const remoteContainer = useRef(null);
//     const micTrackRef = useRef(null);
//     const camTrackRef = useRef(null);
//     const screenTrackRef = useRef(null);

//     const [channel, setChannel] = useState("");
//     const [joined, setJoined] = useState(false);
//     const [isMicMuted, setIsMicMuted] = useState(false);
//     const [isCamMuted, setIsCamMuted] = useState(false);
//     const [isScreenSharing, setIsScreenSharing] = useState(false);

//     useEffect(() => {
//         clientRef.current = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });

//         const client = clientRef.current;

//         // Remote user joins and publishes
//         client.on('user-published', async (user, mediaType) => {
//             await client.subscribe(user, mediaType);

//             if (mediaType === 'video' && remoteContainer.current) {
//                 remoteContainer.current.innerHTML = '';
//                 user.videoTrack?.play(remoteContainer.current);
//             }

//             if (mediaType === 'audio') {
//                 user.audioTrack?.play();
//             }
//         });

//         // Remote user stops publishing
//         client.on('user-unpublished', (user, mediaType) => {
//             if (mediaType === 'video' && remoteContainer.current) {
//                 remoteContainer.current.innerHTML = '';
//             }

//             if (mediaType === 'audio') {
//                 user.audioTrack?.stop();
//             }
//         });

//         // Remote user leaves the call
//         client.on('user-left', (user) => {
//             if (remoteContainer.current) {
//                 remoteContainer.current.innerHTML = '';
//             }
//         });

//         return () => {
//             client.removeAllListeners();
//             leaveCall(); // Clean up if component unmounts
//         };
//     }, []);

//     const fetchToken = async () => {
//         const { data } = await axios.post("http://localhost:5000/api/auth/token", {
//             channelName: channel,
//         });
//         return data.token;
//     };

//     const joinCall = async (e) => {
//         e.preventDefault();

//         if (!channel.trim()) {
//             alert("Please enter a channel name.");
//             return;
//         }

//         try {
//             const token = await fetchToken();
//             const uid = Math.floor(Math.random() * 100000);
//             const client = clientRef.current;

//             await client.join(AGORA_APP_ID, channel, token, uid);

//             const [micTrack, camTrack] = await AgoraRTC.createMicrophoneAndCameraTracks();
//             micTrackRef.current = micTrack;
//             camTrackRef.current = camTrack;

//             micTrack.setMuted(false);

//             if (localContainer.current) {
//                 camTrack.play(localContainer.current);
//             }

//             await client.publish([micTrack, camTrack]);

//             setJoined(true);
//         } catch (error) {
//             console.error("Error joining call:", error);
//             alert("Failed to join call. See console for details.");
//         }
//     };

//     const leaveCall = async () => {
//         const client = clientRef.current;
//         try {
//             if (micTrackRef.current) {
//                 micTrackRef.current.stop();
//                 micTrackRef.current.close();
//                 micTrackRef.current = null;
//             }

//             if (camTrackRef.current) {
//                 camTrackRef.current.stop();
//                 camTrackRef.current.close();
//                 camTrackRef.current = null;
//             }

//             client.remoteUsers.forEach(user => {
//                 user.videoTrack?.stop();
//                 user.audioTrack?.stop();
//             });

//             if (localContainer.current) localContainer.current.innerHTML = '';
//             if (remoteContainer.current) remoteContainer.current.innerHTML = '';

//             await client.leave();
//             setJoined(false);
//         } catch (err) {
//             console.error('Error while leaving call:', err);
//         }
//     };

//     const toggleMic = async () => {
//         if (micTrackRef.current) {
//             const muted = !isMicMuted;
//             await micTrackRef.current.setMuted(muted);
//             setIsMicMuted(muted);
//         }
//     };

//     const toggleCam = async () => {
//         if (camTrackRef.current) {
//             const muted = !isCamMuted;
//             await camTrackRef.current.setMuted(muted);
//             setIsCamMuted(muted);
//         }
//     };


//     const toggleScreenShare = async () => {
//         const client = clientRef.current;

//         if (!isScreenSharing) {
//             // Start screen share
//             try {
//                 const screenTrack = await AgoraRTC.createScreenVideoTrack();
//                 screenTrackRef.current = screenTrack;

//                 if (camTrackRef.current) {
//                     await client.unpublish(camTrackRef.current);
//                     camTrackRef.current.stop();
//                     localContainer.current.innerHTML = '';
//                 }

//                 await client.publish(screenTrack);
//                 screenTrack.play(localContainer.current);

//                 setIsScreenSharing(true);

//                 screenTrack.on('track-ended', () => {
//                     toggleScreenShare(); // auto-stop when user ends sharing
//                 });
//             } catch (err) {
//                 console.error("Error starting screen share:", err);
//             }
//         } else {
//             // Stop screen share
//             try {
//                 if (screenTrackRef.current) {
//                     await client.unpublish(screenTrackRef.current);
//                     screenTrackRef.current.stop();
//                     screenTrackRef.current.close();
//                     screenTrackRef.current = null;
//                 }

//                 // Re-enable camera
//                 if (camTrackRef.current) {
//                     await client.publish(camTrackRef.current);
//                     camTrackRef.current.play(localContainer.current);
//                 }

//                 setIsScreenSharing(false);
//             } catch (err) {
//                 console.error("Error stopping screen share:", err);
//             }
//         }
//     };

//     return (
//         <>
//             <div className="flex flex-col h-screen bg-gray-900">
//                 {/* Video Area */}
//                 <div className="flex flex-1 overflow-hidden">
//                     {/* Local Video */}
//                     <div className="flex items-center justify-center bg-gray-900 flex-1">
//                         <div
//                             ref={localContainer}
//                             className="w-[75%] h-full bg-black flex justify-center items-center rounded-lg text-white"
//                         />
//                     </div>

//                     {/* Remote Video */}
//                     <div className="flex items-center justify-center bg-gray-900 flex-1">
//                         <div
//                             ref={remoteContainer}
//                             className="w-[75%] h-full bg-black flex justify-center items-center rounded-lg text-white"
//                         />
//                     </div>
//                 </div>

//                 {/* Controls */}

//                 {/* Controls */}
//                 <div className="flex justify-center gap-6 bg-gray-800 py-3">
//                     <button
//                         onClick={toggleMic}
//                         className={`p-3 rounded-full ${isMicMuted ? 'bg-red-500' : 'bg-gray-700 hover:bg-gray-600'} text-white`}
//                     >
//                         {isMicMuted ? <FaMicrophoneSlash /> : <FaMicrophone />}
//                     </button>

//                     <button
//                         onClick={toggleCam}
//                         className={`p-3 rounded-full ${isCamMuted ? 'bg-red-500' : 'bg-gray-700 hover:bg-gray-600'} text-white`}
//                     >
//                         {isCamMuted ? <FaVideoSlash /> : <FaVideo />}
//                     </button>

//                     <button
//                         onClick={toggleScreenShare}
//                         className={`p-3 rounded-full ${isScreenSharing ? 'bg-yellow-600' : 'bg-gray-700 hover:bg-gray-600'} text-white`}
//                         title={isScreenSharing ? "Stop Sharing" : "Share Screen"}
//                     >
//                         <FaDesktop />
//                     </button>

//                     {/* <button
//                         className="bg-gray-700 hover:bg-gray-600 text-white p-3 rounded-full"
//                     >
//                         <FaComments />
//                     </button> */}

//                     <button
//                         onClick={leaveCall}
//                         className="bg-red-600 hover:bg-red-700 text-white p-3 rounded-full"
//                     >
//                         <FaPhoneSlash />
//                     </button>
//                 </div>
//             </div>

//             {/* Join Form */}
//             {!joined && (
//                 <div className="flex min-h-full flex-col justify-center px-6 py-12 lg:px-8 bg-white">
//                     <div className="sm:mx-auto sm:w-full sm:max-w-sm">
//                         <h2 className="mt-10 text-center text-2xl font-bold tracking-tight text-gray-900">
//                             Join Call
//                         </h2>
//                     </div>

//                     <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
//                         <form onSubmit={joinCall} className="space-y-6">
//                             <div>
//                                 <label htmlFor="channel" className="block text-sm font-medium text-gray-900">
//                                     Channel Name
//                                 </label>
//                                 <div className="mt-2">
//                                     <input
//                                         id="channel"
//                                         name="channel"
//                                         type="text"
//                                         value={channel}
//                                         onChange={(e) => setChannel(e.target.value)}
//                                         required
//                                         className="block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
//                                     />
//                                 </div>
//                             </div>

//                             <div>
//                                 <button
//                                     type="submit"
//                                     className="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
//                                 >
//                                     Join
//                                 </button>
//                             </div>
//                         </form>
//                     </div>
//                 </div>
//             )}
//         </>
//     );
// };

// export default JoinCall;


// import React, { useRef, useState, useEffect } from 'react';
// import AgoraRTC from 'agora-rtc-sdk-ng';
// import axios from 'axios';
// import {
//     FaMicrophone,
//     FaVideo,
//     FaVideoSlash,
//     FaMicrophoneSlash,
//     FaPhoneSlash,
//     FaDesktop,
// } from 'react-icons/fa';

// const AGORA_APP_ID = "730f44314cf3422a9f79db66b7d391cf";

// const JoinCall = () => {
//     const clientRef = useRef(null);
//     const localContainer = useRef(null);
//     const micTrackRef = useRef(null);
//     const camTrackRef = useRef(null);
//     const screenTrackRef = useRef(null);

//     const [channel, setChannel] = useState("");
//     const [joined, setJoined] = useState(false);
//     const [isMicMuted, setIsMicMuted] = useState(false);
//     const [isCamMuted, setIsCamMuted] = useState(false);
//     const [isScreenSharing, setIsScreenSharing] = useState(false);
//     const [remoteUsers, setRemoteUsers] = useState([]);

//     useEffect(() => {
//         const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
//         clientRef.current = client;

//         client.on('user-published', async (user, mediaType) => {
//             await client.subscribe(user, mediaType);
//             setRemoteUsers(prev => {
//                 const alreadyExists = prev.some(u => u.uid === user.uid);
//                 return alreadyExists ? prev : [...prev, user];
//             });

//             if (mediaType === 'audio') {
//                 user.audioTrack?.play();
//             }

//             if (mediaType === 'video' && user.videoTrack) {
//                 // Create a div container for the remote user's video if it doesn't exist
//                 const remoteVideoContainer = document.createElement('div');
//                 remoteVideoContainer.id = `remote-user-${user.uid}`;
//                 remoteVideoContainer.classList.add('w-[300px]', 'h-[200px]', 'bg-black', 'rounded-lg', 'flex', 'items-center', 'justify-center', 'text-white');
//                 document.getElementById('remote-users-container').appendChild(remoteVideoContainer);
//                 user.videoTrack.play(remoteVideoContainer);
//             }
//         });

//         client.on('user-unpublished', (user, mediaType) => {
//             if (mediaType === 'audio') {
//                 user.audioTrack?.stop();
//             }

//             if (mediaType === 'video') {
//                 const remoteVideoContainer = document.getElementById(`remote-user-${user.uid}`);
//                 if (remoteVideoContainer) {
//                     // Clear the video track from the container but keep the container
//                     remoteVideoContainer.innerHTML = 'User Disconnected';
//                 }
//             }
//         });

//         client.on('user-left', (user) => {
//             setRemoteUsers(prev => prev.filter(u => u.uid !== user.uid));

//             const remoteVideoContainer = document.getElementById(`remote-user-${user.uid}`);
//             if (remoteVideoContainer) {
//                 // Stop the video track and clear the container content, but keep the container
//                 const videoTrack = user.videoTrack;
//                 if (videoTrack) {
//                     videoTrack.stop();
//                     remoteVideoContainer.innerHTML = 'User Disconnected';  // Add message or image if you want
//                 }
//             }
//         });

//         return () => {
//             client.removeAllListeners();
//             leaveCall();
//         };
//     }, []);

//     const fetchToken = async () => {
//         const { data } = await axios.post("http://localhost:5000/api/auth/token", {
//             channelName: channel,
//         });
//         return data.token;
//     };

//     const joinCall = async (e) => {
//         e.preventDefault();
//         if (!channel.trim()) {
//             alert("Please enter a channel name.");
//             return;
//         }

//         try {
//             const token = await fetchToken();
//             const uid = Math.floor(Math.random() * 100000);
//             const client = clientRef.current;

//             await client.join(AGORA_APP_ID, channel, token, uid);

//             const [micTrack, camTrack] = await AgoraRTC.createMicrophoneAndCameraTracks();
//             micTrackRef.current = micTrack;
//             camTrackRef.current = camTrack;

//             micTrack.setMuted(false);

//             if (localContainer.current) {
//                 camTrack.play(localContainer.current);
//             }

//             await client.publish([micTrack, camTrack]);
//             setJoined(true);
//         } catch (error) {
//             console.error("Error joining call:", error);
//             alert("Failed to join call. See console for details.");
//         }
//     };

//     const leaveCall = async () => {
//         const client = clientRef.current;
//         try {
//             if (micTrackRef.current) {
//                 micTrackRef.current.stop();
//                 micTrackRef.current.close();
//                 micTrackRef.current = null;
//             }

//             if (camTrackRef.current) {
//                 camTrackRef.current.stop();
//                 camTrackRef.current.close();
//                 camTrackRef.current = null;
//             }

//             if (screenTrackRef.current) {
//                 screenTrackRef.current.stop();
//                 screenTrackRef.current.close();
//                 screenTrackRef.current = null;
//             }

//             await client.leave();
//             setRemoteUsers([]);
//             if (localContainer.current) localContainer.current.innerHTML = '';
//             setJoined(false);
//         } catch (err) {
//             console.error('Error while leaving call:', err);
//         }
//     };

//     const toggleMic = async () => {
//         if (micTrackRef.current) {
//             const muted = !isMicMuted;
//             await micTrackRef.current.setMuted(muted);
//             setIsMicMuted(muted);
//         }
//     };

//     const toggleCam = async () => {
//         if (camTrackRef.current) {
//             const muted = !isCamMuted;
//             await camTrackRef.current.setMuted(muted);
//             setIsCamMuted(muted);
//         }
//     };

//     const toggleScreenShare = async () => {
//         const client = clientRef.current;

//         if (!isScreenSharing) {
//             try {
//                 const screenTrack = await AgoraRTC.createScreenVideoTrack();
//                 screenTrackRef.current = screenTrack;

//                 if (camTrackRef.current) {
//                     await client.unpublish(camTrackRef.current);
//                     camTrackRef.current.stop();
//                     localContainer.current.innerHTML = '';
//                 }

//                 await client.publish(screenTrack);
//                 screenTrack.play(localContainer.current);

//                 setIsScreenSharing(true);

//                 screenTrack.on('track-ended', () => {
//                     toggleScreenShare();
//                 });
//             } catch (err) {
//                 console.error("Error starting screen share:", err);
//             }
//         } else {
//             try {
//                 if (screenTrackRef.current) {
//                     await client.unpublish(screenTrackRef.current);
//                     screenTrackRef.current.stop();
//                     screenTrackRef.current.close();
//                     screenTrackRef.current = null;
//                 }

//                 if (camTrackRef.current) {
//                     await client.publish(camTrackRef.current);
//                     camTrackRef.current.play(localContainer.current);
//                 }

//                 setIsScreenSharing(false);
//             } catch (err) {
//                 console.error("Error stopping screen share:", err);
//             }
//         }
//     };

//     return (
//         <>
//             <div className="flex flex-col h-screen bg-gray-900">
//                 {/* Video Area */}
//                 <div className="flex-1 flex flex-col gap-2 overflow-auto p-4">
//                     <p className="text-white text-lg mb-2">Remote Users: {remoteUsers.length}</p>

//                     <div className="flex flex-wrap justify-center gap-4">
//                         <div
//                             ref={localContainer}
//                             className="w-[300px] h-[200px] bg-black rounded-lg flex items-center justify-center text-white"
//                         >
//                             Local User
//                         </div>

//                         {/* Remote users container */}
//                         <div id="remote-users-container" className="flex flex-wrap justify-center gap-4">
//                             {/* Remote user video will be inserted dynamically */}
//                         </div>
//                     </div>
//                 </div>

//                 {/* Controls */}
//                 <div className="flex justify-center gap-6 bg-gray-800 py-3">
//                     <button
//                         onClick={toggleMic}
//                         className={`p-3 rounded-full ${isMicMuted ? 'bg-red-500' : 'bg-gray-700 hover:bg-gray-600'} text-white`}
//                     >
//                         {isMicMuted ? <FaMicrophoneSlash /> : <FaMicrophone />}
//                     </button>

//                     <button
//                         onClick={toggleCam}
//                         className={`p-3 rounded-full ${isCamMuted ? 'bg-red-500' : 'bg-gray-700 hover:bg-gray-600'} text-white`}
//                     >
//                         {isCamMuted ? <FaVideoSlash /> : <FaVideo />}
//                     </button>

//                     <button
//                         onClick={toggleScreenShare}
//                         className={`p-3 rounded-full ${isScreenSharing ? 'bg-yellow-600' : 'bg-gray-700 hover:bg-gray-600'} text-white`}
//                         title={isScreenSharing ? "Stop Sharing" : "Share Screen"}
//                     >
//                         <FaDesktop />
//                     </button>

//                     <button
//                         onClick={leaveCall}
//                         className="bg-red-600 hover:bg-red-700 text-white p-3 rounded-full"
//                     >
//                         <FaPhoneSlash />
//                     </button>
//                 </div>
//             </div>

//             {/* Join Form */}
//             {!joined && (
//                 <div className="flex min-h-full flex-col justify-center px-6 py-12 lg:px-8 bg-white">
//                     <div className="sm:mx-auto sm:w-full sm:max-w-sm">
//                         <h2 className="mt-10 text-center text-2xl font-bold tracking-tight text-gray-900">
//                             Join Call
//                         </h2>
//                     </div>

//                     <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
//                         <form onSubmit={joinCall} className="space-y-6">
//                             <div>
//                                 <label htmlFor="channel" className="block text-sm font-medium text-gray-900">
//                                     Channel Name
//                                 </label>
//                                 <div className="mt-2">
//                                     <input
//                                         id="channel"
//                                         name="channel"
//                                         type="text"
//                                         value={channel}
//                                         onChange={(e) => setChannel(e.target.value)}
//                                         required
//                                         className="block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
//                                     />
//                                 </div>
//                             </div>

//                             <div>
//                                 <button
//                                     type="submit"
//                                     className="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
//                                 >
//                                     Join
//                                 </button>
//                             </div>
//                         </form>
//                     </div>
//                 </div>
//             )}
//         </>
//     );
// };

// export default JoinCall;


// import React, { useRef, useState, useEffect } from 'react';
// import AgoraRTC from 'agora-rtc-sdk-ng';
// import axios from 'axios';
// import {
//     FaMicrophone,
//     FaVideo,
//     FaVideoSlash,
//     FaMicrophoneSlash,
//     FaPhoneSlash,
//     FaDesktop,
// } from 'react-icons/fa';

// const AGORA_APP_ID = "730f44314cf3422a9f79db66b7d391cf";

// const JoinCall = () => {
//     const clientRef = useRef(null);
//     const localContainer = useRef(null);
//     const remoteContainerRef = useRef({});
//     const micTrackRef = useRef(null);
//     const camTrackRef = useRef(null);
//     const screenTrackRef = useRef(null);

//     const [channel, setChannel] = useState("");
//     const [joined, setJoined] = useState(false);
//     const [isMicMuted, setIsMicMuted] = useState(false);
//     const [isCamMuted, setIsCamMuted] = useState(false);
//     const [isScreenSharing, setIsScreenSharing] = useState(false);
//     const [activeSpeaker, setActiveSpeaker] = useState(null); // Track the active speaker

//     useEffect(() => {
//         const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
//         clientRef.current = client;

//         client.on('user-published', async (user, mediaType) => {
//             await client.subscribe(user, mediaType);

//             // Handle remote user video
//             if (mediaType === 'video' && user.videoTrack) {
//                 const remoteVideoContainer = document.createElement('div');
//                 remoteVideoContainer.id = `remote-user-${user.uid}`;
//                 remoteVideoContainer.classList.add('w-[200px]', 'h-[150px]', 'bg-black', 'rounded-lg', 'flex', 'items-center', 'justify-center', 'text-white');
//                 document.getElementById('remote-users-container').appendChild(remoteVideoContainer);
//                 user.videoTrack.play(remoteVideoContainer);

//                 // Store remote user reference for layout
//                 remoteContainerRef.current[user.uid] = remoteVideoContainer;
//             }

//             if (mediaType === 'audio') {
//                 user.audioTrack?.play();
//             }
//         });

//         client.on('user-unpublished', (user, mediaType) => {
//             if (mediaType === 'audio') {
//                 user.audioTrack?.stop();
//             }

//             if (mediaType === 'video') {
//                 const remoteVideoContainer = document.getElementById(`remote-user-${user.uid}`);
//                 if (remoteVideoContainer) {
//                     remoteVideoContainer.innerHTML = 'User Disconnected';
//                 }
//             }
//         });

//         client.on('user-left', (user) => {
//             // Clean up when user leaves
//             const remoteVideoContainer = document.getElementById(`remote-user-${user.uid}`);
//             if (remoteVideoContainer) {
//                 remoteVideoContainer.innerHTML = 'User Left';
//                 delete remoteContainerRef.current[user.uid];
//             }
//         });

//         // Detect active speaker
//         client.on('active-speaker', (speakers) => {
//             if (speakers.length > 0) {
//                 const speaker = speakers[0];
//                 setActiveSpeaker(speaker.uid);

//                 // Adjust the layout: make active speaker larger
//                 if (remoteContainerRef.current[speaker.uid]) {
//                     remoteContainerRef.current[speaker.uid].style.transform = 'scale(1.5)';
//                     remoteContainerRef.current[speaker.uid].style.zIndex = 10;
//                 }

//                 // Reset layout for other users
//                 Object.keys(remoteContainerRef.current).forEach(uid => {
//                     if (uid !== speaker.uid) {
//                         remoteContainerRef.current[uid].style.transform = 'scale(1)';
//                         remoteContainerRef.current[uid].style.zIndex = 1;
//                     }
//                 });
//             }
//         });

//         return () => {
//             client.removeAllListeners();
//             leaveCall();
//         };
//     }, []);

//     const fetchToken = async () => {
//         const { data } = await axios.post("http://localhost:5000/api/auth/token", {
//             channelName: channel,
//         });
//         return data.token;
//     };

//     const joinCall = async (e) => {
//         e.preventDefault();
//         if (!channel.trim()) {
//             alert("Please enter a channel name.");
//             return;
//         }

//         try {
//             const token = await fetchToken();
//             const uid = Math.floor(Math.random() * 100000);
//             const client = clientRef.current;

//             await client.join(AGORA_APP_ID, channel, token, uid);

//             const [micTrack, camTrack] = await AgoraRTC.createMicrophoneAndCameraTracks();
//             micTrackRef.current = micTrack;
//             camTrackRef.current = camTrack;

//             micTrack.setMuted(false);

//             if (localContainer.current) {
//                 camTrack.play(localContainer.current);
//             }

//             await client.publish([micTrack, camTrack]);
//             setJoined(true);
//         } catch (error) {
//             console.error("Error joining call:", error);
//             alert("Failed to join call. See console for details.");
//         }
//     };

//     const leaveCall = async () => {
//         const client = clientRef.current;
//         try {
//             if (micTrackRef.current) {
//                 micTrackRef.current.stop();
//                 micTrackRef.current.close();
//                 micTrackRef.current = null;
//             }

//             if (camTrackRef.current) {
//                 camTrackRef.current.stop();
//                 camTrackRef.current.close();
//                 camTrackRef.current = null;
//             }

//             if (screenTrackRef.current) {
//                 screenTrackRef.current.stop();
//                 screenTrackRef.current.close();
//                 screenTrackRef.current = null;
//             }

//             await client.leave();
//             setJoined(false);
//             setActiveSpeaker(null);
//             if (localContainer.current) localContainer.current.innerHTML = '';
//             document.getElementById('remote-users-container').innerHTML = '';
//         } catch (err) {
//             console.error('Error while leaving call:', err);
//         }
//     };

//     const toggleMic = async () => {
//         if (micTrackRef.current) {
//             const muted = !isMicMuted;
//             await micTrackRef.current.setMuted(muted);
//             setIsMicMuted(muted);
//         }
//     };

//     const toggleCam = async () => {
//         if (camTrackRef.current) {
//             const muted = !isCamMuted;
//             await camTrackRef.current.setMuted(muted);
//             setIsCamMuted(muted);
//         }
//     };

//     const toggleScreenShare = async () => {
//         const client = clientRef.current;

//         if (!isScreenSharing) {
//             try {
//                 const screenTrack = await AgoraRTC.createScreenVideoTrack();
//                 screenTrackRef.current = screenTrack;

//                 if (camTrackRef.current) {
//                     await client.unpublish(camTrackRef.current);
//                     camTrackRef.current.stop();
//                     localContainer.current.innerHTML = '';
//                 }

//                 await client.publish(screenTrack);
//                 screenTrack.play(localContainer.current);

//                 setIsScreenSharing(true);

//                 screenTrack.on('track-ended', () => {
//                     toggleScreenShare();
//                 });
//             } catch (err) {
//                 console.error("Error starting screen share:", err);
//             }
//         } else {
//             try {
//                 if (screenTrackRef.current) {
//                     await client.unpublish(screenTrackRef.current);
//                     screenTrackRef.current.stop();
//                     screenTrackRef.current.close();
//                     screenTrackRef.current = null;
//                 }

//                 if (camTrackRef.current) {
//                     await client.publish(camTrackRef.current);
//                     camTrackRef.current.play(localContainer.current);
//                 }

//                 setIsScreenSharing(false);
//             } catch (err) {
//                 console.error("Error stopping screen share:", err);
//             }
//         }
//     };

//     return (
//         <>
//             <div className="flex flex-col h-screen bg-gray-900">
//                 {/* Video Area */}
//                 <div className="flex-1 flex flex-col gap-2 overflow-auto p-4">
//                     <p className="text-white text-lg mb-2">Active Speaker: {activeSpeaker}</p>

//                     <div className="flex flex-wrap justify-center gap-4">
//                         <div
//                             ref={localContainer}
//                             className="w-[300px] h-[200px] bg-black rounded-lg flex items-center justify-center text-white"
//                         >
//                             Local User
//                         </div>

//                         {/* Remote users container */}
//                         <div id="remote-users-container" className="flex flex-wrap justify-center gap-4">
//                             {/* Remote video containers will be dynamically injected here */}
//                         </div>
//                     </div>
//                 </div>

//                 {/* Controls */}
//                 <div className="flex justify-center gap-6 bg-gray-800 py-3">
//                     <button
//                         onClick={toggleMic}
//                         className={`p-3 rounded-full ${isMicMuted ? 'bg-red-500' : 'bg-gray-700 hover:bg-gray-600'} text-white`}
//                     >
//                         {isMicMuted ? <FaMicrophoneSlash /> : <FaMicrophone />}
//                     </button>

//                     <button
//                         onClick={toggleCam}
//                         className={`p-3 rounded-full ${isCamMuted ? 'bg-red-500' : 'bg-gray-700 hover:bg-gray-600'} text-white`}
//                     >
//                         {isCamMuted ? <FaVideoSlash /> : <FaVideo />}
//                     </button>

//                     <button
//                         onClick={toggleScreenShare}
//                         className={`p-3 rounded-full ${isScreenSharing ? 'bg-yellow-600' : 'bg-gray-700 hover:bg-gray-600'} text-white`}
//                     >
//                         <FaDesktop />
//                     </button>

//                     <button
//                         onClick={leaveCall}
//                         className="bg-red-600 hover:bg-red-700 text-white p-3 rounded-full"
//                     >
//                         <FaPhoneSlash />
//                     </button>
//                 </div>
//             </div>

//             {/* Join Form */}
//             {!joined && (
//                 <div className="flex min-h-full flex-col justify-center px-6 py-12 lg:px-8 bg-white">
//                     <div className="sm:mx-auto sm:w-full sm:max-w-sm">
//                         <h2 className="mt-10 text-center text-2xl font-bold tracking-tight text-gray-900">
//                             Join Call
//                         </h2>
//                     </div>

//                     <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
//                         <form onSubmit={joinCall} className="space-y-6">
//                             <div>
//                                 <label htmlFor="channel" className="block text-sm font-medium text-gray-900">
//                                     Channel Name
//                                 </label>
//                                 <div className="mt-2">
//                                     <input
//                                         id="channel"
//                                         name="channel"
//                                         type="text"
//                                         value={channel}
//                                         onChange={(e) => setChannel(e.target.value)}
//                                         required
//                                         className="block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
//                                     />
//                                 </div>
//                             </div>

//                             <div>
//                                 <button
//                                     type="submit"
//                                     className="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
//                                 >
//                                     Join
//                                 </button>
//                             </div>
//                         </form>
//                     </div>
//                 </div>
//             )}
//         </>
//     );
// };

// export default JoinCall;

// import React, { useRef, useState, useEffect } from 'react';
// import AgoraRTC from 'agora-rtc-sdk-ng';
// import axios from 'axios';
// import {
//     FaMicrophone,
//     FaVideo,
//     FaVideoSlash,
//     FaMicrophoneSlash,
//     FaPhoneSlash,
//     FaDesktop,
// } from 'react-icons/fa';

// const AGORA_APP_ID = "730f44314cf3422a9f79db66b7d391cf";

// const JoinCall = () => {
//     const clientRef = useRef(null);
//     const localContainer = useRef(null);
//     const remoteContainerRef = useRef({});
//     const micTrackRef = useRef(null);
//     const camTrackRef = useRef(null);
//     const screenTrackRef = useRef(null);

//     const [channel, setChannel] = useState("");
//     const [joined, setJoined] = useState(false);
//     const [isMicMuted, setIsMicMuted] = useState(false);
//     const [isCamMuted, setIsCamMuted] = useState(false);
//     const [isScreenSharing, setIsScreenSharing] = useState(false);
//     const [activeSpeaker, setActiveSpeaker] = useState(null);

//     useEffect(() => {
//         const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
//         clientRef.current = client;

//         client.on('user-published', async (user, mediaType) => {
//             await client.subscribe(user, mediaType);

//             // Handle remote user video
//             if (mediaType === 'video' && user.videoTrack) {
//                 const remoteVideoContainer = document.createElement('div');
//                 remoteVideoContainer.id = `remote-user-${user.uid}`;
//                 remoteVideoContainer.classList.add(
//                     'w-64',
//                     'h-48',
//                     'bg-gray-800',
//                     'rounded-lg',
//                     'flex',
//                     'items-center',
//                     'justify-center',
//                     'text-white',
//                     'transition-transform',
//                     'duration-200'
//                 );
//                 document.getElementById('remote-users-container').appendChild(remoteVideoContainer);
//                 user.videoTrack.play(remoteVideoContainer);

//                 // Store remote user reference for layout
//                 remoteContainerRef.current[user.uid] = remoteVideoContainer;
//             }

//             if (mediaType === 'audio') {
//                 user.audioTrack?.play();
//             }
//         });

//         client.on('user-unpublished', (user, mediaType) => {
//             if (mediaType === 'audio') {
//                 user.audioTrack?.stop();
//             }

//             if (mediaType === 'video') {
//                 const remoteVideoContainer = document.getElementById(`remote-user-${user.uid}`);
//                 if (remoteVideoContainer) {
//                     remoteVideoContainer.innerHTML = 'User Disconnected';
//                 }
//             }
//         });

//         client.on('user-left', (user) => {
//             const remoteVideoContainer = document.getElementById(`remote-user-${user.uid}`);
//             if (remoteVideoContainer) {
//                 remoteVideoContainer.innerHTML = 'User Left';
//                 delete remoteContainerRef.current[user.uid];
//             }
//         });

//         // Detect active speaker
//         client.on('active-speaker', (speakers) => {
//             if (speakers.length > 0) {
//                 const speaker = speakers[0];
//                 setActiveSpeaker(speaker.uid);

//                 // Adjust the layout: make active speaker larger
//                 if (remoteContainerRef.current[speaker.uid]) {
//                     remoteContainerRef.current[speaker.uid].style.transform = 'scale(1.5)';
//                     remoteContainerRef.current[speaker.uid].style.zIndex = 10;
//                 }

//                 // Reset layout for other users
//                 Object.keys(remoteContainerRef.current).forEach(uid => {
//                     if (uid !== speaker.uid) {
//                         remoteContainerRef.current[uid].style.transform = 'scale(1)';
//                         remoteContainerRef.current[uid].style.zIndex = 1;
//                     }
//                 });
//             }
//         });

//         return () => {
//             client.removeAllListeners();
//             leaveCall();
//         };
//     }, []);

//     const fetchToken = async () => {
//         const { data } = await axios.post("http://localhost:5000/api/auth/token", {
//             channelName: channel,
//         });
//         return data.token;
//     };

//     const joinCall = async (e) => {
//         e.preventDefault();
//         if (!channel.trim()) {
//             alert("Please enter a channel name.");
//             return;
//         }

//         try {
//             const token = await fetchToken();
//             const uid = Math.floor(Math.random() * 100000);
//             const client = clientRef.current;

//             await client.join(AGORA_APP_ID, channel, token, uid);

//             const [micTrack, camTrack] = await AgoraRTC.createMicrophoneAndCameraTracks();
//             micTrackRef.current = micTrack;
//             camTrackRef.current = camTrack;

//             micTrack.setMuted(false);

//             if (localContainer.current) {
//                 camTrack.play(localContainer.current);
//             }

//             await client.publish([micTrack, camTrack]);
//             setJoined(true);
//         } catch (error) {
//             console.error("Error joining call:", error);
//             alert("Failed to join call. See console for details.");
//         }
//     };

//     const leaveCall = async () => {
//         const client = clientRef.current;
//         try {
//             if (micTrackRef.current) {
//                 micTrackRef.current.stop();
//                 micTrackRef.current.close();
//                 micTrackRef.current = null;
//             }

//             if (camTrackRef.current) {
//                 camTrackRef.current.stop();
//                 camTrackRef.current.close();
//                 camTrackRef.current = null;
//             }

//             if (screenTrackRef.current) {
//                 screenTrackRef.current.stop();
//                 screenTrackRef.current.close();
//                 screenTrackRef.current = null;
//             }

//             await client.leave();
//             setJoined(false);
//             setActiveSpeaker(null);
//             if (localContainer.current) localContainer.current.innerHTML = '';
//             document.getElementById('remote-users-container').innerHTML = '';
//         } catch (err) {
//             console.error('Error while leaving call:', err);
//         }
//     };

//     const toggleMic = async () => {
//         if (micTrackRef.current) {
//             const muted = !isMicMuted;
//             await micTrackRef.current.setMuted(muted);
//             setIsMicMuted(muted);
//         }
//     };

//     const toggleCam = async () => {
//         if (camTrackRef.current) {
//             const muted = !isCamMuted;
//             await camTrackRef.current.setMuted(muted);
//             setIsCamMuted(muted);
//         }
//     };

//     const toggleScreenShare = async () => {
//         const client = clientRef.current;

//         if (!isScreenSharing) {
//             try {
//                 const screenTrack = await AgoraRTC.createScreenVideoTrack();
//                 screenTrackRef.current = screenTrack;

//                 if (camTrackRef.current) {
//                     await client.unpublish(camTrackRef.current);
//                     camTrackRef.current.stop();
//                     localContainer.current.innerHTML = '';
//                 }

//                 await client.publish(screenTrack);
//                 screenTrack.play(localContainer.current);

//                 setIsScreenSharing(true);

//                 screenTrack.on('track-ended', () => {
//                     toggleScreenShare();
//                 });
//             } catch (err) {
//                 console.error("Error starting screen share:", err);
//             }
//         } else {
//             try {
//                 if (screenTrackRef.current) {
//                     await client.unpublish(screenTrackRef.current);
//                     screenTrackRef.current.stop();
//                     screenTrackRef.current.close();
//                     screenTrackRef.current = null;
//                 }

//                 if (camTrackRef.current) {
//                     await client.publish(camTrackRef.current);
//                     camTrackRef.current.play(localContainer.current);
//                 }

//                 setIsScreenSharing(false);
//             } catch (err) {
//                 console.error("Error stopping screen share:", err);
//             }
//         }
//     };

//     return (
//         <>
//             <div className="flex flex-col h-screen bg-gray-800">
//                 {/* Video Area */}
//                 <div className="flex-1 flex flex-col items-center gap-6 p-4 overflow-auto">
//                     <p className="text-white text-lg mb-4">Active Speaker: {activeSpeaker}</p>

//                     <div className="flex flex-col items-center gap-4">
//                         <div
//                             ref={localContainer}
//                             className="w-96 h-64 bg-gray-900 rounded-lg flex items-center justify-center text-white border-2 border-gray-500 shadow-lg"
//                         >
//                             Local User
//                         </div>

//                         {/* Remote Users Container */}
//                         <div
//                             id="remote-users-container"
//                             className="flex flex-wrap justify-center gap-6 mt-4 max-h-[300px] overflow-y-auto"
//                         >
//                             {/* Remote video containers will be dynamically injected here */}
//                         </div>
//                     </div>
//                 </div>

//                 {/* Controls */}
//                 <div className="flex justify-center gap-8 bg-gray-900 py-4 border-t border-gray-700">
//                     <button
//                         onClick={toggleMic}
//                         className={`p-4 rounded-full ${isMicMuted ? 'bg-red-600' : 'bg-gray-700 hover:bg-gray-600'} text-white`}
//                     >
//                         {isMicMuted ? <FaMicrophoneSlash /> : <FaMicrophone />}
//                     </button>

//                     <button
//                         onClick={toggleCam}
//                         className={`p-4 rounded-full ${isCamMuted ? 'bg-red-600' : 'bg-gray-700 hover:bg-gray-600'} text-white`}
//                     >
//                         {isCamMuted ? <FaVideoSlash /> : <FaVideo />}
//                     </button>

//                     <button
//                         onClick={toggleScreenShare}
//                         className={`p-4 rounded-full ${isScreenSharing ? 'bg-yellow-500' : 'bg-gray-700 hover:bg-gray-600'} text-white`}
//                     >
//                         <FaDesktop />
//                     </button>

//                     <button
//                         onClick={leaveCall}
//                         className="p-4 rounded-full bg-red-600 hover:bg-red-700 text-white"
//                     >
//                         <FaPhoneSlash />
//                     </button>
//                 </div>
//             </div>

//             {/* Join Form */}
//             {!joined && (
//                 <div className="flex items-center justify-center min-h-full flex-col px-6 py-12 bg-white">
//                     <div className="sm:mx-auto sm:w-full sm:max-w-sm">
//                         <h2 className="mt-10 text-center text-3xl font-bold tracking-tight text-gray-900">
//                             Join Call
//                         </h2>
//                     </div>

//                     <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
//                         <form onSubmit={joinCall} className="space-y-6">
//                             <div>
//                                 <label htmlFor="channel" className="block text-sm font-medium text-gray-900">
//                                     Channel Name
//                                 </label>
//                                 <div className="mt-2">
//                                     <input
//                                         id="channel"
//                                         name="channel"
//                                         type="text"
//                                         value={channel}
//                                         onChange={(e) => setChannel(e.target.value)}
//                                         required
//                                         className="block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
//                                     />
//                                 </div>
//                             </div>

//                             <div>
//                                 <button
//                                     type="submit"
//                                     className="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
//                                 >
//                                     Join
//                                 </button>
//                             </div>
//                         </form>
//                     </div>
//                 </div>
//             )}
//         </>
//     );
// };

// export default JoinCall;


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
} from 'react-icons/fa';

const AGORA_APP_ID = "730f44314cf3422a9f79db66b7d391cf";

const JoinCall = () => {
    const clientRef = useRef(null);
    const localContainer = useRef(null);
    const remoteContainerRef = useRef({});
    const micTrackRef = useRef(null);
    const camTrackRef = useRef(null);
    const screenTrackRef = useRef(null);

    const [channel, setChannel] = useState("");
    const [joined, setJoined] = useState(false);
    const [isMicMuted, setIsMicMuted] = useState(false);
    const [isCamMuted, setIsCamMuted] = useState(false);
    const [isScreenSharing, setIsScreenSharing] = useState(false);
    const [activeSpeaker, setActiveSpeaker] = useState(null);

    useEffect(() => {
        const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
        client.enableAudioVolumeIndicator(200, 3, true); // enable volume indication
        clientRef.current = client;

        client.on('user-published', async (user, mediaType) => {
            await client.subscribe(user, mediaType);

            // Handle remote user video
            if (mediaType === 'video' && user.videoTrack) {
                const remoteVideoContainer = document.createElement('div');
                remoteVideoContainer.id = `remote-user-${user.uid}`;
                remoteVideoContainer.classList.add(
                    'w-64',
                    'h-48',
                    'bg-gray-800',
                    'rounded-lg',
                    'flex',
                    'items-center',
                    'justify-center',
                    'text-white',
                    'transition-transform',
                    'duration-200'
                );
                document.getElementById('remote-users-container').appendChild(remoteVideoContainer);
                user.videoTrack.play(remoteVideoContainer);

                // Store remote user reference for layout
                remoteContainerRef.current[user.uid] = remoteVideoContainer;
            }

            if (mediaType === 'audio') {
                user.audioTrack?.play();
            }
        });

        client.on('user-unpublished', (user, mediaType) => {
            if (mediaType === 'audio') {
                user.audioTrack?.stop();
            }

            if (mediaType === 'video') {
                const remoteVideoContainer = document.getElementById(`remote-user-${user.uid}`);
                if (remoteVideoContainer) {
                    remoteVideoContainer.innerHTML = 'User Disconnected';
                }
            }
        });

        // Remove user container when they leave
        client.on('user-left', (user) => {
            const remoteVideoContainer = document.getElementById(`remote-user-${user.uid}`);
            if (remoteVideoContainer) {
                remoteVideoContainer.remove();  // Remove from DOM
                delete remoteContainerRef.current[user.uid];  // Clean up reference
            }
        });

        // Detect active speaker
        client.on('volume-indicator', (volumes) => {
            if (volumes.length > 0) {
                const active = volumes.reduce((prev, current) =>
                    prev.volume > current.volume ? prev : current
                );

                setActiveSpeaker(active.uid);

                // Highlight the active speaker
                Object.keys(remoteContainerRef.current).forEach(uid => {
                    const el = remoteContainerRef.current[uid];
                    if (!el) return;
                    if (uid == active.uid.toString()) {
                        el.style.transform = 'scale(1.25)';
                        el.style.border = '3px solid #00ff88';
                        el.style.zIndex = 10;
                    } else {
                        el.style.transform = 'scale(1)';
                        el.style.border = '1px solid transparent';
                        el.style.zIndex = 1;
                    }
                });
            }
        });


        return () => {
            client.removeAllListeners();
            leaveCall();
        };
    }, []);

    const fetchToken = async () => {
        const { data } = await axios.post("/api/auth/token", {
            channelName: AGORA_CHANNEL,
        });
        return data.token;
    };

    // const fetchToken = async () => {
    //     const { data } = await axios.post("http://localhost:5000/api/auth/token", {
    //         channelName: channel,
    //     });
    //     return data.token;
    // };

    const joinCall = async (e) => {
        e.preventDefault();
        if (!channel.trim()) {
            alert("Please enter a channel name.");
            return;
        }

        try {
            const token = await fetchToken();
            const uid = Math.floor(Math.random() * 100000);
            const client = clientRef.current;

            await client.join(AGORA_APP_ID, channel, token, uid);

            const [micTrack, camTrack] = await AgoraRTC.createMicrophoneAndCameraTracks();
            micTrackRef.current = micTrack;
            camTrackRef.current = camTrack;

            micTrack.setMuted(false);

            if (localContainer.current) {
                camTrack.play(localContainer.current);
            }

            await client.publish([micTrack, camTrack]);
            setJoined(true);
        } catch (error) {
            console.error("Error joining call:", error);
            alert("Failed to join call. See console for details.");
        }
    };

    const leaveCall = async () => {
        const client = clientRef.current;
        try {
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
            setActiveSpeaker(null);
            if (localContainer.current) localContainer.current.innerHTML = '';
            // We don't clean all remote users here, only when they leave
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
        }
    };

    const toggleScreenShare = async () => {
        const client = clientRef.current;

        if (!isScreenSharing) {
            try {
                const screenTrack = await AgoraRTC.createScreenVideoTrack();
                screenTrackRef.current = screenTrack;

                if (camTrackRef.current) {
                    await client.unpublish(camTrackRef.current);
                    camTrackRef.current.stop();
                    localContainer.current.innerHTML = '';
                }

                await client.publish(screenTrack);
                screenTrack.play(localContainer.current);

                setIsScreenSharing(true);

                screenTrack.on('track-ended', () => {
                    toggleScreenShare();
                });
            } catch (err) {
                console.error("Error starting screen share:", err);
            }
        } else {
            try {
                if (screenTrackRef.current) {
                    await client.unpublish(screenTrackRef.current);
                    screenTrackRef.current.stop();
                    screenTrackRef.current.close();
                    screenTrackRef.current = null;
                }

                if (camTrackRef.current) {
                    await client.publish(camTrackRef.current);
                    camTrackRef.current.play(localContainer.current);
                }

                setIsScreenSharing(false);
            } catch (err) {
                console.error("Error stopping screen share:", err);
            }
        }
    };

    return (
        <>
            <div className="flex flex-col h-screen bg-gray-800">
                {/* Video Area */}
                <div className="flex-1 flex flex-col items-center gap-6 p-4 overflow-auto">
                    <p className="text-white text-lg mb-4">Active Speaker: {activeSpeaker}</p>

                    <div className="flex flex-col items-center gap-4">
                        <div
                            ref={localContainer}
                            className="w-96 h-64 bg-gray-900 rounded-lg flex items-center justify-center text-white border-2 border-gray-500 shadow-lg"
                        >
                            Local User
                        </div>

                        {/* Remote Users Container */}
                        <div
                            id="remote-users-container"
                            className="flex flex-wrap justify-center gap-6 mt-4 max-h-[300px] overflow-y-auto"
                        >
                            {/* Remote video containers will be dynamically injected here */}
                        </div>
                    </div>
                </div>

                {/* Controls */}
                <div className="flex justify-center gap-8 bg-gray-900 py-4 border-t border-gray-700">
                    <button
                        onClick={toggleMic}
                        className={`p-4 rounded-full ${isMicMuted ? 'bg-red-600' : 'bg-gray-700 hover:bg-gray-600'} text-white`}
                    >
                        {isMicMuted ? <FaMicrophoneSlash /> : <FaMicrophone />}
                    </button>

                    <button
                        onClick={toggleCam}
                        className={`p-4 rounded-full ${isCamMuted ? 'bg-red-600' : 'bg-gray-700 hover:bg-gray-600'} text-white`}
                    >
                        {isCamMuted ? <FaVideoSlash /> : <FaVideo />}
                    </button>

                    <button
                        onClick={toggleScreenShare}
                        className={`p-4 rounded-full ${isScreenSharing ? 'bg-yellow-500' : 'bg-gray-700 hover:bg-gray-600'} text-white`}
                    >
                        <FaDesktop />
                    </button>

                    <button
                        onClick={leaveCall}
                        className="p-4 rounded-full bg-red-600 hover:bg-red-700 text-white"
                    >
                        <FaPhoneSlash />
                    </button>
                </div>
            </div>

            {/* Join Form */}
            {!joined && (
                <div className="flex items-center justify-center min-h-full flex-col px-6 py-12 bg-white">
                    <div className="sm:mx-auto sm:w-full sm:max-w-sm">
                        <h2 className="mt-10 text-center text-3xl font-bold tracking-tight text-gray-900">
                            Join Call
                        </h2>
                    </div>

                    <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
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
                                        required
                                        className="block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                    />

                                </div>
                            </div>
                            <div>
                                <button
                                    type="submit"
                                    className="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                >
                                    Join
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );

}

export default JoinCall


