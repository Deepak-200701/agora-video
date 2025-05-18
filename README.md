video-call-app/
├── public/
│   ├── index.html
│   └── assets/
├── src/
│   ├── api/
│   │   ├── agoraService.js
│   │   └── authService.js
│   ├── components/
│   │   ├── common/
│   │   │   ├── Button.jsx
│   │   │   ├── Input.jsx
│   │   │   └── Loader.jsx
│   │   ├── layout/
│   │   │   ├── AppLayout.jsx
│   │   │   └── PageContainer.jsx
│   │   └── videoCall/
│   │       ├── ControlPanel.jsx
│   │       ├── JoinForm.jsx
│   │       ├── LocalVideoView.jsx
│   │       ├── RemoteVideoView.jsx
│   │       └── VideoGrid.jsx
│   ├── config/
│   │   ├── agoraConfig.js
│   │   └── apiConfig.js
│   ├── constants/
│   │   └── actionTypes.js
│   ├── hooks/
│   │   ├── useAgora.js
│   │   └── useScreenSharing.js
│   ├── pages/
│   │   ├── HomePage.jsx
│   │   ├── JoinCallPage.jsx
│   │   └── VideoCallPage.jsx
│   ├── redux/
│   │   ├── actions/
│   │   │   ├── callActions.js
│   │   │   └── userActions.js
│   │   ├── reducers/
│   │   │   ├── callReducer.js
│   │   │   ├── userReducer.js
│   │   │   └── rootReducer.js
│   │   ├── selectors/
│   │   │   ├── callSelectors.js
│   │   │   └── userSelectors.js
│   │   ├── store.js
│   │   └── thunks/
│   │       └── callThunks.js
│   ├── utils/
│   │   ├── errorHandling.js
│   │   └── mediaUtils.js
│   ├── App.jsx
│   ├── index.js
│   └── Routes.jsx
├── .env
├── .env.example
├── .gitignore
├── package.json
└── README.md