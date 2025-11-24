"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Mic,
  MicOff,
  Video as VideoIcon,
  VideoOff,
  ArrowLeft,
  Send,
  Globe,
  X,
  RotateCcw,
  Power,
  Users,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { useSession } from "next-auth/react";

import { useGetUser } from "@/hooks/use-getuser";
import { useRoomChat } from "@/hooks/useRoomChat";
import { useSignaling, onAuthOk } from "@/hooks/SocketProvider";
import { useWebRTC } from "@/hooks/useWebRTC";

export default function VideoChatPage() {
  // UI state
  const [currentTime, setCurrentTime] = useState("");
  const [inputMessage, setInputMessage] = useState("");
  const [keywords, setKeywords] = useState<string[]>(["Music", "Travel", "Food", "Cricket"]);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);

  // refs
  const selfVideoRef = useRef<HTMLVideoElement | null>(null);
  const strangerVideoRef = useRef<HTMLVideoElement | null>(null);
  const messageEndRef = useRef<HTMLDivElement | null>(null);
  const hasStartedRef = useRef(false);

  // auth / router
  const user = useGetUser();
  const userId = user?.id ?? null;
  const username = user?.username ?? undefined;
  const { status: sessionStatus, data: session } = useSession();
  const router = useRouter();

  // signaling
  const { status, peer, roomId, start, next, end, socket } = useSignaling(
    useMemo(() => ({ userId: userId ?? "", username }), [userId, username])
  );

  // text chat
  const { messages: chatMessages, send: sendChatMessage, reset: clearChat } = useRoomChat({
    socket,
    roomId: roomId ?? null,
    selfUserId: userId ?? "",
    selfUsername: username,
  });

  // --- WebRTC hook ---
  const {
    attachLocal,
    attachRemote,
    toggleAudio,
    toggleVideo,
    endCall,
    connected,
  } = useWebRTC({
    socket,
    roomId: roomId ?? null,
    selfUserId: userId ?? "",
    offererHint: null,
  });

  // bridge refs -> hook attachers
    const bindSelfRef = useCallback(
    (el: HTMLVideoElement | null) => {
      selfVideoRef.current = el;
      if (el && attachLocal) {
        attachLocal(el); // This will be called again when stream is ready
      }
    },
    [attachLocal]
  );
  const bindRemoteRef = useCallback(
    (el: HTMLVideoElement | null) => {
      strangerVideoRef.current = el;
      attachRemote(el);
    },
    [attachRemote]
  );

  // hard-redirect unauth without flicker
  useEffect(() => {
    if (sessionStatus === "loading") return;
    if (!session?.user?.email || !userId) {
      router.replace("/api/auth/signin");
    }
  }, [sessionStatus, session, userId, router]);

  // Start local media immediately when user is authenticated
  useEffect(() => {
    if (!userId || sessionStatus !== "authenticated") return;

    let stream: MediaStream | null = null;
    let mounted = true;

    const startLocalStream = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user" },
          audio: true,
        });

        if (!mounted) {
          mediaStream.getTracks().forEach(t => t.stop());
          return;
        }

        stream = mediaStream;

        // Attach to self video element immediately
        if (selfVideoRef.current) {
          selfVideoRef.current.srcObject = mediaStream;
          selfVideoRef.current.play().catch(() => {});
        }

        // Also inform the WebRTC hook (important for sending stream later)
        attachLocal(selfVideoRef.current);

      } catch (err) {
        console.error("Failed to access camera/mic:", err);
        toast.error("Camera/microphone access denied or unavailable");
      }
    };

    startLocalStream();

    return () => {
      mounted = false;
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [userId, sessionStatus, attachLocal]);
  // END OF NEW EFFECT

  // start searching after auth OK from server - ONLY ONCE
  useEffect(() => {
    if (!userId || hasStartedRef.current) return;

    const unsubscribe = onAuthOk(() => {
      if (!hasStartedRef.current && (status === "idle" || status === "ended")) {
        hasStartedRef.current = true;
        start();
      }
    });

    return () => {
      unsubscribe?.();
    };
  }, [userId, status, start]);

  // live IST clock
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true }) + " IST"
      );
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  // scroll chat to bottom
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  // FIXED: Only cleanup WebRTC on unmount, NOT the socket
  useEffect(() => {
    return () => {
      try {
        endCall();
      } catch (e) {
        console.error("Error ending call on unmount:", e);
      }
    };
  }, [endCall]);

  // actions
  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    const text = inputMessage.trim();
    if (!text) return;
    sendChatMessage(text);
    setInputMessage("");
  };

  const removeKeyword = (i: number) => setKeywords((arr) => arr.filter((_, idx) => idx !== i));

  const handleStart = () => {
    if (!userId) {
      toast.error("Sign in to start matching.");
      router.push("/api/auth/signin");
      return;
    }
    if (status === "matched") return;
    clearChat();
    hasStartedRef.current = false;
    start();
  };

  const handleNext = () => {
    clearChat();
    endCall();
    hasStartedRef.current = false;
    if (status === "matched" && roomId) next();
    else start();
  };

  const handleEnd = () => {
    clearChat();
    endCall();
    hasStartedRef.current = false;
    end();
  };

  // ensure we end when leaving to Dashboard
  const handleBackToDashboard = (e: React.MouseEvent) => {
    e.preventDefault();
    handleEnd();
    router.push("/dashboard");
  };

  // toggle tracks + UI state
  const onToggleMute = () => {
    toggleAudio();
    setIsMuted((m) => !m);
  };
  const onToggleVideo = () => {
    toggleVideo();
    setIsVideoOff((v) => !v);
  };

  const chatDisabled = !(status === "matched" && roomId);

  // derive right-pane overlay state
  const showSearching = status === "searching";
  const showConnecting = status === "matched" && !connected;

  return (
    <div className="min-h-screen bg-[#0a0f0d] flex flex-col font-sans">
      {/* Header */}
      <header className="fixed top-0 inset-x-0 z-50 h-16 bg-black/40 backdrop-blur-xl border-b border-white/5 flex items-center justify-between px-6 text-white/80">
        <button
          onClick={handleBackToDashboard}
          className="flex items-center gap-2 text-sm hover:text-white transition"
        >
          <ArrowLeft size={16} />
          <span className="hidden sm:inline">Dashboard</span>
        </button>

        <div className="flex items-center gap-2 text-xs font-medium">
          <Globe size={14} className="text-amber-400" />
          <span className="font-mono">{currentTime}</span>
        </div>
      </header>

      {/* Main */}
      <div className="flex-1 flex flex-col pt-16">
        {/* Video Area */}
        <div className="flex-1 p-4">
          {/* Mobile (WhatsApp-style) — remote fills, self as PiP */}
          <div className="relative md:hidden h-[52vh] min-h-[300px] rounded-lg overflow-hidden bg-black border border-white/10">
            {/* Remote */}
            <video
              ref={bindRemoteRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover bg-black"
            />
            {/* Overlays */}
            {showSearching && (
              <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center gap-4 z-20">
                <div className="w-16 h-16 border-4 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-sm text-white/80 font-medium">Searching for a partner...</p>
              </div>
            )}
            {showConnecting && (
              <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center gap-3 z-20">
                <div className="w-10 h-10 border-4 border-white/40 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-xs text-white/70">Connecting…</p>
              </div>
            )}

            {/* Remote label */}
            <div className="absolute bottom-3 left-3 bg-black/70 text-white px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-2 border border-white/20">
              <Users size={12} />
              <span>{peer?.username ?? peer?.userId ?? "Waiting..."}</span>
            </div>

            {/* Self PiP (ALWAYS VISIBLE) */}
            <div className="absolute bottom-3 right-3 z-30">
              <div className="relative w-28 h-40 sm:w-32 sm:h-48 rounded-lg overflow-hidden border border-white/20 bg-black/70 shadow-lg">
                <video
                  /* reuse same binder; attaching to multiple elements is fine for MediaStreams */
                  ref={bindSelfRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                />
                {/* When user's video is off, show a subtle cover */}
                {isVideoOff && (
                  <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
                    <VideoOff size={28} className="text-white/60" />
                  </div>
                )}
                <div className="absolute bottom-1.5 left-1.5 text-[10px] px-2 py-0.5 rounded-full bg-black/70 text-white/80 border border-white/20 flex items-center gap-1">
                  <User size={10} /> You
                </div>
              </div>
            </div>
          </div>

          {/* Desktop/Tablet — original 2-column grid */}
          <div className="hidden md:grid grid-cols-2 gap-4 h-[52vh] min-h-[360px]">
            {/* Self tile (ALWAYS VISIBLE) */}
            <div className="relative rounded-lg overflow-hidden bg-black/50 border border-white/10">
              <video
                ref={bindSelfRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover bg-black"
              />
              <div className="absolute bottom-3 left-3 text-white bg-black/70 px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-2 border border-white/20">
                <User size={12} /> You
              </div>
              {isVideoOff && (
                <div className="absolute inset-0 bg-black/90 flex items-center justify-center">
                  <VideoOff size={48} className="text-white/60" />
                </div>
              )}
            </div>

            {/* Stranger */}
            <div className="relative rounded-lg overflow-hidden bg-black border border-white/10">
              {showSearching && (
                <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center gap-4 z-20">
                  <div className="w-16 h-16 border-4 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-sm text-white/80 font-medium">Searching for a partner...</p>
                </div>
              )}

              {showConnecting && (
                <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center gap-3 z-20">
                  <div className="w-10 h-10 border-4 border-white/40 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-xs text-white/70">Connecting…</p>
                </div>
              )}

              <video
                ref={bindRemoteRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover bg-black"
              />
              <div className="absolute bottom-3 left-3 bg-black/70 text-white px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-2 border border-white/20">
                <Users size={12} />
                <span>{peer?.username ?? peer?.userId ?? "Waiting..."}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Panel */}
        <div className="bg-gradient-to-t from-black/80 via-black/40 to-transparent grid grid-cols-1 md:grid-cols-2 p-4">
          {/* Chat */}
          <div>
            <div className="bg-white/5 backdrop-blur-xl rounded-xl p-5 border border-white/10 w-full mx-auto">
              <div className="h-64 overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-white/20">
                {chatMessages.map((msg) => {
                  if (msg.system) {
                    return (
                      <div key={msg.id} className="text-center text-xs text-white/70 italic select-none">
                        {msg.text}
                      </div>
                    );
                  }
                  return (
                    <div key={msg.id} className={`flex ${msg.self ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[80%] px-4 py-2.5 rounded-lg text-sm font-medium ${
                          msg.self
                            ? "bg-gradient-to-r from-amber-500 to-yellow-500 text-black"
                            : "bg-white/10 text-white/90"
                        }`}
                      >
                        {msg.text}
                      </div>
                    </div>
                  );
                })}
                <div ref={messageEndRef} />
              </div>

              <form onSubmit={sendMessage} className="mt-4 flex gap-3">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder={chatDisabled ? "Not connected" : "Send a message..."}
                  disabled={chatDisabled}
                  className="flex-1 bg-white/10 border border-white/20 rounded-lg px-5 py-3 text-white placeholder-white/50 focus:border-amber-400 focus:outline-none transition text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <button
                  type="submit"
                  disabled={chatDisabled || !inputMessage.trim()}
                  className="p-3.5 bg-gradient-to-r from-amber-500 to-yellow-500 rounded-lg hover:shadow-lg hover:shadow-amber-500/30 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <Send size={20} className="text-black" />
                </button>
              </form>
            </div>
          </div>

          {/* Right panel */}
          <div className="p-6 space-y-6">
            {/* Keywords */}
            <div className="flex flex-wrap justify-center gap-3">
              {keywords.map((kw, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-yellow-500 text-black text-xs font-bold px-4 py-2 rounded-full shadow-lg"
                >
                  <span>{kw}</span>
                  <button
                    onClick={() => removeKeyword(i)}
                    className="ml-1 w-4 h-4 rounded-full flex items-center justify-center bg-black/50"
                  >
                    <X size={10} className="text-white" />
                  </button>
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-center gap-6">
              <button
                onClick={handleEnd}
                className="flex items-center gap-3 px-8 py-4 bg-red-500/20 border border-red-500/40 text-red-400 rounded-full hover:bg-red-500/30"
              >
                <Power size={22} /> End Chat
              </button>

              {status === "matched" ? (
                <button
                  onClick={handleNext}
                  className="flex items-center gap-3 px-8 py-4 bg-white/10 border border-white/30 text-white rounded-full hover:bg-white/20"
                >
                  <RotateCcw size={22} /> Next
                </button>
              ) : (
                <button
                  onClick={handleStart}
                  disabled={status === "searching"}
                  className="flex items-center gap-3 px-8 py-4 bg-white/10 border border-white/30 text-white rounded-full hover:bg-white/20 disabled:opacity-60"
                >
                  <RotateCcw size={22} /> {status === "searching" ? "Searching..." : "Start Video Chat"}
                </button>
              )}
            </div>

            {/* Controls */}
            <div className="flex justify-center items-center gap-8">
              <button
                onClick={onToggleMute}
                className={`p-4 rounded-full ${
                  isMuted ? "bg-red-500/30 border border-red-500/50" : "bg-white/10 border border-white/20 hover:bg-white/20"
                }`}
              >
                {isMuted ? <MicOff size={24} className="text-red-400" /> : <Mic size={24} className="text-white" />}
              </button>

              <button
                onClick={onToggleVideo}
                className={`p-4 rounded-full ${
                  isVideoOff ? "bg-red-500/30 border border-red-500/50" : "bg-white/10 border border-white/20 hover:bg-white/20"
                }`}
              >
                {isVideoOff ? <VideoOff size={24} className="text-red-400" /> : <VideoIcon size={24} className="text-white" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
