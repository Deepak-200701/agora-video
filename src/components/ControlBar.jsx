import React from 'react';
import { FaMicrophone, FaVideo, FaPhoneSlash, FaDesktop, FaComments } from 'react-icons/fa';

const ControlBar = ({ leaveCall }) => {
  return (
    <div className="flex justify-center gap-6 bg-gray-800 py-3 shadow-lg">
      {[FaMicrophone, FaVideo, FaDesktop, FaComments].map((Icon, i) => (
        <button
          key={i}
          className="bg-gray-700 hover:bg-gray-600 text-white p-3 rounded-full"
        >
          <Icon />
        </button>
      ))}
      <button className="bg-red-600 hover:bg-red-700 text-white p-3 rounded-full" onClick={leaveCall}>
        <FaPhoneSlash />
      </button>
    </div>
  );
};

export default ControlBar;
