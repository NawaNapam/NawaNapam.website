import { useCallback, useEffect, useRef, useState } from "react";
import type { Socket } from "socket.io-client";

type UseWebRTCArgs = {
  socket: Socket | null;
  roomId: string | null;
  selfUserId: string;
  offererHint?: string | null;
};

type UseWebRTCResult = {
  attachLocal: (el: HTMLVideoElement | null) => void;
  attachRemote: (el: HTMLVideoElement | null) => void;
  toggleAudio: (on?: boolean) => void;
  toggleVideo: (on?: boolean) => void;
  endCall: () => void;
  connected: boolean;
};

function buildIceServers(): RTCIceServer[] {
  return [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
    { urls: "stun:stun3.l.google.com:19302" },
    { urls: "stun:stun4.l.google.com:19302" },
  ];
}

export function useWebRTC({
  socket,
  roomId,
  selfUserId,
}: UseWebRTCArgs): UseWebRTCResult {
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const localElRef = useRef<HTMLVideoElement | null>(null);
  const remoteElRef = useRef<HTMLVideoElement | null>(null);

  // perfect-negotiation flags
  const makingOfferRef = useRef(false);
  const ignoreOfferRef = useRef(false);
  const politeRef = useRef(false);

  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!socket || !roomId) {
      console.log("[WebRTC] Skipping init: missing socket or roomId");
      return;
    }

    console.log(`[WebRTC] Initializing for room ${roomId}, user ${selfUserId}`);

    let closed = false;

    const pc = new RTCPeerConnection({ iceServers: buildIceServers() });
    pcRef.current = pc;

    // Connection state monitoring
    pc.onconnectionstatechange = () => {
      const st = pc.connectionState;
      console.log(`[WebRTC] Connection state: ${st}`);
      setConnected(st === "connected");
      
      if (st === "failed") {
        console.warn("[WebRTC] Connection failed, attempting restart...");
        pc.restartIce?.();
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log(`[WebRTC] ICE connection state: ${pc.iceConnectionState}`);
    };

    pc.onsignalingstatechange = () => {
      console.log(`[WebRTC] Signaling state: ${pc.signalingState}`);
    };

    pc.onicecandidate = (ev) => {
      if (!ev.candidate) {
        console.log("[WebRTC] ICE gathering complete");
        return;
      }
      console.log("[WebRTC] Sending ICE candidate");
      socket.emit("rtc:candidate", { roomId, candidate: ev.candidate.toJSON() });
    };

    // CRITICAL FIX: Better ontrack handler
    pc.ontrack = (ev) => {
      console.log("[WebRTC] ontrack fired", {
        trackKind: ev.track.kind,
        trackId: ev.track.id,
        streamsCount: ev.streams.length,
        streamId: ev.streams[0]?.id
      });

      const stream = ev.streams[0];
      
      if (!stream) {
        console.warn("[WebRTC] No stream in track event, creating new one");
        const newStream = new MediaStream([ev.track]);
        if (remoteElRef.current) {
          remoteElRef.current.srcObject = newStream;
          remoteElRef.current.play().catch(err => 
            console.warn("[WebRTC] Remote video autoplay failed:", err)
          );
        }
        return;
      }

      console.log("[WebRTC] Setting remote stream to video element");
      
      if (remoteElRef.current) {
        // Always set the stream, even if it's the same
        remoteElRef.current.srcObject = stream;
        
        // Force play
        remoteElRef.current.play().catch(err => {
          console.warn("[WebRTC] Remote video autoplay failed:", err);
          // Try playing on user interaction
          const playOnClick = () => {
            remoteElRef.current?.play();
            document.removeEventListener("click", playOnClick);
          };
          document.addEventListener("click", playOnClick);
        });
        
        console.log("[WebRTC] Remote video element srcObject set successfully");
      } else {
        console.warn("[WebRTC] remoteElRef.current is null!");
      }
    };

    // CRITICAL: Get local media FIRST, then set up signaling
    // We need tracks in the peer connection before any negotiation
    let mediaReady = false;
    
    (async () => {
      try {
        console.log("[WebRTC] Requesting user media...");
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { 
            width: { ideal: 1280 }, 
            height: { ideal: 720 },
            facingMode: "user"
          },
          audio: { 
            echoCancellation: true, 
            noiseSuppression: true, 
            autoGainControl: true 
          },
        });
        
        if (closed) {
          console.log("[WebRTC] Closed before media acquired, stopping tracks");
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        
        console.log("[WebRTC] Got local stream", {
          videoTracks: stream.getVideoTracks().length,
          audioTracks: stream.getAudioTracks().length,
        });
        
        localStreamRef.current = stream;

        if (localElRef.current) {
          localElRef.current.srcObject = stream;
          localElRef.current.muted = true;
          localElRef.current.playsInline = true;
          localElRef.current.play().catch(() => {});
          console.log("[WebRTC] Local video element set");
        }

        // Add tracks to peer connection BEFORE negotiation
        stream.getTracks().forEach((track) => {
          console.log(`[WebRTC] Adding ${track.kind} track to peer connection`);
          pc.addTrack(track, stream);
        });
        
        console.log("[WebRTC] All tracks added to peer connection");
        mediaReady = true;
        
        // Now that media is ready, tell server we're ready to join
        console.log(`[WebRTC] Media ready, emitting room:join for ${roomId}`);
        socket.emit("room:join", { roomId });
        
      } catch (e) {
        console.error("[WebRTC] getUserMedia failed:", e);
        // Still join room even if media fails
        socket.emit("room:join", { roomId });
      }
    })();

    // --- signaling handlers ---
    const onReady = (payload: { roomId: string; offerer: string }) => {
      if (payload.roomId !== roomId) {
        console.log("[WebRTC] Ignoring rtc:ready for different room");
        return;
      }

      console.log(`[WebRTC] rtc:ready received. Offerer: ${payload.offerer}, Self: ${selfUserId}`);

      // We are polite (won't clobber collisions) iff we are NOT the designated offerer
      politeRef.current = payload.offerer !== selfUserId;
      console.log(`[WebRTC] Politeness: ${politeRef.current ? "POLITE" : "IMPOLITE"}`);

      // Only designated offerer kicks off negotiation immediately
      if (payload.offerer === selfUserId) {
        console.log("[WebRTC] I am offerer, creating offer...");
        (async () => {
          if (!pcRef.current) return;
          
          // Wait for media to be ready before creating offer
          let attempts = 0;
          while (!mediaReady && attempts < 50) {
            console.log("[WebRTC] Waiting for media to be ready...");
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
          }
          
          if (!mediaReady) {
            console.error("[WebRTC] Media not ready after 5 seconds, proceeding anyway");
          }
          
          try {
            makingOfferRef.current = true;
            const offer = await pc.createOffer();
            console.log("[WebRTC] Offer created, setting local description");
            await pc.setLocalDescription(offer);
            console.log("[WebRTC] Sending offer to peer");
            socket.emit("rtc:offer", { roomId, sdp: pc.localDescription });
          } catch (err) {
            console.error("[WebRTC] createOffer/setLocalDescription failed:", err);
          } finally {
            makingOfferRef.current = false;
          }
        })();
      } else {
        console.log("[WebRTC] I am answerer, waiting for offer...");
      }
    };

    const onOffer = async (payload: { roomId: string; sdp: RTCSessionDescriptionInit }) => {
      if (payload.roomId !== roomId || !pcRef.current) {
        console.log("[WebRTC] Ignoring offer for different room or no PC");
        return;
      }
      
      console.log("[WebRTC] Received offer");
      
      // Wait for media to be ready before answering
      let attempts = 0;
      while (!mediaReady && attempts < 50) {
        console.log("[WebRTC] Waiting for media before answering...");
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
      }
      
      if (!mediaReady) {
        console.error("[WebRTC] Media not ready after 5 seconds, answering anyway");
      }
      
      const pcNow = pcRef.current;

      const offerCollision =
        makingOfferRef.current || pcNow.signalingState !== "stable";

      ignoreOfferRef.current = !politeRef.current && offerCollision;
      
      if (ignoreOfferRef.current) {
        console.log("[WebRTC] Impolite peer ignoring offer collision");
        return;
      }

      try {
        if (offerCollision && politeRef.current) {
          console.log("[WebRTC] Polite peer rolling back for collision");
          await pcNow.setLocalDescription({ type: "rollback" });
        }
        
        console.log("[WebRTC] Setting remote description (offer)");
        await pcNow.setRemoteDescription(new RTCSessionDescription(payload.sdp));

        console.log("[WebRTC] Creating answer");
        const answer = await pcNow.createAnswer();
        console.log("[WebRTC] Setting local description (answer)");
        await pcNow.setLocalDescription(answer);
        console.log("[WebRTC] Sending answer to peer");
        socket.emit("rtc:answer", { roomId, sdp: pcNow.localDescription });
      } catch (err) {
        console.error("[WebRTC] onOffer negotiation failed:", err);
      }
    };

    const onAnswer = async (payload: { roomId: string; sdp: RTCSessionDescriptionInit }) => {
      if (payload.roomId !== roomId || !pcRef.current) {
        console.log("[WebRTC] Ignoring answer for different room or no PC");
        return;
      }
      
      console.log("[WebRTC] Received answer, setting remote description");
      try {
        await pcRef.current.setRemoteDescription(new RTCSessionDescription(payload.sdp));
        console.log("[WebRTC] Remote description set successfully");
      } catch (err) {
        console.error("[WebRTC] onAnswer setRemoteDescription failed:", err);
      }
    };

    const onCandidate = async (payload: { roomId: string; candidate: RTCIceCandidateInit }) => {
      if (payload.roomId !== roomId || !pcRef.current) return;
      
      try {
        console.log("[WebRTC] Adding ICE candidate");
        await pcRef.current.addIceCandidate(new RTCIceCandidate(payload.candidate));
      } catch (err) {
        if (!ignoreOfferRef.current) {
          console.warn("[WebRTC] addIceCandidate failed:", err);
        }
      }
    };

    const onPeerLeft = () => {
      console.log("[WebRTC] Peer left");
      setConnected(false);
      if (remoteElRef.current) remoteElRef.current.srcObject = null;
    };

    socket.on("rtc:ready", onReady);
    socket.on("rtc:offer", onOffer);
    socket.on("rtc:answer", onAnswer);
    socket.on("rtc:candidate", onCandidate);
    socket.on("rtc:peer-left", onPeerLeft);

    // DON'T emit room:join here - we do it after media is ready (inside getUserMedia callback)
    console.log(`[WebRTC] Signaling handlers registered, waiting for media...`);

    return () => {
      closed = true;
      console.log("[WebRTC] Cleanup started");

      socket.off("rtc:ready", onReady);
      socket.off("rtc:offer", onOffer);
      socket.off("rtc:answer", onAnswer);
      socket.off("rtc:candidate", onCandidate);
      socket.off("rtc:peer-left", onPeerLeft);

      try {
        pc.getSenders().forEach((s) => {
          if (s.track) {
            s.track.stop();
            console.log(`[WebRTC] Stopped ${s.track.kind} track`);
          }
        });
      } catch {}
      
      try {
        pc.close();
        console.log("[WebRTC] PeerConnection closed");
      } catch {}
      
      pcRef.current = null;

      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => {
          t.stop();
          console.log(`[WebRTC] Stopped local ${t.kind} track`);
        });
        localStreamRef.current = null;
      }
      
      if (remoteElRef.current) remoteElRef.current.srcObject = null;

      // reset flags for next room
      makingOfferRef.current = false;
      ignoreOfferRef.current = false;
      politeRef.current = false;
      setConnected(false);
    };
  }, [socket, roomId, selfUserId]);

  // public API
  const attachLocal = useCallback((el: HTMLVideoElement | null) => {
    console.log("[WebRTC] attachLocal called", { hasElement: !!el, hasStream: !!localStreamRef.current });
    localElRef.current = el;
    if (el && localStreamRef.current) {
      el.srcObject = localStreamRef.current;
      el.muted = true;
      el.playsInline = true;
      el.play().catch((err) => console.warn("[WebRTC] Local play failed:", err));
    }
  }, []);

  const attachRemote = useCallback((el: HTMLVideoElement | null) => {
    console.log("[WebRTC] attachRemote called", { hasElement: !!el });
    remoteElRef.current = el;
    
    // If we already have a remote stream, attach it now
    if (el && pcRef.current) {
      const receivers = pcRef.current.getReceivers();
      console.log(`[WebRTC] Peer connection has ${receivers.length} receivers`);
      
      if (receivers.length > 0) {
        const tracks = receivers.map(r => r.track).filter(Boolean);
        if (tracks.length > 0) {
          console.log("[WebRTC] Creating stream from existing tracks");
          const stream = new MediaStream(tracks);
          el.srcObject = stream;
          el.play().catch((err) => console.warn("[WebRTC] Remote play failed:", err));
        }
      }
    }
  }, []);

  const toggleAudio = useCallback((on?: boolean) => {
    const s = localStreamRef.current;
    if (!s) return;
    s.getAudioTracks().forEach((t) => {
      t.enabled = on ?? !t.enabled;
      console.log(`[WebRTC] Audio ${t.enabled ? "enabled" : "disabled"}`);
    });
  }, []);

  const toggleVideo = useCallback((on?: boolean) => {
    const s = localStreamRef.current;
    if (!s) return;
    s.getVideoTracks().forEach((t) => {
      t.enabled = on ?? !t.enabled;
      console.log(`[WebRTC] Video ${t.enabled ? "enabled" : "disabled"}`);
    });
  }, []);

  const endCall = useCallback(() => {
    console.log("[WebRTC] endCall triggered");
    if (socket && roomId) socket.emit("rtc:leave", { roomId });
    const pc = pcRef.current;
    if (pc) {
      try { 
        pc.getSenders().forEach((s) => s.track && s.track.stop()); 
      } catch {}
      try { 
        pc.close(); 
      } catch {}
      pcRef.current = null;
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }
    if (remoteElRef.current) remoteElRef.current.srcObject = null;
    setConnected(false);
  }, [roomId, socket]);

  return { attachLocal, attachRemote, toggleAudio, toggleVideo, endCall, connected };
}