"use client";

import Header from "@/components/custom/Header";
import HeroSection from "@/components/custom/HeroSection";
import Footer from "@/components/custom/Footer";

export default function Landing() {
  return (
    <main className="min-h-screen flex flex-col bg-gradient-to-br from-[#0f1a0f] via-[#1a2d1a] to-[#0f1a0f]">
      <Header />
      <section className="flex-1 flex flex-col justify-center items-center w-full">
        <HeroSection />
      </section>
      <Footer />
    </main>
  );
}
