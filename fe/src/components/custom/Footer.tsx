"use client";

import { useState } from "react";
import Image from "next/image";
import { X, Heart, ArrowUp, Mail } from "lucide-react";

const policies = {
  "Privacy Policy": [
    "User Data Collection: We collect basic info such as name, email, camera/mic access for video calls, and device data.",
    "Video & Audio Call Privacy: Calls are encrypted and not recorded unless permission is obtained.",
    "Personal Data Storage: Data stored securely and never sold to third parties.",
    "Camera & Mic Permissions: Only used during video calls; no gallery access.",
    "Cookies & Tracking: Used for login and analytics.",
    "Third-Party Services: Services like WebRTC, Firebase, Agora may process technical data.",
    "Children Safety: Underage protection ensured.",
    "User Rights: Right to delete or request data.",
    "Data Security Measures: HTTPS, encryption, and security audits.",
    "Policy Changes: Users get notified when policy updates.",
    "Contact Information: Support details available for queries.",
  ],
  "Terms of Service": [
    "Acceptance of Terms: Using the website means agreeing to all terms.",
    "Eligibility: Minimum age requirement and no fake accounts.",
    "User Account Rules: Provide correct info and maintain account security.",
    "Prohibited Activities: No harassment, nudity, threats, fraud, or hacking.",
    "Call Rules: No recording without permission; no abuse.",
    "Privacy & Security: Data handled as per privacy policy.",
    "Account Termination: Violations lead to suspension or ban.",
    "Limitation of Liability: Service disruptions not guaranteed.",
    "Service Changes: Website may update features anytime.",
    "Payment Rules: Secure payments and refund policy if applicable.",
    "Dispute Resolution: Local legal jurisdiction applies.",
  ],
  "Community Guidelines": [
    "Respectful Communication: No abuse, hate speech, or threats.",
    "No Nudity or Sexual Content: Strictly banned.",
    "No Violence: No harmful or violent behavior.",
    "No Illegal Activities: No drugs, scams, weapons, or fraud.",
    "Privacy Protection: No recording or sharing others' data.",
    "No Spam: No unwanted promotions.",
    "Safe Camera Usage: No inappropriate actions.",
    "Underage Safety: No child exploitation.",
    "Follow Laws: User must follow local rules.",
    "Reporting: Users may report violations.",
  ],
  "Data Safety": [
    "Data Collection Transparency: Only necessary data is collected.",
    "No Recording Without Permission: Calls are never stored by default.",
    "Encryption: Video calls are encrypted using WebRTC.",
    "Secure Storage: Passwords encrypted; no data selling.",
    "Permission Safety: Camera/mic used only during calls.",
    "Child Safety: Strict protection for minors.",
    "Data Sharing Rules: Only technical providers or legal requests.",
    "Payment Safety: Secure gateways used.",
    "Account Security: Strong password & optional 2FA.",
    "Data Breach Prevention: Firewalls and monitoring.",
    "User Responsibility: Keep account secure.",
    "Data Retention: Data deleted after account removal.",
  ],
  "Our Founders": ["Mangal Hansada", "Sambara Hansda"],
};

export default function Footer() {
  const [modalOpen, setModalOpen] = useState<string | null>(null);
  const currentYear = new Date().getFullYear();

  return (
    <>
      <footer className="relative bg-black/60 backdrop-blur-2xl border-t border-amber-500/20">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-500/40 to-transparent" />

        <div className="container mx-auto px-6 py-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 items-center">
            {/* Brand */}
            <div className="text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-4 mb-4">
                <div className="w-12 h-12 rounded-full overflow-hidden ring-4 ring-amber-500/30 shadow-2xl shadow-amber-500/20">
                  <Image
                    src="/images/logo.jpg"
                    alt="NawaNapam"
                    width={48}
                    height={48}
                    className="object-cover"
                  />
                </div>
                <h4
                  className="text-2xl font-black tracking-tight"
                  style={{ fontFamily: "var(--font-cinzel), serif" }}
                >
                  <span className="bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-300 bg-clip-text text-transparent">
                    NawaNapam
                  </span>
                </h4>
              </div>
              <p className="text-xs text-amber-200/70">
                Connecting souls with respect and warmth
              </p>
              <a
                href="mailto:support@nawanapam.com"
                className="flex items-center justify-center md:justify-start gap-2 mt-4 text-sm text-amber-300 hover:text-amber-100 transition-all group"
              >
                <div className="p-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 group-hover:bg-amber-500/20 transition-all">
                  <Mail
                    size={14}
                    className="group-hover:scale-110 transition-transform"
                  />
                </div>
                <span className="font-medium">support@nawanapam.com</span>
              </a>
            </div>

            {/* Policy Links */}
            <div className="flex flex-wrap justify-center gap-6 text-sm">
              {Object.keys(policies).map((policy) => (
                <button
                  key={policy}
                  onClick={() => setModalOpen(policy)}
                  className="text-amber-300 hover:text-amber-100 font-medium transition-all hover:translate-y-[-2px]"
                >
                  {policy.replace(/ of | /g, " ")}
                </button>
              ))}
            </div>

            {/* Back to Top */}
            <div className="text-center md:text-right">
              <button
                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                className="inline-flex items-center gap-2 text-sm font-medium text-amber-300 hover:text-amber-100 transition-all group"
              >
                <div className="p-2 rounded-full bg-amber-500/10 border border-amber-500/30 group-hover:bg-amber-500/20 transition-all">
                  <ArrowUp
                    size={16}
                    className="group-hover:-translate-y-1 transition-transform"
                  />
                </div>
                Back to Top
              </button>
            </div>
          </div>

          {/* Bottom */}
          <div className="mt-12 pt-8 border-t border-amber-500/20 text-center text-xs text-amber-200/60">
            <p>
              © {currentYear} NawaNapam. Made with{" "}
              <Heart
                className="inline fill-amber-400 text-amber-400"
                size={12}
              />{" "}
              in India
            </p>
          </div>
        </div>

        <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-transparent via-amber-500/30 to-transparent" />
      </footer>

      {/* Modal Overlay */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl"
          onClick={() => setModalOpen(null)}
        >
          <div
            className="relative w-full max-w-2xl max-h-[85vh] bg-gradient-to-b from-[#0f1a0f] to-[#0a140a] rounded-3xl shadow-2xl border border-amber-500/30 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-8 pb-4 bg-gradient-to-r from-amber-500/20 to-yellow-600/20 border-b border-amber-500/30">
              <div className="flex justify-between items-center">
                <h2
                  className="text-2xl font-black text-amber-100"
                  style={{ fontFamily: "var(--font-cinzel), serif" }}
                >
                  {modalOpen}
                </h2>
                <button
                  onClick={() => setModalOpen(null)}
                  className="p-3 rounded-full bg-white/10 hover:bg-white/20 transition-all"
                >
                  <X size={20} className="text-amber-300" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-8 pt-6 overflow-y-auto max-h-[65vh] scrollbar-thin scrollbar-thumb-amber-500/30">
              <ol className="space-y-4 text-amber-100/90 text-sm leading-relaxed">
                {policies[modalOpen as keyof typeof policies].map((item, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="font-bold text-amber-400">{i + 1}.</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ol>
            </div>

            <div className="p-6 bg-black/40 border-t border-amber-500/20 text-center">
              <p className="text-xs text-amber-300">
                Last updated: November 2025
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
