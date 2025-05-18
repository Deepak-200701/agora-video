import React from 'react';
import ParticipantCard from './ParticipantCard';

const participants = ['Bob', 'Charlie', 'Diana', 'Ethan', 'Fiona', 'George', 'Hannah'];

const ParticipantsBar = () => {
  return (
    <div className="w-60 bg-gray-900 p-4 space-y-2 overflow-y-auto">
      <h3 className="text-white font-semibold mb-2">Participants</h3>
      {participants.map((name, i) => (
        <ParticipantCard key={i} name={name} index={i} />
      ))}
    </div>
  );
};

export default ParticipantsBar;
