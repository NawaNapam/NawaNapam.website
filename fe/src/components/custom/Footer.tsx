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
      <footer className="bg-background border-t border-border">
        <div className="container mx-auto px-6 py-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 items-center">
            {/* Brand */}
            <div className="text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-3 mb-4">
                <div className="w-10 h-10 rounded-full overflow-hidden border border-border">
                  <Image
                    src="/images/logo.jpg"
                    alt="NawaNapam"
                    width={40}
                    height={40}
                    className="object-cover"
                  />
                </div>
                <h4 className="text-xl font-medium tracking-tight text-foreground">
                  NawaNapam
                </h4>
              </div>
              <p className="text-xs text-muted-foreground">
                Connecting souls with respect and warmth
              </p>
              <a
                href="mailto:support@nawanapam.com"
                className="flex items-center justify-center md:justify-start gap-2 mt-4 text-sm text-link hover:text-link-active transition-colors"
              >
                <Mail size={14} />
                <span className="font-medium">support@nawanapam.com</span>
              </a>
            </div>

            {/* Policy Links */}
            <div className="flex flex-wrap justify-center gap-6 text-sm">
              {Object.keys(policies).map((policy) => (
                <button
                  key={policy}
                  onClick={() => setModalOpen(policy)}
                  className="text-body hover:text-foreground font-medium transition-colors"
                >
                  {policy.replace(/ of | /g, " ")}
                </button>
              ))}
            </div>

            {/* Back to Top */}
            <div className="text-center md:text-right">
              <button
                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                className="inline-flex items-center gap-2 text-sm font-medium text-body hover:text-foreground transition-colors group"
              >
                <div className="p-2 rounded-full border border-border group-hover:bg-accent transition-colors">
                  <ArrowUp size={16} />
                </div>
                Back to Top
              </button>
            </div>
          </div>

          {/* Bottom */}
          <div className="mt-12 pt-8 border-t border-border text-center text-xs text-muted-foreground">
            <p>
              © {currentYear} NawaNapam. Made with{" "}
              <Heart className="inline fill-current text-signature-coral" size={12} />{" "}
              in India
            </p>
          </div>
        </div>
      </footer>

      {/* Modal Overlay */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/50"
          onClick={() => setModalOpen(null)}
        >
          <div
            className="relative w-full max-w-2xl max-h-[85vh] bg-card rounded-lg border border-border overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-8 pb-4 border-b border-border">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-medium text-foreground">
                  {modalOpen}
                </h2>
                <button
                  onClick={() => setModalOpen(null)}
                  className="p-2 rounded-full border border-border hover:bg-accent transition-colors"
                >
                  <X size={20} className="text-foreground" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-8 pt-6 overflow-y-auto max-h-[65vh]">
              <ol className="space-y-4 text-body text-sm leading-relaxed">
                {policies[modalOpen as keyof typeof policies].map((item, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="font-medium text-foreground">{i + 1}.</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ol>
            </div>

            <div className="p-6 border-t border-border text-center">
              <p className="text-xs text-muted-foreground">
                Last updated: November 2025
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
