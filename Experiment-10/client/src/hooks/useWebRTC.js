// client/src/hooks/useWebRTC.js
import { useState, useEffect, useRef, useCallback } from 'react';

// --- Signaling URL (prod via env, falls back to localhost) ---
const SIGNALING_SERVER = process.env.REACT_APP_WS_URL || 'ws://localhost:3001/ws';

// --- ICE servers (STUN + TURN) ---
// Supports:
//   REACT_APP_TURN_SERVER
//   REACT_APP_TURN_USERNAME
//   REACT_APP_TURN_PASSWORD
// Optional second TURN:
//   REACT_APP_TURN_SERVER2 (same username/password)
// Auto adds Xirsys TCP fallback if the main TURN URL includes "global.xirsys.net"
const turnUrl1 = process.env.REACT_APP_TURN_SERVER || '';
const turnUrl2 = process.env.REACT_APP_TURN_SERVER2 || '';
const turnUser = process.env.REACT_APP_TURN_USERNAME || '';
const turnPass = process.env.REACT_APP_TURN_PASSWORD || '';

const iceServers = [
  { urls: 'stun:stun.l.google.com:19302' },
  ...(turnUrl1 && turnUser && turnPass
    ? [{ urls: turnUrl1, username: turnUser, credential: turnPass }]
    : []),
  ...(turnUrl2 && turnUser && turnPass
    ? [{ urls: turnUrl2, username: turnUser, credential: turnPass }]
    : []),
  ...(turnUrl1.includes('global.xirsys.net') && turnUser && turnPass
    ? [{ urls: 'turns:global.xirsys.net:5349?transport=tcp', username: turnUser, credential: turnPass }]
    : []),
];

export const useWebRTC = (roomId, displayName, onLeaveCallback) => {
  const [localStream, setLocalStream] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState([]);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [connectionQuality, setConnectionQuality] = useState('good');
  const [chatMessages, setChatMessages] = useState([]);

  const wsRef = useRef(null);
  const localStreamRef = useRef(null);
  const screenStreamRef = useRef(null);
  const peersRef = useRef(new Map());              // participantId -> RTCPeerConnection
  const participantIdRef = useRef(null);           // my participantId (from server)
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const pendingCandidatesRef = useRef(new Map());  // participantId -> RTCIceCandidateInit[]

  const MAX_RECONNECT_ATTEMPTS = 5;
  const RECONNECT_DELAY = 1000;

  // --- helpers for ICE buffering ---
  const queueCandidate = (participantId, candidate) => {
    const q = pendingCandidatesRef.current.get(participantId) || [];
    q.push(candidate);
    pendingCandidatesRef.current.set(participantId, q);
  };

  const flushQueuedCandidates = (participantId) => {
    const pc = peersRef.current.get(participantId);
    if (!pc || !pc.remoteDescription) return;
    const q = pendingCandidatesRef.current.get(participantId) || [];
    q.forEach((c) => {
      pc.addIceCandidate(new RTCIceCandidate(c)).catch((err) => {
        console.error('Error adding queued ICE candidate:', err);
      });
    });
    pendingCandidatesRef.current.delete(participantId);
  };

  // --- media ---
  const initializeLocalStream = useCallback(async (constraints = { audio: true, video: true }) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      localStreamRef.current = stream;
      setLocalStream(stream);
      setIsAudioEnabled(stream.getAudioTracks()[0]?.enabled ?? false);
      setIsVideoEnabled(stream.getVideoTracks()[0]?.enabled ?? false);
      return stream;
    } catch (error) {
      console.error('Error accessing media devices:', error);
      throw error;
    }
  }, []);

  // --- create RTCPeerConnection ---
  const createPeerConnection = useCallback((participantId) => {
    let pc = peersRef.current.get(participantId);
    if (pc) return pc;

    pc = new RTCPeerConnection({ iceServers });

    // Add local tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current);
      });
    }

    // Remote track handling
    pc.ontrack = (event) => {
      const [remoteStream] = event.streams;
      setRemoteStreams((prev) => {
        const existing = prev.find((r) => r.participantId === participantId);
        if (existing) {
          return prev.map((r) =>
            r.participantId === participantId ? { ...r, stream: remoteStream } : r
          );
        }
        return [
          ...prev,
          {
            participantId,
            stream: remoteStream,
            displayName: '',
            isAudioEnabled: true,
            isVideoEnabled: true,
          },
        ];
      });
    };

    // Trickle ICE
    pc.onicecandidate = (event) => {
      if (event.candidate && wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            type: 'ice-candidate',
            targetId: participantId,
            candidate: event.candidate,
          })
        );
      }
    };

    // State logs
    pc.onconnectionstatechange = () => {
      console.log(`Connection state with ${participantId}:`, pc.connectionState);

      if (pc.connectionState === 'failed') {
        try {
          pc.restartIce();
        } catch {}
      }

      setConnectionQuality(
        pc.connectionState === 'connected'
          ? 'good'
          : pc.connectionState === 'connecting'
          ? 'medium'
          : 'poor'
      );
    };

    pc.oniceconnectionstatechange = () => {
      console.log(`ICE connection state with ${participantId}:`, pc.iceConnectionState);
    };

    peersRef.current.set(participantId, pc);
    return pc;
  }, []);

  // --- signaling message handler ---
  const handleSignalingMessage = useCallback(
    (data) => {
      switch (data.type) {
        case 'joined': {
          // I have joined; server gives me my ID and list of existing participants
          participantIdRef.current = data.participantId;

          // I am the joiner: create offers to all existing participants
          if (Array.isArray(data.participants)) {
            data.participants.forEach(async (p) => {
              const pc = createPeerConnection(p.participantId);
              try {
                const offer = await pc.createOffer({ iceRestart: false });
                await pc.setLocalDescription(offer);
                wsRef.current?.send(
                  JSON.stringify({
                    type: 'offer',
                    targetId: p.participantId,
                    offer: pc.localDescription,
                  })
                );
              } catch (err) {
                console.error('Error creating/sending offer:', err);
              }
            });
          }
          break;
        }

        case 'user-joined': {
          // A new user joined the room.
          // To avoid glare: existing users DO NOT create an offer here.
          // Just ensure a PC exists; the joiner will send the offer.
          createPeerConnection(data.participantId);
          break;
        }

        case 'offer': {
          // Ensure PC exists
          const pc = createPeerConnection(data.from);
          pc
            .setRemoteDescription(new RTCSessionDescription(data.offer))
            .then(() => pc.createAnswer())
            .then((answer) => pc.setLocalDescription(answer))
            .then(() => {
              wsRef.current?.send(
                JSON.stringify({
                  type: 'answer',
                  targetId: data.from,
                  answer: pc.localDescription,
                })
              );
              // now that remoteDescription is set, flush queued ICE
              flushQueuedCandidates(data.from);
            })
            .catch((error) => console.error('Error handling offer:', error));
          break;
        }

        case 'answer': {
          const pc = createPeerConnection(data.from);
          pc
            .setRemoteDescription(new RTCSessionDescription(data.answer))
            .then(() => flushQueuedCandidates(data.from))
            .catch((error) => console.error('Error handling answer:', error));
          break;
        }

        case 'ice-candidate': {
          const pc = createPeerConnection(data.from);
          const candidate = data.candidate;
          // Queue candidates until remoteDescription is set
          if (!pc.remoteDescription) {
            queueCandidate(data.from, candidate);
          } else {
            pc
              .addIceCandidate(new RTCIceCandidate(candidate))
              .catch((error) => console.error('Error adding ICE candidate:', error));
          }
          break;
        }

        case 'user-left': {
          const pc = peersRef.current.get(data.participantId);
          if (pc) {
            pc.close();
            peersRef.current.delete(data.participantId);
          }
          setRemoteStreams((prev) => prev.filter((r) => r.participantId !== data.participantId));
          pendingCandidatesRef.current.delete(data.participantId);
          break;
        }

        case 'audio-toggled':
        case 'video-toggled': {
          setRemoteStreams((prev) =>
            prev.map((r) =>
              r.participantId === data.participantId
                ? {
                    ...r,
                    [data.type === 'audio-toggled' ? 'isAudioEnabled' : 'isVideoEnabled']:
                      data.enabled,
                  }
                : r
            )
          );
          break;
        }

        case 'chat': {
          setChatMessages((prev) => [
            ...prev,
            { ...data, isOwn: data.participantId === participantIdRef.current },
          ]);
          break;
        }

        case 'presence-update': {
          setRemoteStreams((prev) => {
            const existing = prev.find((r) => r.participantId === data.participantId);
            if (!existing) return prev;
            return prev.map((r) =>
              r.participantId === data.participantId ? { ...r, displayName: data.displayName } : r
            );
          });
          break;
        }

        default:
          console.warn('Unhandled signaling message type:', data?.type, data);
      }
    },
    [createPeerConnection]
  );

  // --- connect to signaling ---
  const connectSignaling = useCallback(() => {
    return new Promise((resolve, reject) => {
      try {
        const wsUrl = SIGNALING_SERVER.includes('/ws')
          ? SIGNALING_SERVER
          : `${SIGNALING_SERVER}/ws`;
        const ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          console.log('Connected to signaling server');
          wsRef.current = ws;
          reconnectAttemptsRef.current = 0;

          ws.send(
            JSON.stringify({
              type: 'join',
              roomId,
              displayName,
            })
          );
          resolve();
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            handleSignalingMessage(data);
          } catch (error) {
            console.error('Error parsing message:', error);
          }
        };

        ws.onerror = (event) => {
          const error =
            event instanceof Event ? new Error('WebSocket connection error') : event;
          console.error('WebSocket error event:', event);
          if (
            ws.readyState === WebSocket.OPEN ||
            ws.readyState === WebSocket.CONNECTING
          ) {
            ws.close();
          }
          reject(error);
        };

        ws.onclose = () => {
          console.log('WebSocket closed');
          wsRef.current = null;

          if (reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
            const delay = RECONNECT_DELAY * Math.pow(2, reconnectAttemptsRef.current);
            reconnectAttemptsRef.current++;
            console.log(
              `Reconnecting in ${delay}ms (attempt ${reconnectAttemptsRef.current})...`
            );

            reconnectTimeoutRef.current = setTimeout(() => {
              connectSignaling().catch((error) => {
                console.error('Reconnection attempt failed:', error);
              });
            }, delay);
          } else {
            console.error('Max reconnection attempts reached');
          }
        };
      } catch (error) {
        reject(error);
      }
    });
  }, [roomId, displayName, handleSignalingMessage]);

  // --- init & cleanup ---
  useEffect(() => {
    const initialize = async () => {
      try {
        await initializeLocalStream();
        await connectSignaling();
      } catch (error) {
        console.error('Initialization error:', error);
      }
    };

    initialize();

    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);

      const peers = peersRef.current;
      peers.forEach((pc) => pc.close());
      peers.clear();

      const local = localStreamRef.current;
      if (local) local.getTracks().forEach((t) => t.stop());

      const screen = screenStreamRef.current;
      if (screen) screen.getTracks().forEach((t) => t.stop());

      const ws = wsRef.current;
      if (ws) ws.close();
    };
  }, [connectSignaling, initializeLocalStream]);

  // --- controls ---
  const toggleAudio = useCallback(() => {
    const stream = localStreamRef.current;
    if (!stream) return;
    const track = stream.getAudioTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setIsAudioEnabled(track.enabled);
    wsRef.current?.send(JSON.stringify({ type: 'toggle-audio', enabled: track.enabled }));
  }, []);

  const toggleVideo = useCallback(() => {
    const stream = localStreamRef.current;
    if (!stream) return;
    const track = stream.getVideoTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setIsVideoEnabled(track.enabled);
    wsRef.current?.send(JSON.stringify({ type: 'toggle-video', enabled: track.enabled }));
  }, []);

  const toggleScreenShare = useCallback(async () => {
    try {
      if (isScreenSharing) {
        // back to camera
        if (screenStreamRef.current) {
          screenStreamRef.current.getTracks().forEach((t) => t.stop());
          screenStreamRef.current = null;
        }
        const cam = await navigator.mediaDevices.getUserMedia({ video: true });
        const videoTrack = cam.getVideoTracks()[0];

        // replace in every peer
        peersRef.current.forEach((pc) => {
          const sender = pc.getSenders().find((s) => s.track && s.track.kind === 'video');
          if (sender && videoTrack) sender.replaceTrack(videoTrack);
        });

        // update local composite stream
        if (localStreamRef.current) {
          const old = localStreamRef.current.getVideoTracks()[0];
          if (old) old.stop();
          if (old) localStreamRef.current.removeTrack(old);
          localStreamRef.current.addTrack(videoTrack);
        }

        setIsScreenSharing(false);
      } else {
        const screen = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
        screenStreamRef.current = screen;
        const videoTrack = screen.getVideoTracks()[0];

        // replace in every peer
        peersRef.current.forEach((pc) => {
          const sender = pc.getSenders().find((s) => s.track && s.track.kind === 'video');
          if (sender && videoTrack) sender.replaceTrack(videoTrack);
        });

        // update local composite stream
        if (localStreamRef.current) {
          const old = localStreamRef.current.getVideoTracks()[0];
          if (old) old.stop();
          if (old) localStreamRef.current.removeTrack(old);
          localStreamRef.current.addTrack(videoTrack);
        }

        setIsScreenSharing(true);

        videoTrack.onended = () => {
          toggleScreenShare();
        };
      }
    } catch (error) {
      console.error('Error toggling screen share:', error);
    }
  }, [isScreenSharing]);

  const sendChatMessage = useCallback((message) => {
    if (wsRef.current?.readyState === WebSocket.OPEN && message.trim()) {
      wsRef.current.send(JSON.stringify({ type: 'chat', message: message.trim() }));
    }
  }, []);

  const leaveRoom = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'leave' }));
    }

    peersRef.current.forEach((pc) => pc.close());
    peersRef.current.clear();
    pendingCandidatesRef.current.clear();

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
    }
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((t) => t.stop());
    }

    if (wsRef.current) wsRef.current.close();

    onLeaveCallback?.();
  }, [onLeaveCallback]);

  return {
    localStream,
    remoteStreams,
    isAudioEnabled,
    isVideoEnabled,
    isScreenSharing,
    connectionQuality,
    chatMessages,
    toggleAudio,
    toggleVideo,
    toggleScreenShare,
    sendChatMessage,
    leaveRoom,
  };
};
