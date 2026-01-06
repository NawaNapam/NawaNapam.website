"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Pencil, ArrowLeft, Check, Globe } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { useGetUser } from "@/hooks/use-getuser";

// ---------- Types ----------
type GenderType = "MALE" | "FEMALE" | "OTHER";

type FormDataState = {
  name: string;
  username: string;
  email: string;
  location: string;
  phoneNumber: string;
  gender: GenderType;
};

// ---------- Component ----------
export default function ProfileSettingsPage() {
  const user = useGetUser();
  const [isEditing, setIsEditing] = useState<keyof FormDataState | null>(null);
  const [currentTime, setCurrentTime] = useState("");
  const [savingField, setSavingField] = useState<keyof FormDataState | null>(
    null
  );

  const [formData, setFormData] = useState<FormDataState>({
    name: "",
    username: "",
    email: "",
    location: "India",
    phoneNumber: "",
    gender: "OTHER",
  });

  // ---------- Load user ----------
  useEffect(() => {
    if (!user) return;
    setFormData({
      name: user.name ?? "",
      username: user.username ?? "",
      email: user.email ?? "",
      location: "India",
      phoneNumber: user.phoneNumber ?? "",
      gender: user.gender ?? "OTHER",
    });
  }, [user]);

  // ---------- Time update ----------
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

  // ---------- Helpers ----------
  const setField = <K extends keyof FormDataState>(
    key: K,
    value: FormDataState[K]
  ) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  async function handleSave(field: keyof FormDataState) {
    const value = (formData[field] ?? "").toString().trim();

    // Strict validations
    if (!value && ["username", "email", "name"].includes(field)) {
      toast.error("Please provide a valid value");
      return;
    }

    if (field === "phoneNumber" && !/^\d{10,15}$/.test(value)) {
      toast.error("Enter a valid phone number (10–15 digits)");
      return;
    }

    setSavingField(field);
    try {
      let res = await fetch("/api/updateuser", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      });

      // Fallback to POST if PUT is not allowed (405 error)
      if (res.status === 405) {
        res = await fetch("/api/updateuser", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ [field]: value }),
        });
      }

      // Handle non-JSON responses (like 500 error pages)
      const contentType = res.headers.get("content-type");
      if (!contentType?.includes("application/json")) {
        throw new Error("Server error - please try again later");
      }

      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.message || `Failed to update ${field}`);
      } else {
        toast.success(`${field} updated successfully`);
        setIsEditing(null);
      }
    } catch (err) {
      console.error("Update error:", err);
      toast.error("Something went wrong while updating");
    } finally {
      setSavingField(null);
    }
  }

  // ---------- UI ----------
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a140a] via-[#0f1a0f] to-[#0a140a] text-amber-100">
      {/* Header */}
      <header className="fixed top-0 inset-x-0 z-50 h-16 bg-white/5 backdrop-blur-2xl border-b border-amber-500/20 flex items-center justify-between px-6">
        <Link
          href="/dashboard"
          className="group flex items-center gap-2 text-amber-200 hover:text-amber-100 text-sm font-medium transition-all"
        >
          <ArrowLeft
            size={16}
            className="group-hover:-translate-x-1 transition-transform"
          />
          Dashboard
        </Link>
        <div className="flex items-center gap-2 text-amber-200 text-xs font-medium">
          <Globe size={14} className="text-amber-400" />
          <span className="font-mono tracking-wider">{currentTime}</span>
        </div>
      </header>

      {/* Main */}
      <main className="pt-20 pb-10 px-6 max-w-2xl mx-auto">
        <div className="text-center mb-12">
          <h1
            className="text-4xl font-black tracking-tight bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-300 bg-clip-text text-transparent"
            style={{ fontFamily: "var(--font-cinzel), serif" }}
          >
            Profile Settings
          </h1>
          <p className="text-amber-200/70 mt-3">
            Make your presence truly yours
          </p>
        </div>

        {/* Avatar */}
        <div className="flex justify-center mb-10">
          <div className="relative group">
            <Avatar className="w-32 h-32 ring-4 ring-amber-500/40 shadow-2xl">
              <AvatarImage src={user?.image || ""} />
              <AvatarFallback className="bg-gradient-to-br from-amber-500 to-yellow-600 text-black text-3xl font-bold">
                {(user?.name || "U").charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <button className="absolute bottom-2 right-2 p-3 bg-gradient-to-r from-amber-500 to-yellow-600 rounded-full shadow-xl opacity-0 group-hover:opacity-100 transition-all hover:scale-110">
              <Pencil size={18} className="text-black" />
            </button>
          </div>
        </div>

        {/* Editable Fields */}
        <div className="space-y-6 bg-white/5 backdrop-blur-2xl rounded-xl p-8 border border-amber-500/20 shadow-2xl">
          {/* Full Name */}
          <EditableField
            label="Full Name"
            field="name"
            value={formData.name}
            isEditing={isEditing}
            setIsEditing={setIsEditing}
            setField={setField}
            handleSave={handleSave}
            savingField={savingField}
          />

          {/* Username */}
          <EditableField
            label="Username"
            field="username"
            value={formData.username}
            isEditing={isEditing}
            setIsEditing={setIsEditing}
            setField={setField}
            handleSave={handleSave}
            savingField={savingField}
          />

          {/* Email */}
          <EditableField
            label="Email"
            field="email"
            value={formData.email}
            isEditing={isEditing}
            setIsEditing={setIsEditing}
            setField={setField}
            handleSave={handleSave}
            savingField={savingField}
          />

          {/* Location */}
          <EditableField
            label="Location"
            field="location"
            value={formData.location}
            isEditing={isEditing}
            setIsEditing={setIsEditing}
            setField={setField}
            handleSave={handleSave}
            savingField={savingField}
          />

          {/* Phone Number (strict) */}
          <EditableField
            label="Phone Number"
            field="phoneNumber"
            value={formData.phoneNumber}
            type="tel"
            placeholder="Enter 10–15 digit number"
            isEditing={isEditing}
            setIsEditing={setIsEditing}
            setField={setField}
            handleSave={handleSave}
            savingField={savingField}
          />

          {/* Gender (Dropdown) */}
          <div className="group relative">
            <label className="text-amber-200/70 text-sm font-medium">
              Gender
            </label>
            {isEditing === "gender" ? (
              <div className="mt-2 flex items-center gap-3">
                <select
                  value={formData.gender}
                  onChange={(e) =>
                    setField("gender", e.target.value as GenderType)
                  }
                  className="flex-1 bg-white/10 border border-amber-500/40 rounded-lg px-4 py-3 text-amber-100 focus:border-amber-400 outline-none transition-all"
                >
                  <option value="MALE">MALE</option>
                  <option value="FEMALE">FEMALE</option>
                  <option value="OTHER">OTHER</option>
                </select>
                <button
                  onClick={() => handleSave("gender")}
                  disabled={savingField === "gender"}
                  className="p-3 bg-gradient-to-r from-amber-500 to-yellow-600 rounded-lg hover:shadow-lg hover:shadow-amber-500/40 transition-all disabled:opacity-60"
                >
                  <Check size={18} className="text-black" />
                </button>
              </div>
            ) : (
              <div className="mt-2 flex items-center justify-between">
                <p className="text-amber-100 font-medium py-3">
                  {formData.gender}
                </p>
                <button
                  onClick={() => setIsEditing("gender")}
                  className="p-2.5 rounded-full bg-white/10 hover:bg-amber-500/20 transition-all"
                >
                  <Pencil size={16} className="text-amber-400" />
                </button>
              </div>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-amber-200/50 mt-8">
          Your profile reflects who you are. Make it authentic.
        </p>
      </main>
    </div>
  );
}

// ---------- Reusable EditableField ----------
function EditableField({
  label,
  field,
  value,
  isEditing,
  setIsEditing,
  setField,
  handleSave,
  savingField,
  type = "text",
  placeholder,
}: {
  label: string;
  field: keyof FormDataState;
  value: string;
  isEditing: keyof FormDataState | null;
  setIsEditing: React.Dispatch<
    React.SetStateAction<keyof FormDataState | null>
  >;
  setField: <K extends keyof FormDataState>(
    key: K,
    value: FormDataState[K]
  ) => void;
  handleSave: (field: keyof FormDataState) => void;
  savingField: keyof FormDataState | null;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div className="group relative">
      <label className="text-amber-200/70 text-sm font-medium">{label}</label>
      {isEditing === field ? (
        <div className="mt-2 flex items-center gap-3">
          <Input
            type={type}
            value={value}
            placeholder={placeholder}
            onChange={(e) => setField(field, e.target.value as never)}
            className="flex-1 bg-white/10 border-amber-500/40 text-amber-100 placeholder-amber-300/60 focus:border-amber-400 rounded-lg h-12"
          />
          <button
            onClick={() => handleSave(field)}
            disabled={savingField === field}
            className="p-3 bg-gradient-to-r from-amber-500 to-yellow-600 rounded-lg hover:shadow-lg hover:shadow-amber-500/40 transition-all disabled:opacity-60"
          >
            <Check size={18} className="text-black" />
          </button>
        </div>
      ) : (
        <div className="mt-2 flex items-center justify-between">
          <p className="text-amber-100 font-medium py-3">
            {value || "(Not set)"}
          </p>
          <button
            onClick={() => setIsEditing(field)}
            className="p-2.5 rounded-full bg-white/10 hover:bg-amber-500/20 transition-all"
          >
            <Pencil size={16} className="text-amber-400" />
          </button>
        </div>
      )}
    </div>
  );
}
