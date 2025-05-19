import React from 'react';
import VideoCall from './VideoCall';
import CallRoom from './pages/CallRoom';
import JoinCall from './pages/JoinCall';
import { ToastContainer } from 'react-toastify';

const App = () => {
  return (
    // <div style={{ padding: '20px' }}>
    //   <VideoCall />
    // </div>
    <>
      <JoinCall />
      <ToastContainer />
    </>
  );
};

export default App;
