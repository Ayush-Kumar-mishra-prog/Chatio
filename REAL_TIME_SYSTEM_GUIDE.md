# Chatio Real-Time Messaging & Calling System

## Overview

Chatio uses Socket.IO for real-time communication between users. This document explains how to troubleshoot issues with:

- Real-time messages not appearing
- Seen/unseen status not updating
- Video/voice call notifications not showing
- Call accept/reject functionality

## Architecture

### Frontend Socket Connection (AuthContext.jsx)

```
User Login → Socket.IO Connection with userId
         ↓
    Socket emits "getOnlineUsers" event
         ↓
    Frontend stores online users list
```

### Message Flow

```
Sender sends message (ChatContainer.jsx)
         ↓
Backend validates & saves (Message.Controller.js)
         ↓
Backend emits "newMessage" event to all conversation members
         ↓
Receiver gets real-time update (ChatContainer.jsx listener)
         ↓
Sidebar updates with new message (ChatPage.jsx listener)
```

### Call Flow

```
Caller initiates call (ChatPage.jsx)
         ↓
Frontend emits "call:invite" event via Socket.IO
         ↓
Server finds receiver's socket and emits "call:incoming"
         ↓
Receiver gets notification (IncomingCallNotification.jsx)
         ↓
Receiver accepts/rejects
         ↓
If accepted: CallOverlay starts WebRTC peer connection
```

## Real-Time Events

### Message Events

1. **newMessage** - Emitted when a new message is sent
   - Payload: Message object with text, images, senderId, conversationId, createdAt
   - Listeners: ChatContainer, ChatPage

2. **messagesSeen** - Emitted when messages are marked as seen
   - Payload: { conversationId, messageIds, seenBy }
   - Listeners: ChatContainer, ChatPage

3. **conversationUpdated** - Emitted when conversation is updated
   - Payload: Conversation object
   - Listeners: ChatPage

### Call Events

1. **call:invite** - Sent when caller initiates a call
   - Payload: { callId, conversation, type, offer, caller, receiverIds }
   - Emitted by: Caller via Socket.IO
   - Handled by: Server (forwards to receivers)

2. **call:incoming** - Received by call recipient
   - Payload: { callId, conversation, type, offer, caller, from }
   - Handled by: ChatPage (shows IncomingCallNotification)

3. **call:answer** - Sent when recipient accepts the call
   - Payload: { answer, callId }
   - Emitted by: Recipient via Socket.IO
   - Handled by: Caller in CallOverlay

4. **call:ice** - ICE candidates for WebRTC
   - Payload: { candidate }
   - Used for: Establishing peer-to-peer connection

5. **call:end** - Sent when call ends
   - Payload: { callId }
   - Handled by: Both participants close connection

### Online Status Events

1. **getOnlineUsers** - List of online user IDs
   - Payload: Array of user IDs
   - Updated: On every connection/disconnection
   - Used by: ChatContainer to show "Online" status

## Troubleshooting Guide

### Messages Not Showing in Real-Time

**Symptoms:**

- Messages only appear after page reload
- Other users can't see your messages until refresh

**Root Causes & Solutions:**

1. **Socket Connection Not Established**
   - Check browser console for WebSocket errors
   - Verify backend URL in frontend (.env file)
   - Ensure socket connection logs appear: "Socket connected: [userId]"
   - Check if firewalls/proxies block WebSocket connections

2. **Server Not Emitting Events**
   - Check backend console logs for "Emitting newMessage" or similar
   - Verify database message is saved before socket event
   - Check if event listeners are properly registered

3. **Frontend Not Listening to Events**
   - Open browser DevTools → Application → Cookies → Check if token is saved
   - Check if ChatContainer component is mounted
   - Verify useEffect dependencies in ChatContainer

**Debug Steps:**

```javascript
// In ChatContainer.jsx, you'll see console logs:
"Received new message: {message object}"
"Messages marked as seen: {conversationId, messageIds}"

// In ChatPage.jsx, you'll see:
"New message received in ChatPage: {message object}"
"Messages seen: {conversationId, messageIds}"

// In Browser DevTools Network tab:
Look for WebSocket connection to your backend server
Should show messages like: "newMessage" frames
```

### Seen/Unseen Status Not Updating

**Symptoms:**

- "Unseen messages" count doesn't decrease
- Messages show as unseen even after viewing
- Other users don't see when you've read their messages

**Root Causes:**

1. getMessages endpoint not marking as seen
2. "messagesSeen" event not being emitted
3. Frontend not listening to "messagesSeen" event

**Solution:**

- Ensure ChatPage.jsx has handler for "messagesSeen" event (already added)
- Check backend logs for "messagesSeen" event emission
- Verify database updates seen status

### Video/Voice Call Notifications Not Showing

**Symptoms:**

- Incoming call doesn't show popup
- Can't see call accept/reject buttons
- Call initiator thinks call was sent but receiver doesn't know

**Root Causes:**

1. **Socket Connection Issue**
   - Backend: Check if userSocketMap has both users
   - Frontend: Verify socket is connected

2. **call:incoming Event Not Received**
   - Check server logs for "Emitting call:incoming to [userId]"
   - Verify receiver's socket ID is in userSocketMap
   - Check browser console for socket connection messages

3. **IncomingCallNotification Component Not Rendering**
   - Verify component is imported in ChatPage.jsx
   - Check if incomingCall state is being set
   - Ensure browser animations are not disabled

**Debug Steps:**

```javascript
// Server console should show:
"call:invite from [callerId] to [receiverIds]";
"Emitting call:incoming to [receiverId] via socket [socketId]";

// Browser console should show:
"Incoming call received: {payload}";
"Socket connected: [userId]";
```

### Call Accept/Reject Not Working

**Symptoms:**

- Accept button doesn't start the call
- Reject button doesn't close notification
- WebRTC connection fails to establish

**Solutions:**

1. Check browser permissions for camera/microphone
   - Allow when prompted
   - Check browser settings (Chrome: Settings → Privacy → Site Settings)

2. Verify call data is passed correctly
   - Ensure CallOverlay receives activeCall prop with all data
   - Check if RTCPeerConnection is created successfully

3. WebRTC connection issues
   - Check if ICE candidates are being exchanged
   - Browser console should show "Received remote track"
   - Verify firewall/NAT allows WebRTC connections

## Performance Optimization

### Socket Connection Optimization

- **Reconnection Settings**: Configured with 1s initial delay, 5s max delay
- **Transports**: WebSocket (primary) + Polling (fallback)
- **Automatic Reconnection**: Enabled with infinite retry attempts

### Database Queries

- Messages are indexed by conversationId for fast queries
- Only unseen messages are fetched from database

### Memory Management

- Socket listeners are properly cleaned up in useEffect returns
- Media streams are stopped when call ends
- WebRTC peer connections are closed properly

## Configuration

### Environment Variables (Backend)

```
PORT=8000
FRONTEND_URL=http://localhost:5173
NODE_ENV=development
```

### Socket.IO Settings (server.js)

```javascript
{
  cors: { origin: "*" },
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  reconnectionAttempts: Infinity,
  transports: ["websocket", "polling"]
}
```

## Console Logging

### Frontend (Development)

Console will show:

- "Socket connected: [userId]"
- "Received new message: {message}"
- "Messages marked as seen: {conversationId}"
- "Incoming call received: {payload}"
- Call debugging logs (ICE candidates, peer connections)

### Backend (Console)

Console will show:

- "user connected [userId] socket ID: [socketId]"
- "call:invite from [userId] to [receiverIds]"
- "Emitting call:incoming to [receiverId] via socket [socketId]"
- "User Disconnected [userId]"

## Testing Real-Time Features

### Test Messages

1. Open two browser windows (different users)
2. Send a message from User A
3. User B should see it immediately without refresh
4. Check "unseen count" decreases when viewing message

### Test Calls

1. Have User A call User B
2. User B should see incoming call popup within 1-2 seconds
3. Click Accept to start the call
4. Audio/video should stream if permissions granted
5. Click end to close the call

### Test Online Status

1. Check sidebar - online users should be highlighted
2. Disconnect User A
3. User B's view should update to show User A as offline

## Common Issues & Quick Fixes

| Issue                         | Check                  | Fix                          |
| ----------------------------- | ---------------------- | ---------------------------- |
| Messages not real-time        | WebSocket connection   | Restart backend & frontend   |
| No incoming call notification | Browser console errors | Grant camera/mic permissions |
| Call quality poor             | ICE candidate logs     | Check network speed          |
| Socket keeps disconnecting    | Server logs            | Increase timeout values      |
| Old messages cached           | Database               | Clear browser cache          |

## Performance Metrics

- **Message Delivery**: < 100ms typically
- **Call Notification**: < 500ms typically
- **Socket Reconnection**: < 2 seconds
- **WebRTC Connection**: 2-5 seconds (depends on NAT/firewall)
