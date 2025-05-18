import React from 'react';
import TopBar from '../components/TopBar';
import SpeakerView from '../components/SpeakerView';
import ParticipantsBar from '../components/ParticipantsBar';
import ControlBar from '../components/ControlBar';
import VideoGrid from '../components/VideoGrid';

const CallRoom = ({ localContainer, remoteContainer, leaveCall }) => {
    return (
        <div className="flex flex-col h-screen bg-gray-900">
            {/* <TopBar /> */}
            <div className="flex flex-1 overflow-hidden">
                <SpeakerView localContainer={localContainer} />
                <VideoGrid remoteContainer={remoteContainer} />
                {/* <ParticipantsBar /> */}
            </div>
            <ControlBar leaveCall={leaveCall} />
        </div>
    );
};

export default CallRoom;
