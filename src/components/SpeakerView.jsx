import React from 'react';

const SpeakerView = ({ localContainer }) => {
  return (
    <div className="flex items-center justify-center bg-gray-900 flex-1 rounded-lg shadow-lg">
      <div ref={localContainer} className="w-[75%] h-full bg-black flex flex-col justify-center items-center rounded-lg text-white">
        <div className="text-5xl font-bold mb-4">A</div>
        <div className="text-lg">Alice (Speaking)</div>
      </div>
    </div>
  );
};

export default SpeakerView;
