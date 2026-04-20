Call feature implementation and run instructions

Overview
- Backend: Socket.IO used for signaling and call events. Server relays `signal` events and `start_call`/`end_call` events to rooms.
- Frontend: Simple WebRTC peer connection handlers in `frontend/app-backend.js` handle offer/answer, ICE candidates, and media capture.

Install and run
1. Install backend deps

```bash
cd backend
npm install
```

2. Start server

```bash
npm run dev
# or
npm start
```

3. Open frontend in browser (served by Express from `/frontend`):
- Visit: http://localhost:3000

Notes and limitations
- This implementation uses simple room-based signaling and a peer-to-peer mesh for calls. For group calls with more than 3 participants, a proper SFU (e.g., mediasoup, Janus, Jitsi) is recommended.
- The client will prompt for microphone/camera permission on incoming/outgoing calls. Ensure HTTPS or localhost for camera access.
- Call UI is minimal: the overlay created by `app-backend.js` shows remote video(s) and an end call button.
- For production, add authentication checks on signaling paths and secure Socket.IO with proper CORS and authentication.

Next steps
- Add richer in-call controls (mute, camera toggle, swap layouts).
- Improve group-call topology with an SFU.
- Add accept/decline UI and better UX instead of confirm() prompts.
