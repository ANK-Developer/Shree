import React, { useState } from "react";

const links = [
  { label: "होम / Home", href: "#home" },
  { label: "सदस्यता / Membership", href: "#membership" },
  { label: "संपर्क / Contact", href: "#contact" },
];

const Navbar = () => {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-royal-600 shadow-lg border-b-4 border-gold-500">
      <nav className="max-w-6xl mx-auto flex items-center justify-between px-4 py-2">
        <a href="#home" className="flex items-center gap-3">
          <img src="/logo.jpeg" alt="श्री कृष्णा महारानी मण्डल" className="h-12 w-12 md:h-14 md:w-14 rounded-full bg-white object-cover ring-2 ring-gold-500" />
          <div className="leading-tight">
            <p className="text-gold-400 font-bold text-base md:text-xl">श्री कृष्णा महारानी मण्डल (रजि.)</p>
            <p className="text-royal-100 text-[11px] md:text-xs tracking-wide">शालीमार बाग, दिल्ली</p>
          </div>
        </a>

        <ul className="hidden md:flex items-center gap-1">
          {links.map((l) => (
            <li key={l.href}>
              <a href={l.href} className="px-3 py-2 rounded-md text-sm font-medium text-white hover:bg-royal-700 hover:text-gold-400 transition">
                {l.label}
              </a>
            </li>
          ))}
          <li>
            <a href="#membership" className="ml-2 px-4 py-2 rounded-full text-sm font-bold bg-gold-500 text-royal-900 hover:bg-gold-400 transition">
              Join Now
            </a>
          </li>
        </ul>

        <button type="button" onClick={() => setOpen(!open)} aria-label="Toggle menu" className="md:hidden p-2 rounded-md text-white hover:bg-royal-700">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {open ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </nav>

      {open && (
        <ul className="md:hidden bg-royal-700 px-4 pb-3">
          {links.map((l) => (
            <li key={l.href}>
              <a href={l.href} onClick={() => setOpen(false)} className="block py-2 text-white hover:text-gold-400">
                {l.label}
              </a>
            </li>
          ))}
        </ul>
      )}
    </header>
  );
};

export default Navbar;
