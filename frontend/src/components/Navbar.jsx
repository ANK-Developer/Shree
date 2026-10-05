import React from "react";

const Navbar = () => (
  <header className="sticky top-0 z-50 bg-royal-600 shadow-lg border-b-4 border-gold-500">
    <nav className="max-w-6xl mx-auto flex items-center justify-between px-4 py-2">
      <a href="#home" className="flex items-center gap-3">
        <img src="/logo.jpeg" alt="श्री कृष्णा महारानी मण्डल" className="h-12 w-12 md:h-14 md:w-14 rounded-full bg-white object-cover ring-2 ring-gold-500" />
        <div className="leading-tight">
          <p className="text-gold-400 font-bold text-base md:text-xl">श्री कृष्णा महारानी मण्डल (रजि.)</p>
          <p className="text-royal-100 text-[11px] md:text-xs tracking-wide">शालीमार बाग, दिल्ली</p>
        </div>
      </a>
    </nav>
  </header>
);

export default Navbar;
