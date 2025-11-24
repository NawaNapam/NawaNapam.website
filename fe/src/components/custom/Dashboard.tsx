"use client";

import { useGetUser } from "@/hooks/use-getuser";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Edit3,
  Video,
  User,
  Users,
  Clock,
  ThumbsUp,
  LogOut,
  Sparkles,
  X,
  Filter,
  Globe,
  Heart,
  Zap,
} from "lucide-react";
import Image from "next/image";
import Header from "./Header";
import { useSignaling } from "@/hooks/SocketProvider";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function Dashboard() {
  const { data: session, status } = useSession();
  const user = useGetUser();

  const [stats] = useState({
    strangersConnected: 47,
    timeSpent: "3h 24m",
    likesReceived: 12,
  });

  const [keywords, setKeywords] = useState<string[]>([
    "cricket",
    "bollywood",
    "chai",
  ]);
  const [inputValue, setInputValue] = useState("");
  const [currentTime, setCurrentTime] = useState("");

  // Live IST Time
  useEffect(() => {
    const update = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        }) + " IST"
      );
    };
    update();
    const int = setInterval(update, 1000);
    return () => clearInterval(int);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && inputValue.trim()) {
      e.preventDefault();
      const val = inputValue.trim();
      if (!keywords.includes(val)) setKeywords((prev) => [...prev, val]);
      setInputValue("");
    }
  };

  const router = useRouter();

  const handleStart = (e?: React.MouseEvent) => {
    e?.preventDefault();
    // if (!session?.user?.email) {
    //   toast.error("Please sign in to start video chat.");
    //   router.push("/api/auth/signin"); // or your sign-in route
    //   return;
    // }
    router.push("/chat"); // VideoChat page will auto-start
  };

  const removeKeyword = (i: number) =>
    setKeywords((prev) => prev.filter((_, idx) => idx !== i));

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a140a] via-[#0f1a0f] to-[#0a140a] flex items-center justify-center">
        <div className="text-amber-300 text-lg font-medium animate-pulse">
          Loading your dashboard...
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a140a] via-[#0f1a0f] to-[#0a140a] flex items-center justify-center">
        <div className="text-amber-200 text-lg">
          Please sign in to access your dashboard.
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a140a] via-[#0f1a0f] to-[#0a140a]">
      {/* Dashboard Header */}
      <Header />

      {/* Main Dashboard Grid */}
      <main className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-15">
          {/* Profile Card */}
          {/* <div className="group bg-white/8 backdrop-blur-2xl rounded-3xl p-8 shadow-2xl border border-amber-500/30 hover:shadow-amber-500/20 transition-all duration-500">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-amber-100">Your Profile</h2>
              <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-600 text-white shadow-lg">
                <User size={20} />
              </div>
            </div>

            <div className="space-y-5 text-sm">
              <div className="flex justify-between"><span className="text-amber-200/70">Email</span><span className="text-amber-100 font-medium truncate max-w-[200px]">{session.user?.email}</span></div>
              <div className="flex justify-between"><span className="text-amber-200/70">Username</span><span className="text-amber-100 font-medium">{user?.username || "Not set"}</span></div>
              <div className="flex justify-between"><span className="text-amber-200/70">Full Name</span><span className="text-amber-100 font-medium">{session.user?.name || "Not set"}</span></div>
            </div>

            <Link href="/settings/update" className="mt-8 w-full flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-600 text-black font-bold rounded-2xl hover:shadow-2xl hover:shadow-amber-500/40 transition-all">
              <Edit3 size={18} /> Edit Profile
            </Link>
          </div> */}

          {/* Stats Card */}
          <div className="bg-white/8 backdrop-blur-2xl rounded-md p-8 shadow-2xl border border-amber-500/30">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-amber-100">Your Journey</h2>
              <Sparkles size={26} className="text-amber-400" />
            </div>

            <div className="space-y-6 md:flex md:gap-5 md:items-center md:justify-between lg:block mt-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-md bg-amber-500/20">
                    <Users size={22} className="text-amber-400" />
                  </div>
                  <div>
                    <p className="text-amber-200/70 text-sm">
                      Strangers Connected
                    </p>
                    <p className="text-xl font-black text-amber-100">
                      {stats.strangersConnected}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-md bg-yellow-500/20">
                    <Clock size={22} className="text-yellow-400" />
                  </div>
                  <div>
                    <p className="text-amber-200/70 text-sm">
                      Time Spent Chatting
                    </p>
                    <p className="text-xl font-black text-amber-100">
                      {stats.timeSpent}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-md bg-rose-500/20">
                    <Heart size={22} className="text-rose-400" />
                  </div>
                  <div>
                    <p className="text-amber-200/70 text-sm">Likes Received</p>
                    <p className="text-xl font-black text-amber-100">
                      {stats.likesReceived}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white/8 backdrop-blur-2xl rounded-xl p-8 shadow-2xl border border-amber-500/30">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-amber-100">
                Quick Actions
              </h2>
              <Zap size={26} className="text-amber-400" />
            </div>

            <div className="space-y-6">
              <Link
                href=""
                className="group w-full text-center py-4 bg-gradient-to-r from-amber-500 to-yellow-600 text-black font-bold text-md rounded-lg transition-all flex items-center justify-center gap-3"
                onClick={handleStart}
              >
                <Video
                  size={24}
                  className="group-hover:rotate-12 transition-transform hidden sm:block"
                />{" "}
                Start Video Chat Now
              </Link>

              {/* Interest Keywords */}
              <div>
                <label className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                  Match by Interests
                </label>
                <div className="mt-3 p-4 bg-white/5 rounded-lg border border-amber-500/30 min-h-[64px] flex flex-wrap items-center gap-2">
                  {keywords.map((kw, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-2 px-2 py-1 bg-gradient-to-r from-amber-500 to-yellow-600 text-black text-sm font-bold rounded-full"
                    >
                      {kw}
                      <button
                        onClick={() => removeKeyword(i)}
                        className="hover:bg-black/20 rounded-full p-1 transition"
                      >
                        <X size={14} />
                      </button>
                    </span>
                  ))}
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={
                      keywords.length === 0 ? "Type interest + Enter" : ""
                    }
                    className="flex-1 bg-transparent text-amber-100 placeholder-amber-300/50 outline-none text-sm min-w-[140px]"
                  />
                </div>
              </div>

              <button
                disabled={keywords.length === 0}
                className="w-full py-3.5 bg-amber-500/10 border border-amber-500/50 text-amber-300 font-bold rounded-lg hover:bg-amber-500/20 disabled:opacity-40 flex items-center justify-center gap-2 transition-all"
              >
                <Filter size={18} /> Apply Filters ({keywords.length})
              </button>

              {/* <Link href="/history" className="block text-center py-3.5 border border-amber-500/40 text-amber-300 font-medium rounded-lg hover:bg-amber-500/10 hover:border-amber-400 transition-all">
                View Chat History
              </Link> */}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
