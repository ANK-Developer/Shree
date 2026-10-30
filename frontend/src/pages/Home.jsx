import React from "react";
import { Link } from "react-router-dom";

// Public landing page (website abhi ban rahi hai)
const Home = () => (
  <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-royal-900 via-royal-700 to-royal-500 text-white">
    {/* Background glow */}
    <div className="pointer-events-none absolute -top-32 -left-32 h-96 w-96 rounded-full bg-gold-500/25 blur-3xl" />
    <div className="pointer-events-none absolute -bottom-40 -right-24 h-[28rem] w-[28rem] rounded-full bg-pink-brand/25 blur-3xl" />
    <div className="pointer-events-none absolute top-1/3 right-1/4 h-40 w-40 rounded-full bg-gold-400/10 blur-2xl" />

    <main className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 py-12 text-center">
      <div className="relative mb-8">
        <span className="absolute inset-0 rounded-full bg-gold-400/40 animate-ping [animation-duration:3s]" />
        <img
          src="/logo.jpeg"
          alt="श्री कृष्णा महारानी मण्डल"
          className="relative h-36 w-36 md:h-44 md:w-44 rounded-full bg-white object-cover ring-4 ring-gold-500 shadow-2xl"
        />
      </div>

      <h1 className="text-3xl md:text-5xl font-bold text-gold-400 drop-shadow">श्री कृष्णा महारानी मण्डल (रजि.)</h1>
      <p className="mt-2 text-sm md:text-base tracking-widest text-royal-100">शालीमार बाग, दिल्ली</p>

      <div className="my-8 flex items-center gap-3">
        <span className="h-px w-12 md:w-20 bg-gold-500/70" />
        <span className="text-gold-400 text-xl">✦</span>
        <span className="h-px w-12 md:w-20 bg-gold-500/70" />
      </div>

      <h2 className="text-5xl md:text-7xl font-extrabold tracking-tight">
        Coming <span className="bg-gradient-to-r from-gold-400 to-gold-600 bg-clip-text text-transparent">Soon</span>
      </h2>
      <p className="mt-5 max-w-xl text-base md:text-lg text-royal-100">
        हमारी नई वेबसाइट जल्द ही आपके सामने होगी।
        <br />
        Our new website is on its way. Stay tuned!
      </p>

      <div className="mt-8 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-5 py-2 text-sm backdrop-blur">
        <span className="h-2 w-2 rounded-full bg-leaf animate-pulse" />
        Work in progress
      </div>
    </main>

    <footer className="absolute bottom-0 inset-x-0 z-10 flex flex-col sm:flex-row items-center justify-between gap-2 px-6 py-4 text-xs text-royal-100/80">
      <p>© {new Date().getFullYear()} श्री कृष्णा महारानी मण्डल (रजि.)</p>
      <Link to="/admin/login" className="hover:text-gold-400 transition">Admin Login</Link>
    </footer>
  </div>
);

export default Home;
