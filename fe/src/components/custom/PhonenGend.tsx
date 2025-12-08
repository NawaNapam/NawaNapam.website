"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function CompleteProfile() {
  const router = useRouter();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [countryCode, setCountryCode] = useState("+91");
  const [gender, setGender] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!phoneNumber || !gender) alert("Please fill the data");

    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(phoneNumber)) {
      alert("Enter a valid phone number");
      return;
    }

    setLoading(true);

    const res = await fetch("/api/updateuser", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        phoneNumber: `${countryCode}${phoneNumber}`,
        gender,
      }),
    });

    if (res.ok) router.push("/dashboard");
    else alert("Error updating profile");
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0a140a] to-[#1b2b1b] p-4">
      <form
        onSubmit={handleSubmit}
        className="bg-white/10 p-8 rounded-xl shadow-lg border border-amber-500/30 w-full max-w-md"
      >
        <h1 className="text-2xl font-bold text-amber-300 mb-6">
          Complete Your Profile
        </h1>

        <div className="flex gap-2 mb-4">
          <select
            value={countryCode}
            onChange={(e) => setCountryCode(e.target.value)}
            className="w-24 h-12 bg-white/10 border-amber-500/30 text-amber-500/90 rounded-md focus:border-amber-400 p-2"
          >
            <option value="+91"> +91</option>
            <option value="+1"> +1</option>
            <option value="+44"> +44</option>
          </select>
          <Input
            type="tel"
            placeholder="Phone number"
            required
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            className="flex-1 h-12 bg-white/10 border-amber-500/30 text-amber-50 placeholder-amber-200/50 focus:border-amber-400 rounded-md"
          />
        </div>

        <select
          required
          value={gender}
          onChange={(e) => setGender(e.target.value)}
          className="w-full h-12 bg-white/10 border-amber-500/30 text-amber-500/90 rounded-md focus:border-amber-400 focus:ring-amber-400/20 mb-6 p-2"
        >
          <option value="">Select Gender</option>
          <option value="MALE">Male</option>
          <option value="FEMALE">Female</option>
          <option value="OTHER">Other</option>
        </select>

        <Button
          type="submit"
          disabled={loading}
          className="w-full h-13 bg-gradient-to-r from-amber-500 to-yellow-600 text-black font-bold text-lg rounded-md shadow-xl cursor-pointer"
        >
          {loading ? "Updating..." : "Continue"}
        </Button>
      </form>
    </div>
  );
}
