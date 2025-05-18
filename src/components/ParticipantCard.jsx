import React from 'react';

const colors = [
  'bg-red-500', 'bg-blue-500', 'bg-green-500',
  'bg-yellow-500', 'bg-purple-500', 'bg-pink-500',
];

const ParticipantCard = ({ name, index }) => {
  const color = colors[index % colors.length];
  const initial = name.charAt(0).toUpperCase();

  return (
    <div className="flex items-center gap-3 bg-gray-800 p-2 rounded-lg shadow text-white">
      <div className={`w-10 h-10 ${color} rounded-full flex items-center justify-center font-bold`}>
        {initial}
      </div>
      <span className="text-sm">{name}</span>
    </div>
  );
};

export default ParticipantCard;
