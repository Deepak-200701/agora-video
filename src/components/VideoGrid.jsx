import React from 'react';
import VideoTile from './VideoTile';

const dummyUsers = [
  { id: 1, name: 'You', isLocal: true },
  { id: 2, name: 'Alice' },
  { id: 3, name: 'Bob' },
];

const VideoGrid = ({ remoteContainer }) => {
  return (
    <div className="grid grid-cols-1 gap-4 p-4 w-[250px]">
      {dummyUsers.map(user => (
        <VideoTile
          key={user.id}
          name={user.name}
          isLocal={user.isLocal}
          remoteContainer={remoteContainer} // Replace with real stream later
        />
      ))}
    </div>
  );
};

export default VideoGrid;
