import React from 'react';

const VideoTile = ({ isLocal = false, name = 'User', remoteContainer }) => {
  return (
    <div ref={remoteContainer} className="relative bg-gray-800 text-white rounded-lg h-32 flex items-center justify-center shadow-md">
    </div>
  );
};

export default VideoTile;
